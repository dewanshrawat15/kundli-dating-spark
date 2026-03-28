from django.contrib import admin

from .models import Profile, ProfileImage


class ProfileImageInline(admin.TabularInline):
    model = ProfileImage
    extra = 0
    readonly_fields = ("id", "image_key", "uploaded_at")
    fields = ("id", "image_key", "order", "is_primary", "uploaded_at")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "age", "current_city", "religion", "marital_status", "created_at")
    list_filter = ("religion", "marital_status", "sexual_orientation", "dating_preference")
    search_fields = ("name", "user__email", "current_city", "place_of_birth")
    readonly_fields = ("user", "created_at", "updated_at", "age")
    ordering = ("-created_at",)
    inlines = [ProfileImageInline]

    fieldsets = (
        ("Identity", {"fields": ("user", "name", "date_of_birth", "age")}),
        ("Birth Details", {"fields": ("time_of_birth", "place_of_birth", "birth_lat", "birth_lng")}),
        ("Location", {"fields": ("current_city", "current_lat", "current_lng")}),
        ("About", {"fields": ("bio", "sexual_orientation", "dating_preference")}),
        ("Matrimonial", {"fields": ("religion", "caste", "mother_tongue", "marital_status")}),
        ("Preferences", {"fields": ("min_age_preference", "max_age_preference", "max_distance_km")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(ProfileImage)
class ProfileImageAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "order", "is_primary", "uploaded_at")
    list_filter = ("is_primary",)
    search_fields = ("profile__name", "image_key")
    readonly_fields = ("id", "uploaded_at")
