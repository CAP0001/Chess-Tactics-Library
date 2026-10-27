from django import forms
from django.contrib.auth.models import User
from .models import UserProfile 

class LoginForm(forms.Form):
    username = forms.CharField(max_length=100)
    password = forms.CharField(widget=forms.PasswordInput)

class UpdateProfileForm(forms.ModelForm):
    avatar = forms.ImageField(required=False)

    class Meta:
        model = User
        fields = ['username', 'email']

    def save(self, commit=True):
        user = super().save(commit=commit)
        profile, created = UserProfile.objects.get_or_create(user=user)
        if self.cleaned_data.get('avatar'):
            profile.avatar = self.cleaned_data['avatar']
            profile.save()
        return user
