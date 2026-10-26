from django.urls import reverse_lazy
from django.views.generic import FormView, CreateView, ListView, DetailView
from django.core.paginator import Paginator
from django.shortcuts import render

def Main(request):
    return render(request, "main.html")


#class RegisterView(CreateView):
    #template_name = 'register.html'
    #form_class = UserCreationForm
    #success_url = reverse_lazy('login')