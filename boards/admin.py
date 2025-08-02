from django.contrib import admin
from .models import Board, Column, Card, CardComment, CardAttachment


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ['name', 'topic', 'created_by', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'topic']
    search_fields = ['name', 'description', 'topic__name', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20


@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ['name', 'board', 'order', 'color']
    list_filter = ['board', 'order']
    search_fields = ['name', 'board__name']
    list_per_page = 20


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ['title', 'column', 'created_by', 'assigned_to', 'priority', 'created_at']
    list_filter = ['priority', 'created_at', 'column__board', 'category']
    search_fields = ['title', 'description', 'created_by__username', 'assigned_to__username']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20


@admin.register(CardComment)
class CardCommentAdmin(admin.ModelAdmin):
    list_display = ['card', 'author', 'created_at']
    list_filter = ['created_at', 'card__column__board']
    search_fields = ['content', 'author__username', 'card__title']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20


@admin.register(CardAttachment)
class CardAttachmentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'card', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at', 'card__column__board']
    search_fields = ['filename', 'uploaded_by__username', 'card__title']
    readonly_fields = ['uploaded_at']
    list_per_page = 20