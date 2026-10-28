from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    orders_count = models.PositiveIntegerField(default=0) 

    class Meta:
        db_table = 'chess_tactic_library_userprofile'

    def __str__(self):
        return f'User profile {self.user.username}'

class Game(models.Model):
  fen = models.CharField(
      max_length=100,
      default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  )
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f'Game {self.id} - {self.updated_at}'