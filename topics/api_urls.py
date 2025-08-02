from django.urls import path
from . import api_views

app_name = 'topics_api'

urlpatterns = [
    path('', api_views.TopicListAPIView.as_view(), name='topic_list'),
    path('<int:pk>/', api_views.TopicDetailAPIView.as_view(), name='topic_detail'),
    path('<int:topic_id>/members/', api_views.TopicMemberListAPIView.as_view(), name='topic_member_list'),
    path('<int:topic_id>/members/<int:pk>/', api_views.TopicMemberDetailAPIView.as_view(), name='topic_member_detail'),
]