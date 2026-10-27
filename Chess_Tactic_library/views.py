from django.urls import reverse_lazy
from django.views.generic import FormView, CreateView, ListView, DetailView
from django.core.paginator import Paginator
from django.shortcuts import render
from django.contrib.auth.forms import UserCreationForm
from .forms import LoginForm, UpdateProfileForm
from .models import UserProfile
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login

def Main(request):
    return render(request, "main.html")
@login_required(login_url='/login/')
def profile(request):
    message = ""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = UpdateProfileForm(request.POST, request.FILES, instance=request.user)

        if form.is_valid():
            form.save()
            message = "Profile successfully saved!"
            form = UpdateProfileForm(instance=request.user)
    else:
        form = UpdateProfileForm(instance=request.user)


    return render(request, "profile.html", {"form": form, "message": message})
    
def logout_view(request):
    logout(request)
    return redirect('home') 

class RegisterView(CreateView):
    template_name = 'register.html'
    form_class = UserCreationForm
    success_url = reverse_lazy('Login')

class LoginView(FormView):
    template_name = 'login.html'
    form_class = LoginForm
    success_url = reverse_lazy('Main') 

    def form_valid(self, form):
        username = form.cleaned_data['username']
        password = form.cleaned_data['password']
        user = authenticate(self.request, username=username, password=password)
        if user is not None:
            login(self.request, user)
            return super().form_valid(form)
        else:
            form.add_error(None, 'Невірний логін або пароль')
            return self.form_invalid(form)
