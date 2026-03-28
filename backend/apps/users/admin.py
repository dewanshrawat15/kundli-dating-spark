from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "is_active", "is_staff", "is_onboarding_complete", "created_at")
    list_filter = ("is_active", "is_staff", "is_onboarding_complete")
    search_fields = ("email",)
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        ("Status", {"fields": ("is_active", "is_staff", "is_superuser", "is_onboarding_complete")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2"),
        }),
    )
    # Custom user model uses email not username
    filter_horizontal = ("groups", "user_permissions")
