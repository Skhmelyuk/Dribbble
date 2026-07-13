from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .serializers import RegisterSerializer, UserProfileSerializer, FollowUserSerializer
from .models import Follow
from apps.shots.models import Shot
from apps.shots.serializers import ShotSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'  # ліміт 5 запитів на хвилину

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PublicUserProfileView(generics.RetrieveAPIView):
    """GET /api/users/:username/ — публічний профіль користувача"""
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [AllowAny]
    lookup_field = 'username'

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class FollowToggleView(APIView):
    """POST /api/users/:username/follow/ — toggle follow"""
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        target = get_object_or_404(User, username=username)
        if target == request.user:
            return Response({'detail': 'Не можна підписатися на самого себе.'}, status=status.HTTP_400_BAD_REQUEST)

        follow, created = Follow.objects.get_or_create(follower=request.user, followed=target)
        if not created:
            follow.delete()
            return Response({'following': False, 'followers_count': target.followers_set.count()})
        return Response({'following': True, 'followers_count': target.followers_set.count()}, status=status.HTTP_201_CREATED)


class LikedShotsView(generics.ListAPIView):
    """GET /api/users/:username/liked/ — лайкнуті shots юзера"""
    serializer_class = ShotSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs['username'])
        liked_ids = user.likes.values_list('shot_id', flat=True)
        return Shot.objects.filter(id__in=liked_ids).select_related('author').prefetch_related('tags', 'likes', 'saves', 'comments')


class FollowersListView(generics.ListAPIView):
    """GET /api/users/:username/followers/ — підписники"""
    serializer_class = FollowUserSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs['username'])
        return User.objects.filter(following_set__followed=user)


class FollowingListView(generics.ListAPIView):
    """GET /api/users/:username/following/ — підписки"""
    serializer_class = FollowUserSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs['username'])
        return User.objects.filter(followers_set__follower=user)
