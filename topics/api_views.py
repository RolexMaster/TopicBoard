from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Topic, TopicMember
from .serializers import TopicSerializer, TopicMemberSerializer


class TopicListAPIView(generics.ListCreateAPIView):
    """토픽 목록 및 생성 API"""
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # 사용자가 멤버인 토픽들만 반환
        return Topic.objects.filter(
            topicmember__user=self.request.user,
            is_active=True
        ).distinct()
    
    def perform_create(self, serializer):
        topic = serializer.save(created_by=self.request.user)
        # 생성자를 관리자로 추가
        TopicMember.objects.create(
            topic=topic,
            user=self.request.user,
            role='admin'
        )


class TopicDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """토픽 상세, 수정, 삭제 API"""
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # 사용자가 멤버인 토픽들만 반환
        return Topic.objects.filter(
            topicmember__user=self.request.user,
            is_active=True
        )
    
    def perform_destroy(self, instance):
        # 실제 삭제하지 않고 비활성화
        instance.is_active = False
        instance.save()


class TopicMemberListAPIView(generics.ListCreateAPIView):
    """토픽 멤버 목록 및 추가 API"""
    serializer_class = TopicMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        topic_id = self.kwargs.get('topic_id')
        topic = get_object_or_404(Topic, id=topic_id, is_active=True)
        # 관리자만 멤버 목록 조회 가능
        if not TopicMember.objects.filter(topic=topic, user=self.request.user, role='admin').exists():
            return TopicMember.objects.none()
        return TopicMember.objects.filter(topic=topic)
    
    def perform_create(self, serializer):
        topic_id = self.kwargs.get('topic_id')
        topic = get_object_or_404(Topic, id=topic_id, is_active=True)
        # 관리자만 멤버 추가 가능
        if not TopicMember.objects.filter(topic=topic, user=self.request.user, role='admin').exists():
            raise permissions.PermissionDenied("멤버를 추가할 권한이 없습니다.")
        serializer.save(topic=topic)


class TopicMemberDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """토픽 멤버 상세, 수정, 삭제 API"""
    serializer_class = TopicMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        topic_id = self.kwargs.get('topic_id')
        topic = get_object_or_404(Topic, id=topic_id, is_active=True)
        # 관리자만 멤버 관리 가능
        if not TopicMember.objects.filter(topic=topic, user=self.request.user, role='admin').exists():
            return TopicMember.objects.none()
        return TopicMember.objects.filter(topic=topic)