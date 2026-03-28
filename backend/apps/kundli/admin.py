from django.contrib import admin

from .models import BirthChart


@admin.register(BirthChart)
class BirthChartAdmin(admin.ModelAdmin):
    list_display = (
        "profile", "status", "rashi_name", "nakshatra_name", "lagna_name",
        "gana", "nadi", "is_manglik", "computed_at",
    )
    list_filter = ("status", "gana", "nadi", "is_manglik", "manglik_intensity")
    search_fields = ("profile__name", "profile__user__email", "rashi_name", "nakshatra_name")
    readonly_fields = ("profile", "computed_at", "created_at", "updated_at")
    ordering = ("-created_at",)

    fieldsets = (
        ("Profile", {"fields": ("profile", "status", "error_message")}),
        ("Moon Sign", {"fields": ("rashi", "rashi_name")}),
        ("Ascendant", {"fields": ("lagna", "lagna_name")}),
        ("Nakshatra", {"fields": ("nakshatra", "nakshatra_name", "nakshatra_pada")}),
        ("Koot Values", {"fields": ("gana", "yoni", "varna", "nadi", "bhakoot")}),
        ("Manglik", {"fields": ("is_manglik", "manglik_intensity")}),
        ("Planetary Positions", {"fields": ("planetary_positions",), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("computed_at", "created_at", "updated_at")}),
    )
