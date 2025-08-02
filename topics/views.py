from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from .models import Topic, TopicMember, TopicCategory
from .forms import TopicForm, TopicMemberForm


@login_required
def topic_list(request):
    """토픽 목록 페이지"""
    # 사용자가 멤버인 토픽들
    user_topics = Topic.objects.filter(
        topicmember__user=request.user,
        is_active=True
    ).distinct()
    
    # 사용자가 생성한 토픽들
    created_topics = Topic.objects.filter(
        created_by=request.user,
        is_active=True
    )
    
    context = {
        'user_topics': user_topics,
        'created_topics': created_topics,
    }
    return render(request, 'topics/topic_list.html', context)


@login_required
def topic_detail(request, topic_id):
    """토픽 상세 페이지"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        messages.error(request, '이 토픽에 접근할 권한이 없습니다.')
        return redirect('topic_list')
    
    members = TopicMember.objects.filter(topic=topic)
    categories = TopicCategory.objects.filter(topic=topic)
    
    context = {
        'topic': topic,
        'members': members,
        'categories': categories,
    }
    return render(request, 'topics/topic_detail.html', context)


@login_required
def topic_create(request):
    """토픽 생성 페이지"""
    if request.method == 'POST':
        form = TopicForm(request.POST)
        if form.is_valid():
            topic = form.save(commit=False)
            topic.created_by = request.user
            topic.save()
            
            # 생성자를 관리자로 추가
            TopicMember.objects.create(
                topic=topic,
                user=request.user,
                role='admin'
            )
            
            messages.success(request, '토픽이 성공적으로 생성되었습니다.')
            return redirect('topic_detail', topic_id=topic.id)
    else:
        form = TopicForm()
    
    context = {'form': form}
    return render(request, 'topics/topic_form.html', context)


@login_required
def topic_edit(request, topic_id):
    """토픽 수정 페이지"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    
    # 관리자만 수정 가능
    if not TopicMember.objects.filter(topic=topic, user=request.user, role='admin').exists():
        messages.error(request, '토픽을 수정할 권한이 없습니다.')
        return redirect('topic_detail', topic_id=topic.id)
    
    if request.method == 'POST':
        form = TopicForm(request.POST, instance=topic)
        if form.is_valid():
            form.save()
            messages.success(request, '토픽이 성공적으로 수정되었습니다.')
            return redirect('topic_detail', topic_id=topic.id)
    else:
        form = TopicForm(instance=topic)
    
    context = {'form': form, 'topic': topic}
    return render(request, 'topics/topic_form.html', context)


@login_required
def topic_members(request, topic_id):
    """토픽 멤버 관리 페이지"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    
    # 관리자만 멤버 관리 가능
    if not TopicMember.objects.filter(topic=topic, user=request.user, role='admin').exists():
        messages.error(request, '멤버를 관리할 권한이 없습니다.')
        return redirect('topic_detail', topic_id=topic.id)
    
    if request.method == 'POST':
        form = TopicMemberForm(request.POST)
        if form.is_valid():
            member = form.save(commit=False)
            member.topic = topic
            
            # 이미 멤버인지 확인
            if TopicMember.objects.filter(topic=topic, user=member.user).exists():
                messages.error(request, '이미 멤버로 등록된 사용자입니다.')
            else:
                member.save()
                messages.success(request, '멤버가 성공적으로 추가되었습니다.')
            return redirect('topic_members', topic_id=topic.id)
    else:
        form = TopicMemberForm()
    
    members = TopicMember.objects.filter(topic=topic)
    
    context = {
        'topic': topic,
        'form': form,
        'members': members,
    }
    return render(request, 'topics/topic_members.html', context)


@login_required
@require_http_methods(["POST"])
def topic_member_remove(request, topic_id, member_id):
    """토픽 멤버 제거"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    member = get_object_or_404(TopicMember, id=member_id, topic=topic)
    
    # 관리자만 멤버 제거 가능
    if not TopicMember.objects.filter(topic=topic, user=request.user, role='admin').exists():
        return JsonResponse({'success': False, 'message': '권한이 없습니다.'})
    
    member.delete()
    return JsonResponse({'success': True, 'message': '멤버가 제거되었습니다.'})


@login_required
@require_http_methods(["POST"])
def topic_member_role_change(request, topic_id, member_id):
    """토픽 멤버 역할 변경"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    member = get_object_or_404(TopicMember, id=member_id, topic=topic)
    
    # 관리자만 역할 변경 가능
    if not TopicMember.objects.filter(topic=topic, user=request.user, role='admin').exists():
        return JsonResponse({'success': False, 'message': '권한이 없습니다.'})
    
    new_role = request.POST.get('role')
    if new_role in ['admin', 'member', 'viewer']:
        member.role = new_role
        member.save()
        return JsonResponse({'success': True, 'message': '역할이 변경되었습니다.'})
    
    return JsonResponse({'success': False, 'message': '잘못된 역할입니다.'})