from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Topic(models.Model):
    """토픽 모델"""
    name = models.CharField(max_length=200, verbose_name="토픽명")
    description = models.TextField(blank=True, verbose_name="설명")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="생성자")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="생성일")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일")
    is_active = models.BooleanField(default=True, verbose_name="활성화")
    
    class Meta:
        verbose_name = "토픽"
        verbose_name_plural = "토픽들"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class TopicMember(models.Model):
    """토픽 멤버 모델"""
    ROLE_CHOICES = [
        ('admin', '관리자'),
        ('member', '멤버'),
        ('viewer', '뷰어'),
    ]
    
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, verbose_name="토픽")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="사용자")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member', verbose_name="역할")
    joined_at = models.DateTimeField(default=timezone.now, verbose_name="가입일")
    
    class Meta:
        verbose_name = "토픽 멤버"
        verbose_name_plural = "토픽 멤버들"
        unique_together = ['topic', 'user']
    
    def __str__(self):
        return f"{self.topic.name} - {self.user.username}"


class TopicCategory(models.Model):
    """토픽 카테고리 모델"""
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, verbose_name="토픽")
    name = models.CharField(max_length=100, verbose_name="카테고리명")
    color = models.CharField(max_length=7, default="#007bff", verbose_name="색상")
    order = models.IntegerField(default=0, verbose_name="순서")
    
    class Meta:
        verbose_name = "토픽 카테고리"
        verbose_name_plural = "토픽 카테고리들"
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.topic.name} - {self.name}"