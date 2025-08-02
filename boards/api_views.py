from rest_framework import generics, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Board, Column, Card, CardComment
from .serializers import BoardSerializer, ColumnSerializer, CardSerializer, CardCommentSerializer
from topics.models import Topic, TopicMember


class BoardListAPIView(generics.ListCreateAPIView):
    """보드 목록 및 생성 API"""
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # 사용자가 멤버인 토픽의 보드들만 반환
        return Board.objects.filter(
            topic__topicmember__user=self.request.user,
            is_active=True
        ).distinct()
    
    def perform_create(self, serializer):
        topic_id = self.kwargs.get('topic_id')
        topic = get_object_or_404(Topic, id=topic_id, is_active=True)
        
        # 사용자가 해당 토픽의 멤버인지 확인
        if not TopicMember.objects.filter(topic=topic, user=self.request.user).exists():
            raise permissions.PermissionDenied("보드를 생성할 권한이 없습니다.")
        
        board = serializer.save(topic=topic, created_by=self.request.user)
        
        # 기본 컬럼들 생성
        default_columns = [
            {'name': 'To Do', 'order': 1, 'color': '#6c757d'},
            {'name': 'In Progress', 'order': 2, 'color': '#007bff'},
            {'name': 'Done', 'order': 3, 'color': '#28a745'},
        ]
        
        for col_data in default_columns:
            Column.objects.create(
                board=board,
                name=col_data['name'],
                order=col_data['order'],
                color=col_data['color']
            )


class BoardDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """보드 상세, 수정, 삭제 API"""
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # 사용자가 멤버인 토픽의 보드들만 반환
        return Board.objects.filter(
            topic__topicmember__user=self.request.user,
            is_active=True
        )
    
    def perform_destroy(self, instance):
        # 실제 삭제하지 않고 비활성화
        instance.is_active = False
        instance.save()


class ColumnListAPIView(generics.ListCreateAPIView):
    """컬럼 목록 및 생성 API"""
    serializer_class = ColumnSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        board_id = self.kwargs.get('board_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            return Column.objects.none()
        
        return Column.objects.filter(board=board)
    
    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            raise permissions.PermissionDenied("컬럼을 생성할 권한이 없습니다.")
        
        serializer.save(board=board)


class ColumnDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """컬럼 상세, 수정, 삭제 API"""
    serializer_class = ColumnSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        board_id = self.kwargs.get('board_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            return Column.objects.none()
        
        return Column.objects.filter(board=board)


class CardListAPIView(generics.ListCreateAPIView):
    """카드 목록 및 생성 API"""
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        board_id = self.kwargs.get('board_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            return Card.objects.none()
        
        return Card.objects.filter(column__board=board)
    
    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            raise permissions.PermissionDenied("카드를 생성할 권한이 없습니다.")
        
        serializer.save(created_by=self.request.user)


class CardDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """카드 상세, 수정, 삭제 API"""
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        board_id = self.kwargs.get('board_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            return Card.objects.none()
        
        return Card.objects.filter(column__board=board)


class CardCommentListAPIView(generics.ListCreateAPIView):
    """카드 댓글 목록 및 생성 API"""
    serializer_class = CardCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        board_id = self.kwargs.get('board_id')
        card_id = self.kwargs.get('card_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        card = get_object_or_404(Card, id=card_id, column__board=board)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            return CardComment.objects.none()
        
        return CardComment.objects.filter(card=card)
    
    def perform_create(self, serializer):
        board_id = self.kwargs.get('board_id')
        card_id = self.kwargs.get('card_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        card = get_object_or_404(Card, id=card_id, column__board=board)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            raise permissions.PermissionDenied("댓글을 작성할 권한이 없습니다.")
        
        serializer.save(card=card, author=self.request.user)


class CardCommentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """카드 댓글 상세, 수정, 삭제 API"""
    serializer_class = CardCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        board_id = self.kwargs.get('board_id')
        card_id = self.kwargs.get('card_id')
        board = get_object_or_404(Board, id=board_id, is_active=True)
        card = get_object_or_404(Card, id=card_id, column__board=board)
        
        # 사용자가 해당 보드의 토픽 멤버인지 확인
        if not TopicMember.objects.filter(topic=board.topic, user=self.request.user).exists():
            return CardComment.objects.none()
        
        return CardComment.objects.filter(card=card)