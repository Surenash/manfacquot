from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404
from .models import Review
from .serializers import ReviewSerializer
from accounts.models import User, UserRole

class IsCustomerUser(permissions.BasePermission):
    """
    Allows access only to users with the 'customer' role.
    """
    def has_permission(self, request, view):
        # Allow GET for anyone, but POST only for authenticated customers
        if request.method == 'GET':
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.CUSTOMER)

class ReviewListCreateView(generics.ListCreateAPIView):
    """
    GET /api/manufacturers/{manufacturer_id}/reviews/ - List reviews for a manufacturer.
    POST /api/manufacturers/{manufacturer_id}/reviews/ - Create a review for a manufacturer.
    """
    serializer_class = ReviewSerializer
    permission_classes = [IsCustomerUser] # GET is public, POST requires customer role

    def get_queryset(self):
        manufacturer_id = self.kwargs['manufacturer_id']
        # Ensure the user exists and is a manufacturer before fetching reviews
        manufacturer_user = get_object_or_404(User, id=manufacturer_id, role=UserRole.MANUFACTURER)
        return Review.objects.filter(manufacturer=manufacturer_user)

    def perform_create(self, serializer):
        manufacturer_id = self.kwargs['manufacturer_id']
        manufacturer_user = get_object_or_404(User, id=manufacturer_id, role=UserRole.MANUFACTURER)

        # The serializer's create/validate methods will handle setting the customer from request.user
        # and checking for duplicates.
        serializer.save(manufacturer=manufacturer_user)

# TODO: Implement ReviewDetailView for GET/PATCH/DELETE /api/reviews/{review_id}
# class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Review.objects.all()
#     serializer_class = ReviewSerializer
