# This is a placeholder urls.py file for the reviews app.
# Actual URL patterns should be defined based on AGENTS.md and README.md.
from django.urls import path
# from . import views # Assuming views will be added later

# app_name = "reviews" # This is not needed as these URLs are included under accounts

urlpatterns = [
    # Example:
    # path('reviews/', views.ReviewListCreateView.as_view(), name='review-list-create'),
    # path('reviews/<uuid:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),
]

# For /api/manufacturers/{manufacturer_id}/reviews/ type URLs mentioned in AGENTS.md
# These might be included by accounts.urls or a top-level router.
from . import views

# This list is for review-specific direct URLs if any.
# This list will be included by accounts.urls under /api/manufacturers/{manufacturer_id}/reviews/
manufacturer_specific_review_urlpatterns = [
    path('', views.ReviewListCreateView.as_view(), name='manufacturer-review-list-create'),
]
