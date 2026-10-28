from Chess_Tactic_library import views
from django.urls import path

urlpatterns = [
    path('', views.Main, name='Main'),
    path('profile/', views.profile, name='Profile'),
    path('register/', views.RegisterView.as_view(), name='Register'),
    path('login/', views.LoginView.as_view(), name='Login'),
    path('login/', views.logout_view, name='logout'),
    path('game/', views.chess_board_view, name='chess_board'),
    path('update/<int:game_id>/', views.update_game, name='update_game'),
]