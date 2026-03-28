from django.contrib import admin

from .models import CompatibilityScore, UserMatchDecision


@admin.register(CompatibilityScore)
class CompatibilityScoreAdmin(admin.ModelAdmin):
    list_display = (
        "user_a", "user_b", "guna_milan_total", "overall_score",
        "is_manglik_compatible", "narrative_generated_at", "created_at",
    )
    list_filter = ("is_manglik_compatible",)
    search_fields = ("user_a__name", "user_a__user__email", "user_b__name", "user_b__user__email")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-overall_score",)

    fieldsets = (
        ("Pair", {"fields": ("id", "user_a", "user_b", "is_manglik_compatible")}),
        ("Ashtakoot Breakdown", {"fields": (
            "varna_score", "vasya_score", "tara_score", "yoni_score",
            "graha_maitri_score", "gana_score", "bhakoot_score", "nadi_score",
            "guna_milan_total",
        )}),
        ("Overall", {"fields": ("overall_score",)}),
        ("Narrative", {"fields": ("narrative", "narrative_generated_at"), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(UserMatchDecision)
class UserMatchDecisionAdmin(admin.ModelAdmin):
    list_display = ("user", "candidate", "decision", "decided_at")
    list_filter = ("decision",)
    search_fields = ("user__name", "user__user__email", "candidate__name", "candidate__user__email")
    readonly_fields = ("id", "decided_at")
    ordering = ("-decided_at",)
