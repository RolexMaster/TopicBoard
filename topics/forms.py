from django import forms
from django.contrib.auth.models import User
from .models import Topic, TopicMember


class TopicForm(forms.ModelForm):
    """토픽 생성/수정 폼"""
    class Meta:
        model = Topic
        fields = ['name', 'description']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '토픽명을 입력하세요'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': '토픽에 대한 설명을 입력하세요'
            })
        }


class TopicMemberForm(forms.ModelForm):
    """토픽 멤버 추가 폼"""
    username = forms.CharField(
        label="사용자명",
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '사용자명을 입력하세요'
        })
    )
    
    class Meta:
        model = TopicMember
        fields = ['role']
        widgets = {
            'role': forms.Select(attrs={
                'class': 'form-select'
            })
        }
    
    def clean_username(self):
        username = self.cleaned_data.get('username')
        try:
            user = User.objects.get(username=username)
            return user
        except User.DoesNotExist:
            raise forms.ValidationError('존재하지 않는 사용자명입니다.')
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.user = self.cleaned_data['username']
        if commit:
            instance.save()
        return instance