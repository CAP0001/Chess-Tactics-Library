from django import forms
from django.contrib.auth.models import User
from .models import UserProfile 

class LoginForm(forms.Form):
    username = forms.CharField(max_length=100)
    password = forms.CharField(widget=forms.PasswordInput)

class UpdateProfileForm(forms.ModelForm):
    avatar = forms.ImageField(required=False)
    move_highlight_color = forms.CharField(required=False)
    completed_move_color = forms.CharField(required=False)

    class Meta:
        model = User
        fields = ['username', 'email']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Подтягиваем текущие цвета из профиля при открытии формы
        if self.instance and self.instance.is_authenticated:
            profile, _ = UserProfile.objects.get_or_create(user=self.instance)
            self.fields['move_highlight_color'].initial = profile.move_highlight_color
            self.fields['completed_move_color'].initial = profile.completed_move_color

    def save(self, commit=True):
        user = super().save(commit=commit)
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        if self.cleaned_data.get('avatar'):
            profile.avatar = self.cleaned_data['avatar']
            
        if self.cleaned_data.get('move_highlight_color'):
            profile.move_highlight_color = self.cleaned_data['move_highlight_color']
            
        if self.cleaned_data.get('completed_move_color'):
            profile.completed_move_color = self.cleaned_data['completed_move_color']
            
        profile.save()
        return user