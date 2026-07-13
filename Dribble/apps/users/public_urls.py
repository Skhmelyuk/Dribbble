from django.urls import path
from .views import (
    PublicUserProfileView,
    FollowToggleView,
    LikedShotsView,
    FollowersListView,
    FollowingListView
)

urlpatterns = [
    path('<str:username>/', PublicUserProfileView.as_view(), name='public_profile'),
    path('<str:username>/follow/', FollowToggleView.as_view(), name='follow_toggle'),
    path('<str:username>/liked/', LikedShotsView.as_view(), name='liked_shots'),
    path('<str:username>/followers/', FollowersListView.as_view(), name='followers_list'),
    path('<str:username>/following/', FollowingListView.as_view(), name='following_list'),
]
