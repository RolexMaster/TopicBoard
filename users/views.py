from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User


def register(request):
    """사용자 등록"""
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, '회원가입이 완료되었습니다.')
            return redirect('home')
    else:
        form = UserCreationForm()
    
    context = {'form': form}
    return render(request, 'users/register.html', context)


def user_login(request):
    """사용자 로그인"""
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'{username}님 환영합니다!')
                return redirect('home')
    else:
        form = AuthenticationForm()
    
    context = {'form': form}
    return render(request, 'users/login.html', context)


@login_required
def user_logout(request):
    """사용자 로그아웃"""
    logout(request)
    messages.success(request, '로그아웃되었습니다.')
    return redirect('home')


@login_required
def profile(request):
    """사용자 프로필"""
    user = request.user
    # 사용자가 멤버인 토픽들
    user_topics = user.topicmember_set.all()
    # 사용자가 생성한 토픽들
    created_topics = user.topic_set.all()
    # 사용자가 담당자인 카드들
    assigned_cards = user.assigned_cards.all()
    
    context = {
        'user': user,
        'user_topics': user_topics,
        'created_topics': created_topics,
        'assigned_cards': assigned_cards,
    }
    return render(request, 'users/profile.html', context)