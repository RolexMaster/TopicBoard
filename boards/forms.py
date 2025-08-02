from django import forms
from django.contrib.auth.models import User
from .models import Board, Column, Card, CardComment
from topics.models import TopicCategory


class BoardForm(forms.ModelForm):
    """보드 생성/수정 폼"""
    class Meta:
        model = Board
        fields = ['name', 'description']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '보드명을 입력하세요'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '보드에 대한 설명을 입력하세요'
            })
        }


class ColumnForm(forms.ModelForm):
    """컬럼 생성/수정 폼"""
    class Meta:
        model = Column
        fields = ['name', 'order', 'color']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '컬럼명을 입력하세요'
            }),
            'order': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0
            }),
            'color': forms.TextInput(attrs={
                'class': 'form-control',
                'type': 'color'
            })
        }


class CardForm(forms.ModelForm):
    """카드 생성/수정 폼"""
    class Meta:
        model = Card
        fields = ['title', 'description', 'column', 'assigned_to', 'priority', 'category', 'due_date']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '카드 제목을 입력하세요'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': '카드 내용을 입력하세요'
            }),
            'column': forms.Select(attrs={
                'class': 'form-select'
            }),
            'assigned_to': forms.Select(attrs={
                'class': 'form-select'
            }),
            'priority': forms.Select(attrs={
                'class': 'form-select'
            }),
            'category': forms.Select(attrs={
                'class': 'form-select'
            }),
            'due_date': forms.DateTimeInput(attrs={
                'class': 'form-control',
                'type': 'datetime-local'
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 담당자 선택을 토픽 멤버로 제한
        if 'instance' in kwargs and kwargs['instance']:
            board = kwargs['instance'].column.board
            topic = board.topic
            self.fields['assigned_to'].queryset = User.objects.filter(
                topicmember__topic=topic
            )
            self.fields['category'].queryset = TopicCategory.objects.filter(topic=topic)
        else:
            self.fields['assigned_to'].queryset = User.objects.none()
            self.fields['category'].queryset = TopicCategory.objects.none()


class CardCommentForm(forms.ModelForm):
    """카드 댓글 폼"""
    class Meta:
        model = CardComment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '댓글을 입력하세요'
            })
        }