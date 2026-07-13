import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestUserRegistration:
    """Тести реєстрації користувачів"""

    def setup_method(self):
        self.client = APIClient()
        self.url = reverse('auth_register')

    def test_user_registration_success(self):
        """Успішна реєстрація користувача"""
        data = {
            "email": "test@example.com",
            "username": "tester",
            "password": "Password123!",
            "password2": "Password123!"
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == 201
        assert response.data['username'] == 'tester'
        assert User.objects.filter(email='test@example.com').exists()

    def test_user_registration_password_mismatch(self):
        """Помилка при невідповідності паролів"""
        data = {
            "email": "test@example.com",
            "username": "tester",
            "password": "Password123!",
            "password2": "Password456!"
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == 400
        assert 'password' in response.data

    def test_user_registration_duplicate_email(self):
        """Помилка при використанні існуючого email"""
        User.objects.create_user(email='test@example.com', username='user1', password='pass123')

        data = {
            "email": "test@example.com",
            "username": "tester",
            "password": "Password123!",
            "password2": "Password123!"
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == 400


@pytest.mark.django_db
class TestUserProfile:
    """Тести профілю користувача"""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@example.com',
            username='testuser',
            password='Password123!'
        )

    def test_get_user_profile_authenticated(self):
        """Отримання свого профілю авторизованим користувачем"""
        self.client.force_authenticate(user=self.user)
        url = reverse('user_profile')
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.data['username'] == 'testuser'
        assert response.data['email'] == 'user@example.com'

    def test_get_public_user_profile(self):
        """Отримання публічного профілю користувача"""
        url = reverse('public_user_profile', kwargs={'username': 'testuser'})
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.data['username'] == 'testuser'

    def test_public_profile_not_found(self):
        """Помилка при запиті до неіснуючого профілю"""
        url = reverse('public_user_profile', kwargs={'username': 'nonexistent'})
        response = self.client.get(url)

        assert response.status_code == 404
