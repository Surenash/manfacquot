# This is a placeholder urls.py file for the quotes app.
from django.urls import path
# from . import views # Assuming views will be added later

# app_name = "quotes" # This is not needed as these URLs are included under designs

urlpatterns = [
    # General quote endpoints (e.g., /api/quotes/{quote_id}/)
    # path('<uuid:quote_id>/', views.QuoteDetailView.as_view(), name='quote-detail'),
]

from . import views

# For /api/designs/{design_id}/quotes/ type URLs
design_specific_quote_urlpatterns = [
    path('', views.DesignQuoteListCreateView.as_view(), name='design-quote-list-create'),
]
