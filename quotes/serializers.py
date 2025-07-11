# This is a placeholder serializers.py file for the quotes app.
# Actual serializers should be defined based on AGENTS.md and README.md.
from rest_framework import serializers
from .models import Quote

class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            "id",
            "design",
            "manufacturer",
            "price_usd",
            "estimated_lead_time_days",
            "notes",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    # Potentially add more detailed fields or nested serializers as needed
    # e.g., for manufacturer details or design details if not just IDs.
    # manufacturer = serializers.StringRelatedField() # Example
    # design = serializers.StringRelatedField() # Example

    def validate_price_usd(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be positive.")
        return value

    def validate_estimated_lead_time_days(self, value):
        if value < 0: # Lead time can be 0 for immediate availability
            raise serializers.ValidationError("Estimated lead time cannot be negative.")
        return value
