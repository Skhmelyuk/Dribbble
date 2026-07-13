import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Shot, Like, Comment, Tag

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_user():
    return User.objects.create_user(
        email='testuser@example.com',
        username='testuser',
        password='Password123!'
    )


@pytest.fixture
def auth_client(api_client, auth_user):
    api_client.force_authenticate(user=auth_user)
    return api_client


@pytest.fixture
def sample_image():
    return SimpleUploadedFile("test.png", b"file_content", content_type="image/png")


@pytest.mark.django_db
class TestShotCRUD:
    """Тести CRUD операцій для Shots"""

    def test_create_shot(self, auth_client, auth_user, sample_image):
        """Створення нового shot"""
        url = reverse('shot-list')
        data = {
            "title": "My Design",
            "description": "Minimal design concept",
            "tags": "ui,mobile",
            "image": sample_image
        }
        response = auth_client.post(url, data, format='multipart')

        assert response.status_code == 201
        assert Shot.objects.count() == 1
        assert Shot.objects.first().author == auth_user
        assert Shot.objects.first().tags.count() == 2

    def test_list_shots(self, api_client, auth_user, sample_image):
        """Отримання списку shots"""
        Shot.objects.create(title="Shot 1", author=auth_user, image=sample_image)
        Shot.objects.create(title="Shot 2", author=auth_user, image=sample_image)

        url = reverse('shot-list')
        response = api_client.get(url)

        assert response.status_code == 200
        assert len(response.data['results']) == 2

    def test_retrieve_shot(self, api_client, auth_user, sample_image):
        """Отримання деталей конкретного shot"""
        shot = Shot.objects.create(title="My Shot", author=auth_user, image=sample_image)

        url = reverse('shot-detail', kwargs={'pk': shot.id})
        response = api_client.get(url)

        assert response.status_code == 200
        assert response.data['title'] == 'My Shot'

    def test_update_shot_by_author(self, auth_client, auth_user, sample_image):
        """Редагування shot автором"""
        shot = Shot.objects.create(title="Old Title", author=auth_user, image=sample_image)

        url = reverse('shot-detail', kwargs={'pk': shot.id})
        data = {"title": "New Title"}
        response = auth_client.patch(url, data)

        assert response.status_code == 200
        assert response.data['title'] == 'New Title'

    def test_delete_shot_by_author(self, auth_client, auth_user, sample_image):
        """Видалення shot автором"""
        shot = Shot.objects.create(title="To Delete", author=auth_user, image=sample_image)

        url = reverse('shot-detail', kwargs={'pk': shot.id})
        response = auth_client.delete(url)

        assert response.status_code == 204
        assert Shot.objects.count() == 0


@pytest.mark.django_db
class TestLikes:
    """Тести функціональності лайків"""

    def test_like_shot(self, auth_client, auth_user, sample_image):
        """Додавання лайка до shot"""
        shot = Shot.objects.create(title="Shot", author=auth_user, image=sample_image)

        url = reverse('shot-like', kwargs={'pk': shot.id})
        response = auth_client.post(url)

        assert response.status_code == 201
        assert response.data['liked'] is True
        assert Like.objects.count() == 1

    def test_unlike_shot(self, auth_client, auth_user, sample_image):
        """Видалення лайка з shot"""
        shot = Shot.objects.create(title="Shot", author=auth_user, image=sample_image)
        Like.objects.create(user=auth_user, shot=shot)

        url = reverse('shot-like', kwargs={'pk': shot.id})
        response = auth_client.post(url)

        assert response.status_code == 200
        assert response.data['liked'] is False
        assert Like.objects.count() == 0


@pytest.mark.django_db
class TestComments:
    """Тести функціональності коментарів"""

    def test_add_comment(self, auth_client, auth_user, sample_image):
        """Додавання коментаря до shot"""
        shot = Shot.objects.create(title="Shot", author=auth_user, image=sample_image)

        url = reverse('shot-comments', kwargs={'pk': shot.id})
        data = {"text": "Great work!"}
        response = auth_client.post(url, data, format='json')

        assert response.status_code == 201
        assert Comment.objects.count() == 1
        assert response.data['text'] == 'Great work!'

    def test_list_comments(self, api_client, auth_user, sample_image):
        """Отримання списку коментарів"""
        shot = Shot.objects.create(title="Shot", author=auth_user, image=sample_image)
        Comment.objects.create(user=auth_user, shot=shot, text="Comment 1")
        Comment.objects.create(user=auth_user, shot=shot, text="Comment 2")

        url = reverse('shot-comments', kwargs={'pk': shot.id})
        response = api_client.get(url)

        assert response.status_code == 200
        assert len(response.data) == 2

    def test_delete_own_comment(self, auth_client, auth_user, sample_image):
        """Видалення своїх коментарів"""
        shot = Shot.objects.create(title="Shot", author=auth_user, image=sample_image)
        comment = Comment.objects.create(user=auth_user, shot=shot, text="My comment")

        url = reverse('shot-delete-comment', kwargs={'pk': shot.id, 'comment_id': comment.id})
        response = auth_client.delete(url)

        assert response.status_code == 204
        assert Comment.objects.count() == 0

