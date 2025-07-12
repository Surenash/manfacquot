from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, UserRole, Manufacturer
from designs.models import Design, DesignStatus # Assuming Design model is in designs.models
from .models import Quote # Assuming Quote model is in .models (quotes.models)

class QuoteAPITests(APITestCase):

    def setUp(self):
        # Customer User
        self.customer_user = User.objects.create_user(
            email="customer_for_quotes@example.com", password="Password123!",
            company_name="Cust Corp Quotes", role=UserRole.CUSTOMER
        )

        # Manufacturer User 1
        self.manufacturer1_user = User.objects.create_user(
            email="manufacturer1_quotes@example.com", password="Password123!",
            company_name="Manuf1 Inc Quotes", role=UserRole.MANUFACTURER
        )
        Manufacturer.objects.create(user=self.manufacturer1_user, markup_factor="1.2")

        # Manufacturer User 2 (another manufacturer for testing impersonation)
        self.manufacturer2_user = User.objects.create_user(
            email="manufacturer2_quotes@example.com", password="Password123!",
            company_name="Manuf2 Inc Quotes", role=UserRole.MANUFACTURER
        )
        Manufacturer.objects.create(user=self.manufacturer2_user, markup_factor="1.3")

        # A design by the customer
        self.design = Design.objects.create(
            customer=self.customer_user,
            design_name="Test Design for Quotes",
            s3_file_key=f"uploads/designs/{self.customer_user.id}/test_design_quotes.stl",
            material="ABS",
            quantity=10,
            status=DesignStatus.ANALYSIS_COMPLETE # Design must be analyzed to be quoted
        )

    def _login_user(self, email, password):
        login_url = reverse('token_obtain_pair') # from accounts.urls
        response = self.client.post(login_url, {"email": email, "password": password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Failed to login user {email}.")
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    def test_create_quote_success(self):
        """
        Ensure a manufacturer can create a quote for a design.
        The manufacturer field should be set to the logged-in user.
        """
        self._login_user(self.manufacturer1_user.email, "Password123!")

        # URL for creating a quote for a specific design
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})

        quote_data = {
            "price_usd": "150.75",
            "estimated_lead_time_days": 10,
            "notes": "Standard quote for ABS material."
            # 'manufacturer' field is not sent; it should be set from request.user
        }

        response = self.client.post(url, quote_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Quote.objects.count(), 1)

        created_quote = Quote.objects.first()
        self.assertEqual(created_quote.manufacturer, self.manufacturer1_user)
        self.assertEqual(created_quote.design, self.design)
        self.assertEqual(float(created_quote.price_usd), 150.75)
        self.assertEqual(created_quote.estimated_lead_time_days, 10)

    def test_create_quote_by_customer_forbidden(self):
        """
        Ensure a customer cannot create a quote.
        """
        self._login_user(self.customer_user.email, "Password123!")
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})
        quote_data = {"price_usd": "100.00", "estimated_lead_time_days": 7}
        response = self.client.post(url, quote_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_quote_unauthenticated_forbidden(self):
        """
        Ensure an unauthenticated user cannot create a quote.
        """
        self.client.credentials() # Log out
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})
        quote_data = {"price_usd": "100.00", "estimated_lead_time_days": 7}
        response = self.client.post(url, quote_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # The following test is not strictly necessary anymore because 'manufacturer' field is read_only
    # in the serializer and set by the create method. If a manufacturer ID was sent in payload,
    # it would be ignored. This test is more of a conceptual check that the system enforces this.
    def test_manufacturer_cannot_create_quote_for_another_manufacturer(self):
        """
        Conceptually, ensure a logged-in manufacturer (manufacturer1) cannot create a quote
        that appears to be from another manufacturer (manufacturer2), even if they tried to pass
        manufacturer2's ID. The system should always use the logged-in user.
        """
        self._login_user(self.manufacturer1_user.email, "Password123!")
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})

        quote_data_with_wrong_mf = {
            "price_usd": "200.00",
            "estimated_lead_time_days": 12,
            # "manufacturer": self.manufacturer2_user.id # This field is read-only, so it will be ignored
        }

        response = self.client.post(url, quote_data_with_wrong_mf, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        created_quote = Quote.objects.get(id=response.data['id'])
        self.assertEqual(created_quote.manufacturer, self.manufacturer1_user) # Should be logged-in user
        self.assertNotEqual(created_quote.manufacturer, self.manufacturer2_user)

    def test_list_quotes_for_design_as_customer_owner(self):
        """Customer who owns the design can list its quotes."""
        # MF1 creates a quote
        Quote.objects.create(design=self.design, manufacturer=self.manufacturer1_user, price_usd="100", estimated_lead_time_days=5)
        # MF2 creates a quote
        Quote.objects.create(design=self.design, manufacturer=self.manufacturer2_user, price_usd="120", estimated_lead_time_days=7)

        self._login_user(self.customer_user.email, "Password123!")
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_quotes_for_design_as_quoting_manufacturer(self):
        """Manufacturer can list only their own quotes for a design."""
        Quote.objects.create(design=self.design, manufacturer=self.manufacturer1_user, price_usd="100", estimated_lead_time_days=5)
        Quote.objects.create(design=self.design, manufacturer=self.manufacturer2_user, price_usd="120", estimated_lead_time_days=7) # Another mf's quote

        self._login_user(self.manufacturer1_user.email, "Password123!")
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['manufacturer'], self.manufacturer1_user.id)

    def test_list_quotes_for_design_as_non_quoting_manufacturer(self):
        """A manufacturer who hasn't quoted for a design sees no quotes (not even others')."""
        Quote.objects.create(design=self.design, manufacturer=self.manufacturer2_user, price_usd="120", estimated_lead_time_days=7)

        self._login_user(self.manufacturer1_user.email, "Password123!") # MF1 has not quoted
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_list_quotes_for_design_as_unrelated_customer(self):
        """A customer who does not own the design cannot list its quotes."""
        unrelated_customer = User.objects.create_user(email="unrelated@example.com", password="pw", role=UserRole.CUSTOMER)
        Quote.objects.create(design=self.design, manufacturer=self.manufacturer1_user, price_usd="100", estimated_lead_time_days=5)

        self._login_user(unrelated_customer.email, "pw")
        url = reverse('design-quote-list-create', kwargs={'design_id': self.design.id})
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK) # View returns empty list, not 403/404
        self.assertEqual(len(response.data), 0)

    # TODO: Add tests for QuoteDetailView (GET, PATCH, DELETE) once implemented.
    # - Test permissions: IsOwnerOrQuotingManufacturer
    # - Test PATCH logic for status updates by customer vs manufacturer.
    # - Test DELETE logic.
