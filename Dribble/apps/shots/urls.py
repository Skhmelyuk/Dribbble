from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShotViewSet

router = DefaultRouter()
router.register(r'shots', ShotViewSet, basename='shot')

urlpatterns = [
    path('', include(router.urls)),
]