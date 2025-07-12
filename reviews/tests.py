from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User, UserRole, Manufacturer
from designs.models import Design, DesignStatus
from quotes.models import Quote, QuoteStatus
from orders.models import Order, OrderStatus # Assuming Order model is in orders.models
from .models import Review

class ReviewAPITests(APITestCase):

    def setUp(self):
        self.customer1 = User.objects.create_user(
            email="cust1_reviews@example.com", password="Password123!",
            company_name="Cust1 Corp Reviews", role=UserRole.CUSTOMER
        )
        self.customer2 = User.objects.create_user(
            email="cust2_reviews@example.com", password="Password123!",
            company_name="Cust2 Corp Reviews", role=UserRole.CUSTOMER
        )
        self.manufacturer = User.objects.create_user(
            email="manuf_reviews@example.com", password="Password123!",
            company_name="Manuf Inc Reviews", role=UserRole.MANUFACTURER
        )
        Manufacturer.objects.create(user=self.manufacturer, markup_factor="1.1")

        self.design_c1 = Design.objects.create(
            customer=self.customer1, design_name="Design C1 for Review",
            s3_file_key="key1", material="PLA", quantity=1, status=DesignStatus.ANALYSIS_COMPLETE
        )

        self.quote_m_d1 = Quote.objects.create(
            design=self.design_c1, manufacturer=self.manufacturer,
            price_usd="100.00", estimated_lead_time_days=5, status=QuoteStatus.ACCEPTED
        )

        # Order for customer1 with manufacturer
        self.order_c1_m = Order.objects.create(
            design=self.design_c1,
            accepted_quote=self.quote_m_d1,
            customer=self.customer1,
            manufacturer=self.manufacturer,
            status=OrderStatus.COMPLETED, # Assume order is completed for review
            order_total_price_usd=self.quote_m_d1.price_usd
        )

    def _login_user(self, email, password):
        login_url = reverse('token_obtain_pair')
        response = self.client.post(login_url, {"email": email, "password": password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Failed to login user {email}.")
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    def test_create_review_for_own_order_success(self):
        """
        Customer can create a review for their own order with a specific manufacturer.
        """
        self._login_user(self.customer1.email, "Password123!")
        url = reverse('manufacturer-review-list-create', kwargs={'manufacturer_id': self.manufacturer.id})

        review_data = {
            "order_id": str(self.order_c1_m.id),
            "rating": 5,
            "comment": "Excellent service and quality for my order!"
        }
        response = self.client.post(url, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Review.objects.count(), 1)
        review = Review.objects.first()
        self.assertEqual(review.customer, self.customer1)
        self.assertEqual(review.manufacturer, self.manufacturer)
        self.assertEqual(str(review.order_id), str(self.order_c1_m.id)) # Compare as string due to UUID
        self.assertEqual(review.rating, 5)

    def test_create_review_for_another_users_order_forbidden(self):
        """
        Customer2 cannot create a review for customer1's order.
        """
        self._login_user(self.customer2.email, "Password123!") # Logged in as customer2
        url = reverse('manufacturer-review-list-create', kwargs={'manufacturer_id': self.manufacturer.id})

        review_data = {
            "order_id": str(self.order_c1_m.id), # order_c1_m belongs to customer1
            "rating": 1,
            "comment": "Trying to review someone else's order."
        }
        response = self.client.post(url, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.data)
        self.assertIn("order_id", response.data)
        self.assertEqual(response.data["order_id"][0], "This order does not belong to the current user.")
        self.assertEqual(Review.objects.count(), 0)

    def test_create_review_without_order_id_success(self):
        """
        Customer can create a general review for a manufacturer without specifying an order.
        """
        self._login_user(self.customer1.email, "Password123!")
        url = reverse('manufacturer-review-list-create', kwargs={'manufacturer_id': self.manufacturer.id})

        review_data = {
            "rating": 4,
            "comment": "Good communication with this manufacturer."
            # No order_id
        }
        response = self.client.post(url, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Review.objects.count(), 1)
        review = Review.objects.first()
        self.assertEqual(review.customer, self.customer1)
        self.assertEqual(review.manufacturer, self.manufacturer)
        self.assertIsNone(review.order_id)
        self.assertEqual(review.rating, 4)

    def test_create_review_for_non_existent_order(self):
        self._login_user(self.customer1.email, "Password123!")
        url = reverse('manufacturer-review-list-create', kwargs={'manufacturer_id': self.manufacturer.id})
        non_existent_uuid = "123e4567-e89b-12d3-a456-426614174000"
        review_data = {
            "order_id": non_existent_uuid,
            "rating": 3,
            "comment": "Review for a ghost order."
        }
        response = self.client.post(url, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("order_id", response.data)
        self.assertEqual(response.data["order_id"][0], "The specified order does not exist.")

    def test_create_review_manufacturer_mismatch_with_order(self):
        """
        Test creating a review where the manufacturer in the URL/payload
        does not match the manufacturer on the specified order.
        """
        # Create another manufacturer
        other_manufacturer = User.objects.create_user(
            email="other_manuf@example.com", password="Password123!", role=UserRole.MANUFACTURER
        )
        Manufacturer.objects.create(user=other_manufacturer)

        self._login_user(self.customer1.email, "Password123!")
        # URL is for 'other_manufacturer' but order_id is for 'self.manufacturer'
        url = reverse('manufacturer-review-list-create', kwargs={'manufacturer_id': other_manufacturer.id})

        review_data = {
            "order_id": str(self.order_c1_m.id), # This order was with self.manufacturer
            "rating": 2,
            "comment": "Manufacturer mismatch."
        }
        response = self.client.post(url, review_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("manufacturer", response.data)
        self.assertEqual(response.data["manufacturer"][0], "The manufacturer being reviewed does not match the manufacturer on the order.")
        self.assertEqual(Review.objects.count(), 0)

    # TODO: Add tests for listing reviews (GET)
    # TODO: Add tests for updating/deleting reviews once those views are implemented.
