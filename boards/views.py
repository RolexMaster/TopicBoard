from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from topics.models import Topic, TopicMember
from .models import Board, Column, Card, CardComment, CardAttachment
from .forms import BoardForm, ColumnForm, CardForm, CardCommentForm


@login_required
def home(request):
    """홈 페이지 - 사용자의 토픽 목록"""
    user_topics = Topic.objects.filter(
        topicmember__user=request.user,
        is_active=True
    ).distinct()
    
    context = {
        'user_topics': user_topics,
    }
    return render(request, 'boards/home.html', context)


@login_required
def board_list(request, topic_id):
    """토픽의 보드 목록"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        messages.error(request, '이 토픽에 접근할 권한이 없습니다.')
        return redirect('home')
    
    boards = Board.objects.filter(topic=topic, is_active=True)
    
    context = {
        'topic': topic,
        'boards': boards,
    }
    return render(request, 'boards/board_list.html', context)


@login_required
def board_detail(request, topic_id, board_id):
    """보드 상세 페이지 (칸반 보드)"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    board = get_object_or_404(Board, id=board_id, topic=topic, is_active=True)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        messages.error(request, '이 보드에 접근할 권한이 없습니다.')
        return redirect('home')
    
    columns = Column.objects.filter(board=board)
    cards = Card.objects.filter(column__board=board).select_related('column', 'assigned_to', 'category')
    
    # 컬럼별로 카드 그룹화
    column_cards = {}
    for column in columns:
        column_cards[column.id] = cards.filter(column=column)
    
    context = {
        'topic': topic,
        'board': board,
        'columns': columns,
        'column_cards': column_cards,
    }
    return render(request, 'boards/board_detail.html', context)


@login_required
def board_create(request, topic_id):
    """보드 생성"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        messages.error(request, '이 토픽에 보드를 생성할 권한이 없습니다.')
        return redirect('home')
    
    if request.method == 'POST':
        form = BoardForm(request.POST)
        if form.is_valid():
            board = form.save(commit=False)
            board.topic = topic
            board.created_by = request.user
            board.save()
            
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
            
            messages.success(request, '보드가 성공적으로 생성되었습니다.')
            return redirect('board_detail', topic_id=topic.id, board_id=board.id)
    else:
        form = BoardForm()
    
    context = {
        'form': form,
        'topic': topic,
    }
    return render(request, 'boards/board_form.html', context)


@login_required
def card_create(request, topic_id, board_id):
    """카드 생성"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    board = get_object_or_404(Board, id=board_id, topic=topic, is_active=True)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        messages.error(request, '이 보드에 카드를 생성할 권한이 없습니다.')
        return redirect('home')
    
    if request.method == 'POST':
        form = CardForm(request.POST)
        if form.is_valid():
            card = form.save(commit=False)
            card.created_by = request.user
            card.save()
            messages.success(request, '카드가 성공적으로 생성되었습니다.')
            return redirect('board_detail', topic_id=topic.id, board_id=board.id)
    else:
        form = CardForm()
        form.fields['column'].queryset = Column.objects.filter(board=board)
    
    context = {
        'form': form,
        'topic': topic,
        'board': board,
    }
    return render(request, 'boards/card_form.html', context)


@login_required
def card_detail(request, topic_id, board_id, card_id):
    """카드 상세 페이지"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    board = get_object_or_404(Board, id=board_id, topic=topic, is_active=True)
    card = get_object_or_404(Card, id=card_id, column__board=board)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        messages.error(request, '이 카드에 접근할 권한이 없습니다.')
        return redirect('home')
    
    comments = CardComment.objects.filter(card=card)
    attachments = CardAttachment.objects.filter(card=card)
    
    if request.method == 'POST':
        comment_form = CardCommentForm(request.POST)
        if comment_form.is_valid():
            comment = comment_form.save(commit=False)
            comment.card = card
            comment.author = request.user
            comment.save()
            messages.success(request, '댓글이 추가되었습니다.')
            return redirect('card_detail', topic_id=topic.id, board_id=board.id, card_id=card.id)
    else:
        comment_form = CardCommentForm()
    
    context = {
        'topic': topic,
        'board': board,
        'card': card,
        'comments': comments,
        'attachments': attachments,
        'comment_form': comment_form,
    }
    return render(request, 'boards/card_detail.html', context)


@login_required
@require_http_methods(["POST"])
def card_move(request, topic_id, board_id, card_id):
    """카드 이동 (드래그 앤 드롭)"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    board = get_object_or_404(Board, id=board_id, topic=topic, is_active=True)
    card = get_object_or_404(Card, id=card_id, column__board=board)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        return JsonResponse({'success': False, 'message': '권한이 없습니다.'})
    
    new_column_id = request.POST.get('column_id')
    new_order = request.POST.get('order', 0)
    
    try:
        new_column = Column.objects.get(id=new_column_id, board=board)
        card.column = new_column
        card.order = int(new_order)
        card.save()
        return JsonResponse({'success': True, 'message': '카드가 이동되었습니다.'})
    except (Column.DoesNotExist, ValueError):
        return JsonResponse({'success': False, 'message': '잘못된 요청입니다.'})


@login_required
@require_http_methods(["POST"])
def card_assign(request, topic_id, board_id, card_id):
    """카드 담당자 지정"""
    topic = get_object_or_404(Topic, id=topic_id, is_active=True)
    board = get_object_or_404(Board, id=board_id, topic=topic, is_active=True)
    card = get_object_or_404(Card, id=card_id, column__board=board)
    
    # 사용자가 해당 토픽의 멤버인지 확인
    if not TopicMember.objects.filter(topic=topic, user=request.user).exists():
        return JsonResponse({'success': False, 'message': '권한이 없습니다.'})
    
    user_id = request.POST.get('user_id')
    if user_id:
        try:
            user = User.objects.get(id=user_id)
            card.assigned_to = user
            card.save()
            return JsonResponse({'success': True, 'message': '담당자가 지정되었습니다.'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': '존재하지 않는 사용자입니다.'})
    else:
        card.assigned_to = None
        card.save()
        return JsonResponse({'success': True, 'message': '담당자가 해제되었습니다.'})