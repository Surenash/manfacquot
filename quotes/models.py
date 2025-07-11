from django.db import models
import uuid
from django.conf import settings

# Based on AGENTS.md and the dependency from the Order model.

class QuoteStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    EXPIRED = "expired", "Expired"
    # Add other statuses if mentioned or implied by AGENTS.md/README.md for quotes
    # e.g. WITHDRAWN = "withdrawn", "Withdrawn" (if a manufacturer can withdraw a quote)

class Quote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    design = models.ForeignKey("designs.Design", on_delete=models.CASCADE, related_name="quotes")
    manufacturer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quotes_provided",
        limit_choices_to={"role": "manufacturer"},
    )
    price_usd = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_lead_time_days = models.PositiveIntegerField()
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=QuoteStatus.choices,
        default=QuoteStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quote {self.id} for Design {self.design_id} by Manufacturer {self.manufacturer_id}"

    class Meta:
        db_table = "Quotes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["design"]),
            models.Index(fields=["manufacturer"]),
            models.Index(fields=["status"]),
        ]
