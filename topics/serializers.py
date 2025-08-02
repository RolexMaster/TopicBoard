from rest_framework import serializers
from .models import Topic, TopicMember, TopicCategory


class TopicSerializer(serializers.ModelSerializer):
    """토픽 시리얼라이저"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = ['id', 'name', 'description', 'created_by', 'created_by_username', 
                 'created_at', 'updated_at', 'is_active', 'member_count']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.topicmember_set.count()


class TopicMemberSerializer(serializers.ModelSerializer):
    """토픽 멤버 시리얼라이저"""
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = TopicMember
        fields = ['id', 'topic', 'user', 'username', 'user_email', 'role', 'role_display', 'joined_at']
        read_only_fields = ['joined_at']


class TopicCategorySerializer(serializers.ModelSerializer):
    """토픽 카테고리 시리얼라이저"""
    class Meta:
        model = TopicCategory
        fields = ['id', 'topic', 'name', 'color', 'order']