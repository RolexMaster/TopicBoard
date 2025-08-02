from rest_framework import serializers
from .models import Board, Column, Card, CardComment, CardAttachment
from topics.models import TopicCategory


class BoardSerializer(serializers.ModelSerializer):
    """보드 시리얼라이저"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    column_count = serializers.SerializerMethodField()
    card_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Board
        fields = ['id', 'name', 'description', 'topic', 'topic_name', 'created_by', 
                 'created_by_username', 'created_at', 'updated_at', 'is_active', 
                 'column_count', 'card_count']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_column_count(self, obj):
        return obj.column_set.count()
    
    def get_card_count(self, obj):
        return Card.objects.filter(column__board=obj).count()


class ColumnSerializer(serializers.ModelSerializer):
    """컬럼 시리얼라이저"""
    card_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Column
        fields = ['id', 'name', 'board', 'order', 'color', 'card_count']
    
    def get_card_count(self, obj):
        return obj.card_set.count()


class CardSerializer(serializers.ModelSerializer):
    """카드 시리얼라이저"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    column_name = serializers.CharField(source='column.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Card
        fields = ['id', 'title', 'description', 'column', 'column_name', 'created_by', 
                 'created_by_username', 'assigned_to', 'assigned_to_username', 'priority', 
                 'priority_display', 'category', 'category_name', 'due_date', 'created_at', 
                 'updated_at', 'order', 'comment_count']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_comment_count(self, obj):
        return obj.cardcomment_set.count()


class CardCommentSerializer(serializers.ModelSerializer):
    """카드 댓글 시리얼라이저"""
    author_username = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = CardComment
        fields = ['id', 'card', 'author', 'author_username', 'content', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']


class CardAttachmentSerializer(serializers.ModelSerializer):
    """카드 첨부파일 시리얼라이저"""
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = CardAttachment
        fields = ['id', 'card', 'file', 'filename', 'uploaded_by', 'uploaded_by_username', 'uploaded_at']
        read_only_fields = ['uploaded_by', 'uploaded_at']