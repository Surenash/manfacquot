import logging
import os
import tempfile
from decimal import Decimal # For precise arithmetic

import boto3
from botocore.exceptions import ClientError
from celery import shared_task
from django.conf import settings
from django.db import transaction

from .models import Design, DesignStatus

# Attempt to import numpy-stl
try:
    import numpy
    from stl import mesh as stl_mesh
    NUMPY_STL_AVAILABLE = True
except ImportError:
    NUMPY_STL_AVAILABLE = False
    stl_mesh = None

# Attempt to import steputils
try:
    import steputils.p21
    STEPUTILS_AVAILABLE = True
except ImportError:
    STEPUTILS_AVAILABLE = False
    steputils = None

logger = logging.getLogger(__name__)

def perform_stl_analysis(file_path):
    """
    Performs CAD analysis on an STL file using numpy-stl.
    Extracts volume, bounding box, surface area, and a complexity score.
    Assumes STL units are in millimeters (mm).
    """
    if not NUMPY_STL_AVAILABLE:
        logger.error("numpy-stl library is not available. Cannot perform STL analysis.")
        raise RuntimeError("STL analysis library (numpy-stl) not installed.")

    logger.info(f"STL Analysis: Starting for file {file_path}...")

    # Add check for file existence and size
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        logger.error(f"STL Analysis: File {file_path} does not exist or is empty.")
        raise ValueError(f"STL file {os.path.basename(file_path)} does not exist or is empty.")

    try:
        main_mesh = stl_mesh.Mesh.from_file(file_path)
        if main_mesh is None:
            # This can happen for empty or severely malformed STL files
            logger.error(f"STL Analysis: Mesh.from_file returned None for {file_path}. File might be empty or critically malformed.")
            raise ValueError(f"STL file {os.path.basename(file_path)} could not be processed (possibly empty or critically malformed).")
    except Exception as e: # Catch broad exceptions from stl library loading
        logger.error(f"STL Analysis: Failed to load/parse STL file {file_path}: {e}")
        # Attempt to give a more specific error if it's the "cannot unpack" issue.
        if "cannot unpack non-iterable NoneType object" in str(e):
             logger.error(f"STL Analysis: Encountered internal numpy-stl error (possibly related to unpacking None) for {file_path}.")
             raise ValueError(f"Internal error during STL parsing of {os.path.basename(file_path)}: {e}")
        raise ValueError(f"Invalid or corrupt STL file: {os.path.basename(file_path)}") from e

    # Volume: numpy-stl returns volume in units^3 of the STL file. Assuming mm^3.
    # Convert to cm^3 (1 cm^3 = 1000 mm^3)
    if not hasattr(main_mesh, 'volume') or main_mesh.volume is None: # Updated check
        logger.error(f"STL Analysis: main_mesh.volume is missing or None for {file_path}.")
        raise ValueError(f"Could not determine volume for STL file {os.path.basename(file_path)}.")
    volume_mm3 = main_mesh.volume
    volume_cm3 = Decimal(str(volume_mm3)) / Decimal("1000.0")

    # Bounding Box (bbox_mm): Get min/max extents and calculate dimensions.
    # mesh.min_ and mesh.max_ give [xmin, ymin, zmin] and [xmax, ymax, zmax]
    if not hasattr(main_mesh, 'min_') or not hasattr(main_mesh, 'max_') or \
       main_mesh.min_ is None or main_mesh.max_ is None: # Updated check
        logger.error(f"STL Analysis: main_mesh.min_ or main_mesh.max_ is missing or None for {file_path}.")
        raise ValueError(f"Could not determine bounding box for STL file {os.path.basename(file_path)}.")
    min_coords = main_mesh.min_
    max_coords = main_mesh.max_
    bbox_mm = [
        float(Decimal(str(max_coords[i])) - Decimal(str(min_coords[i]))) for i in range(3)
    ]

    # Surface Area: numpy-stl returns area in units^2. Assuming mm^2.
    # Convert to cm^2 (1 cm^2 = 100 mm^2)
    if not hasattr(main_mesh, 'area') or main_mesh.area is None: # Updated check
        logger.error(f"STL Analysis: main_mesh.area is missing or None for {file_path}.")
        raise ValueError(f"Could not determine surface area for STL file {os.path.basename(file_path)}.")
    surface_area_mm2 = main_mesh.area
    surface_area_cm2 = Decimal(str(surface_area_mm2)) / Decimal("100.0")

    # Complexity Score (heuristic: number of triangles / 10000, capped at 1.0)
    # This is a very basic heuristic. A more sophisticated score would be better.
    if not hasattr(main_mesh, 'vectors') or main_mesh.vectors is None: # Updated check
        logger.error(f"STL Analysis: main_mesh.vectors is missing or None for {file_path}.")
        raise ValueError(f"Could not determine triangles for STL file {os.path.basename(file_path)}.")
    num_triangles = main_mesh.vectors.shape[0]
    complexity_score = min(Decimal(str(num_triangles)) / Decimal("10000.0"), Decimal("1.0"))

    analysis_results = {
        "volume_cm3": float(volume_cm3.quantize(Decimal("0.01"))), # Store as float after rounding
        "bbox_mm": [float(Decimal(str(d)).quantize(Decimal("0.1"))) for d in bbox_mm],
        "surface_area_cm2": float(surface_area_cm2.quantize(Decimal("0.01"))),
        "complexity_score": float(complexity_score.quantize(Decimal("0.01"))),
        "num_triangles": num_triangles,
        "analysis_engine": f"numpy-stl-v{stl_mesh.VERSION if hasattr(stl_mesh, 'VERSION') else 'unknown'}"
    }
    logger.info(f"STL Analysis: Completed for {file_path}. Results: {analysis_results}")
    return analysis_results


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def analyze_cad_file(self, design_id):
    logger.info(f"Celery Task: Starting CAD analysis for Design ID: {design_id}")
    try:
        with transaction.atomic(): # Ensure DB operations are atomic for this task instance
            # Fetch the design object safely, ensuring it's not processed if status changed
            design = Design.objects.select_for_update().get(id=design_id)

            if design.status != DesignStatus.PENDING_ANALYSIS:
                logger.warning(f"Design ID {design_id} is not in PENDING_ANALYSIS status (current: {design.status}). Skipping analysis.")
                return f"Skipped: Design {design_id} not in PENDING_ANALYSIS status."

            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                config=boto3.session.Config(signature_version=settings.AWS_S3_SIGNATURE_VERSION)
            )

            # Create a temporary file to download the S3 object
            # Create a temporary file to download the S3 object
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(design.s3_file_key)[1])
            local_file_path = tmp_file.name
            tmp_file.close() # Close the file handle immediately

            file_downloaded_and_processed_successfully = False

            try:
                logger.info(f"Downloading s3://{settings.AWS_STORAGE_BUCKET_NAME}/{design.s3_file_key} to {local_file_path}")
                try:
                    s3_client.download_file(settings.AWS_STORAGE_BUCKET_NAME, design.s3_file_key, local_file_path)
                    logger.info(f"Successfully downloaded {design.s3_file_key}.")
                except ClientError as e:
                    if e.response['Error']['Code'] == '404':
                        logger.error(f"S3 file not found for Design ID {design_id}: s3://{settings.AWS_STORAGE_BUCKET_NAME}/{design.s3_file_key}")
                        design.status = DesignStatus.ANALYSIS_FAILED
                        design.geometric_data = {"error": "S3 file not found."}
                        design.save() # Save status immediately for 404
                        # Must remove tmp file before returning
                        if os.path.exists(local_file_path):
                            os.remove(local_file_path)
                        return f"Failed: S3 file not found for Design {design_id}." # Specific return for 404
                    else: # Other S3 client errors
                        logger.error(f"S3 ClientError downloading file for Design ID {design_id}: {e}")
                        raise self.retry(exc=e) from e # Retry for other S3 client errors

                # --- Perform CAD Analysis ---
                # This part is reached only if download was successful
                file_extension = os.path.splitext(design.s3_file_key)[1].lower()
                analysis_function = None

                if file_extension == '.stl':
                    if NUMPY_STL_AVAILABLE:
                        analysis_function = perform_stl_analysis
                    else:
                        logger.error("STL file received, but numpy-stl library is not available.")
                        design.status = DesignStatus.ANALYSIS_FAILED
                        design.geometric_data = {"error": "STL processing library not available."}
                elif file_extension in ['.step', '.stp']:
                    if STEPUTILS_AVAILABLE:
                        try:
                            step_file = steputils.p21.STYLED_STEP_FILE(local_file_path)
                            if step_file:
                                logger.info(f"STEP file {design.s3_file_key} validated successfully by steputils.")
                                design.geometric_data = {
                                    "validation_engine": f"steputils-v{steputils.version if hasattr(steputils, 'version') else 'unknown'}",
                                    "status_message": "STEP file validated. Detailed geometric analysis not available.",
                                    "complexity_score": 0.1
                                }
                                design.status = DesignStatus.ANALYSIS_FAILED
                                design.geometric_data["error"] = "STEP file validated, but detailed geometric properties could not be extracted."
                            else:
                                raise ValueError("steputils parsing returned None.")
                        except Exception as step_exc:
                            logger.error(f"STEP file analysis/validation failed for Design ID {design_id} using steputils: {step_exc}")
                            design.status = DesignStatus.ANALYSIS_FAILED
                            design.geometric_data = {"error": f"STEP file parsing error: {str(step_exc)}"}
                    else:
                        logger.error("STEP file received, but steputils library is not available.")
                        design.status = DesignStatus.ANALYSIS_FAILED
                        design.geometric_data = {"error": "STEP processing library (steputils) not available."}
                elif file_extension in ['.iges', '.igs']:
                    logger.warning(f"IGES file type ('{file_extension}') received for Design ID {design_id}, but no IGES library is available.")
                    design.status = DesignStatus.ANALYSIS_FAILED
                    design.geometric_data = {"error": "IGES file analysis is not supported (no library)."}
                else:
                    logger.warning(f"Unsupported file type '{file_extension}' for Design ID {design_id}.")
                    design.status = DesignStatus.ANALYSIS_FAILED
                    design.geometric_data = {"error": f"Unsupported file type: {file_extension}."}

                if analysis_function: # Primarily for STL
                    geometric_data = analysis_function(local_file_path)
                    design.geometric_data = geometric_data
                    design.status = DesignStatus.ANALYSIS_COMPLETE
                    logger.info(f"CAD analysis successful for Design ID: {design_id}. Status set to ANALYSIS_COMPLETE.")

                file_downloaded_and_processed_successfully = True # If it reached here without major S3/parsing lib error for STL.
                                                                # For STEP/IGES, status might already be FAILED.

            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    logger.error(f"S3 file not found for Design ID {design_id}: s3://{settings.AWS_STORAGE_BUCKET_NAME}/{design.s3_file_key}")
                    design.status = DesignStatus.ANALYSIS_FAILED
                    design.geometric_data = {"error": "S3 file not found."}
                else:
                    logger.error(f"S3 ClientError downloading/processing file for Design ID {design_id}: {e}")
                    # For other S3 errors, let Celery retry mechanism handle it.
                    # Status not changed here, will be PENDING_ANALYSIS for retry.
                    raise self.retry(exc=e) from e
            except ValueError as ve: # Catch parsing/analysis errors from perform_stl_analysis or other validation
                logger.error(f"CAD analysis failed for Design ID {design_id}: {ve}")
                design.status = DesignStatus.ANALYSIS_FAILED
                design.geometric_data = {"error": f"Analysis failed: {str(ve)}"}
            except RuntimeError as rte: # Catch library availability errors
                 logger.error(f"CAD analysis runtime error for Design ID {design_id}: {rte}")
                 design.status = DesignStatus.ANALYSIS_FAILED
                 design.geometric_data = {"error": f"Analysis runtime error: {str(rte)}"}
            except Exception as analysis_exc: # Catch any other unexpected analysis errors
                logger.error(f"Unexpected CAD analysis error for Design ID {design_id}: {analysis_exc}")
                design.status = DesignStatus.ANALYSIS_FAILED
                design.geometric_data = {"error": f"Unexpected analysis error: {str(analysis_exc)}"}
            finally:
                if os.path.exists(local_file_path):
                    os.remove(local_file_path)
                # Save design status changes made within this try/except/finally block
                # This ensures status is updated even if only part of the processing failed (e.g. STEP validation vs full STL analysis)
                if not file_downloaded_and_processed_successfully or design.status == DesignStatus.ANALYSIS_FAILED :
                    logger.info(f"Saving Design {design_id} with status {design.status} due to processing outcome or error.")
                design.save()

            if design.status == DesignStatus.ANALYSIS_COMPLETE:
                logger.info(f"Successfully processed Design ID: {design_id}. Final status: {design.status}")
                return f"Successfully processed Design ID: {design_id}. Final status: {design.status}"
            else: # Handles ANALYSIS_FAILED or any other non-COMPLETE status set during processing
                logger.warning(f"Finished processing Design ID: {design_id}, but final status is {design.status}. Error: {design.geometric_data.get('error', 'Unknown error during analysis.')}")
                return f"CAD analysis failed for Design ID {design_id}: {design.geometric_data.get('error', 'Unknown error during analysis.')}"

    except Design.DoesNotExist:
        logger.error(f"Design ID {design_id} not found in database for analysis.")
        # No retry if design doesn't exist
        return f"Failed: Design {design_id} not found."
    except Exception as e: # This is the outermost catch-all for unexpected errors before or after the atomic block
        logger.error(f"Outer unexpected error in analyze_cad_file task for Design ID {design_id}: {e}")
        # Attempt to set a generic error status on the design if it exists and task is retrying
        try:
            design_to_update = Design.objects.get(id=design_id)
            if design_to_update.status == DesignStatus.PENDING_ANALYSIS:
                # Only update if it's still pending, to avoid overwriting a more specific FAILED status
                design_to_update.status = DesignStatus.ANALYSIS_FAILED
                design_to_update.geometric_data = {"error": f"Task-level error: {str(e)}"}
                design_to_update.save()
        except Design.DoesNotExist:
            pass
        raise self.retry(exc=e) from e
