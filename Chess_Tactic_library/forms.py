from django import forms
from django.contrib.auth.models import User
from .models import UserProfile 

class LoginForm(forms.Form):
    username = forms.CharField(max_length=100)
    password = forms.CharField(widget=forms.PasswordInput)

from django import forms
from .models import UserProfile

class UpdateProfileForm(forms.Form):
    username = forms.CharField(max_length=150, required=True)
    email = forms.EmailField(required=False)
    avatar = forms.ImageField(required=False)
    move_highlight_color = forms.CharField(max_length=7, required=False)
    completed_move_color = forms.CharField(max_length=7, required=False)

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if self.user:
            self.fields['username'].initial = self.user.username
            self.fields['email'].initial = self.user.email
            
            profile, _ = UserProfile.objects.get_or_create(user=self.user)
            self.fields['move_highlight_color'].initial = profile.move_highlight_color
            self.fields['completed_move_color'].initial = profile.completed_move_color

    def save(self):
        if not self.user:
            return
        
        self.user.username = self.cleaned_data['username']
        self.user.email = self.cleaned_data['email']
        self.user.save()

        profile, _ = UserProfile.objects.get_or_create(user=self.user)
        
        avatar = self.cleaned_data.get('avatar')
        if avatar:
            profile.avatar = avatar
            
        move_color = self.cleaned_data.get('move_highlight_color')
        if move_color is not None:
            profile.move_highlight_color = move_color
            
        completed_color = self.cleaned_data.get('completed_move_color')
        if completed_color is not None:
            profile.completed_move_color = completed_color
            
        profile.save()
        return self.user