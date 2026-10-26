from Chess_Tactic_library import views
from django.urls import path

urlpatterns = [
    path('', views.Main, name='Main'),

]