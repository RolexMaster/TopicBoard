from django.contrib import admin
from .models import Topic, TopicMember, TopicCategory


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20


@admin.register(TopicMember)
class TopicMemberAdmin(admin.ModelAdmin):
    list_display = ['topic', 'user', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['topic__name', 'user__username']
    readonly_fields = ['joined_at']
    list_per_page = 20


@admin.register(TopicCategory)
class TopicCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'topic', 'color', 'order']
    list_filter = ['topic']
    search_fields = ['name', 'topic__name']
    list_per_page = 20