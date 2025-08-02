from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from topics.models import Topic, TopicCategory


class Board(models.Model):
    """보드 모델"""
    name = models.CharField(max_length=200, verbose_name="보드명")
    description = models.TextField(blank=True, verbose_name="설명")
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, verbose_name="토픽")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="생성자")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="생성일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    
    class Meta:
        verbose_name = "보드"
        verbose_name_plural = "보드들"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.topic.name} - {self.name}"


class Column(models.Model):
    """보드 컬럼 모델 (예: To Do, In Progress, Done)"""
    name = models.CharField(max_length=100, verbose_name="컬럼명")
    board = models.ForeignKey(Board, on_delete=models.CASCADE, verbose_name="보드")
    order = models.IntegerField(default=0, verbose_name="순서")
    color = models.CharField(max_length=7, default="#6c757d", verbose_name="색상")
    
    class Meta:
        verbose_name = "컬럼"
        verbose_name_plural = "컬럼들"
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.board.name} - {self.name}"


class Card(models.Model):
    """보드 카드 모델"""
    PRIORITY_CHOICES = [
        ('low', '낮음'),
        ('medium', '보통'),
        ('high', '높음'),
        ('urgent', '긴급'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="제목")
    description = models.TextField(blank=True, verbose_name="설명")
    column = models.ForeignKey(Column, on_delete=models.CASCADE, verbose_name="컬럼")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="생성자")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='assigned_cards', verbose_name="담당자")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', verbose_name="우선순위")
    category = models.ForeignKey(TopicCategory, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="카테고리")
    due_date = models.DateTimeField(null=True, blank=True, verbose_name="마감일")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="생성일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
    order = models.IntegerField(default=0, verbose_name="순서")
    
    class Meta:
        verbose_name = "카드"
        verbose_name_plural = "카드들"
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return self.title


class CardComment(models.Model):
    """카드 댓글 모델"""
    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="카드")
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="작성자")
    content = models.TextField(verbose_name="내용")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="작성일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
    
    class Meta:
        verbose_name = "카드 댓글"
        verbose_name_plural = "카드 댓글들"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.card.title} - {self.author.username}"


class CardAttachment(models.Model):
    """카드 첨부파일 모델"""
    card = models.ForeignKey(Card, on_delete=models.CASCADE, verbose_name="카드")
    file = models.FileField(upload_to='card_attachments/', verbose_name="파일")
    filename = models.CharField(max_length=255, verbose_name="파일명")
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="업로드자")
    uploaded_at = models.DateTimeField(default=timezone.now, verbose_name="업로드일")
    
    class Meta:
        verbose_name = "카드 첨부파일"
        verbose_name_plural = "카드 첨부파일들"
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.card.title} - {self.filename}"