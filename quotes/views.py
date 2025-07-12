from rest_framework import generics, permissions, exceptions
from django.shortcuts import get_object_or_404
from .models import Quote
from .serializers import QuoteSerializer
from designs.models import Design
from accounts.models import UserRole

class IsManufacturerUser(permissions.BasePermission):
    """
    Allows access only to users with the 'manufacturer' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.MANUFACTURER)

class DesignQuoteListCreateView(generics.ListCreateAPIView):
    """
    GET /api/designs/{design_id}/quotes/ - List quotes for a design.
    POST /api/designs/{design_id}/quotes/ - Create a quote for a design.
    """
    serializer_class = QuoteSerializer
    # Permissions will be checked manually in get_queryset and perform_create for more complex logic
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        design_id = self.kwargs['design_id']
        design = get_object_or_404(Design, id=design_id)
        user = self.request.user

        # A customer can see all quotes for their own design.
        # A manufacturer can see the quotes they have provided for this design.
        if user.role == UserRole.CUSTOMER and design.customer == user:
            return Quote.objects.filter(design_id=design_id)
        elif user.role == UserRole.MANUFACTURER:
            return Quote.objects.filter(design_id=design_id, manufacturer=user)

        return Quote.objects.none() # Return no quotes if user is not owner or a quoting manufacturer

    def perform_create(self, serializer):
        design_id = self.kwargs['design_id']
        design = get_object_or_404(Design, id=design_id)

        # Check permissions for creation manually
        if self.request.user.role != UserRole.MANUFACTURER:
            # This is also handled in the serializer's create method, but defense in depth
            raise exceptions.PermissionDenied("Only manufacturers can create quotes.")

        # The serializer's create method will set the manufacturer from the request user.
        serializer.save(design=design)

# For /api/quotes/{quote_id}/
# class QuoteDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Quote.objects.all()
#     serializer_class = QuoteSerializer
#     # permission_classes = [IsAuthenticated, IsQuoteOwnerOrManufacturer]
#     lookup_field = 'quote_id' # or 'pk' if using default
