from django.urls import path
from . import views

app_name = 'boards'

urlpatterns = [
    path('', views.home, name='home'),
    path('topic/<int:topic_id>/boards/', views.board_list, name='board_list'),
    path('topic/<int:topic_id>/boards/create/', views.board_create, name='board_create'),
    path('topic/<int:topic_id>/board/<int:board_id>/', views.board_detail, name='board_detail'),
    path('topic/<int:topic_id>/board/<int:board_id>/cards/create/', views.card_create, name='card_create'),
    path('topic/<int:topic_id>/board/<int:board_id>/card/<int:card_id>/', views.card_detail, name='card_detail'),
    path('topic/<int:topic_id>/board/<int:board_id>/card/<int:card_id>/move/', views.card_move, name='card_move'),
    path('topic/<int:topic_id>/board/<int:board_id>/card/<int:card_id>/assign/', views.card_assign, name='card_assign'),
]