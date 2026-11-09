from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django import forms
class UserProfile(models.Model): # Убедитесь, что класс называется именно UserProfile
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    move_highlight_color = models.CharField(max_length=7, default='#76cc26')
    completed_move_color = models.CharField(max_length=7, default='#76cc26')

    def __str__(self):
        return self.user.username

class Game(models.Model):
  fen = models.CharField(
      max_length=100,
      default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  )
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f'Game {self.id} - {self.updated_at}'

class ChessTactic(models.Model):
    COLOR_CHOICES = [
        ('white', 'За белых'),
        ('black', 'За черных'),
    ]

    title = models.CharField(max_length=200, verbose_name='Название дебюта')
    color = models.CharField(
        max_length=10, choices=COLOR_CHOICES, default='white', verbose_name='Цвет'
    )
    fen = models.CharField(
        max_length=100,
        default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    )
    moves_sequence = models.JSONField(verbose_name='Последовательность ходов', default=list)
    description = models.TextField(blank=True, verbose_name='Описание')

    def __str__(self):
        return f'{self.title} ({self.get_color_display()})'

class ChessPuzzles(models.Model):
    COLOR_CHOICES = [
        ('white', 'За белых'),
        ('black', 'За черных'),
    ]
    tactic = models.ForeignKey(
    ChessTactic, 
    on_delete=models.SET_NULL, 
    null=True, 
    blank=True, 
    related_name='puzzles', 
    verbose_name='Дебют'
)
    TASK_TYPE_CHOICES = [
        ('opening', 'Дебют / Теория'),
        ('tactic', 'Тактическая задача / Закрепление'),
    ]

    title = models.CharField(max_length=200, verbose_name='Название задачи')
    color = models.CharField(
        max_length=10, choices=COLOR_CHOICES, default='white', verbose_name='Цвет'
    )
    task_type = models.CharField(
        max_length=20, choices=TASK_TYPE_CHOICES, default='tactic', verbose_name='Тип задания'
    )
    fen = models.CharField(
        max_length=100,
        default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        verbose_name='Начальный FEN позиции'
    )
    moves_sequence = models.JSONField(
        verbose_name='Правильная последовательность ходов (решение)', 
        default=list
    )
    hint = models.CharField(
        max_length=255, 
        blank=True, 
        verbose_name='Подсказка для игрока'
    )

    def __str__(self):
        return f'{self.title} ({self.get_task_type_display()})'