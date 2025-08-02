from django.urls import path
from . import api_views

app_name = 'boards_api'

urlpatterns = [
    path('boards/', api_views.BoardListAPIView.as_view(), name='board_list'),
    path('boards/<int:pk>/', api_views.BoardDetailAPIView.as_view(), name='board_detail'),
    path('boards/<int:board_id>/columns/', api_views.ColumnListAPIView.as_view(), name='column_list'),
    path('boards/<int:board_id>/columns/<int:pk>/', api_views.ColumnDetailAPIView.as_view(), name='column_detail'),
    path('boards/<int:board_id>/cards/', api_views.CardListAPIView.as_view(), name='card_list'),
    path('boards/<int:board_id>/cards/<int:pk>/', api_views.CardDetailAPIView.as_view(), name='card_detail'),
    path('boards/<int:board_id>/cards/<int:card_id>/comments/', api_views.CardCommentListAPIView.as_view(), name='card_comment_list'),
    path('boards/<int:board_id>/cards/<int:card_id>/comments/<int:pk>/', api_views.CardCommentDetailAPIView.as_view(), name='card_comment_detail'),
]