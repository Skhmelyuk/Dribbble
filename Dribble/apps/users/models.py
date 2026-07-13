from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)

    website = models.URLField(blank=True, max_length=255)
    twitter = models.URLField(blank=True, max_length=255)
    instagram = models.URLField(blank=True, max_length=255)
    linkedin = models.URLField(blank=True, max_length=255)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'

    def __str__(self):
        return f"{self.username} ({self.email})"


class Follow(models.Model):
    """Підписка одного юзера на іншого."""
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='following_set'  # юзери, на яких підписаний
    )
    followed = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='followers_set'  # юзери, які підписані на цього
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'followed')

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.follower == self.followed:
            raise ValidationError("Не можна підписатися на самого себе.")
