from django.contrib import admin
from .models import UserProfile
from modeltranslation.admin import TranslationAdmin

# Register your models here.
admin.site.register(UserProfile)