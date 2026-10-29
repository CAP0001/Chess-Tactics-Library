from django.contrib import admin
from .models import UserProfile
from modeltranslation.admin import TranslationAdmin
from .models import ChessTactic
# Register your models here.
admin.site.register(UserProfile)

admin.site.register(ChessTactic)