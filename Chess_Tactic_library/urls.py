from Chess_Tactic_library import views
from django.urls import path

urlpatterns = [
    path('', views.Main, name='Main'),
    path('profile/', views.profile, name='Profile'),
    path('register/', views.RegisterView.as_view(), name='Register'),
    path('login/', views.LoginView.as_view(), name='Login'),
    path('logout/', views.logout_view, name='logout'), 
    path('game/', views.chess_board_view, name='chess_board'),
    path('update/<int:game_id>/', views.update_game, name='update_game'),
    path('tactic_deatil_view/', views.tactic_detail_view, name='tactic_detail_view'),
    path('Caro-kan/', views.Caro_kan_view, name='Caro_kan'),
]