from django.contrib import admin
from modeltranslation.admin import TranslationAdmin
from .models import ChessTactic, ChessPuzzles, UserProfile
# Register your models here.
admin.site.register(UserProfile)
admin.site.register(ChessTactic)
admin.site.register(ChessPuzzles)