from django.urls import path
from . import views

app_name = 'topics'

urlpatterns = [
    path('', views.topic_list, name='topic_list'),
    path('create/', views.topic_create, name='topic_create'),
    path('<int:topic_id>/', views.topic_detail, name='topic_detail'),
    path('<int:topic_id>/edit/', views.topic_edit, name='topic_edit'),
    path('<int:topic_id>/members/', views.topic_members, name='topic_members'),
    path('<int:topic_id>/members/<int:member_id>/remove/', views.topic_member_remove, name='topic_member_remove'),
    path('<int:topic_id>/members/<int:member_id>/role/', views.topic_member_role_change, name='topic_member_role_change'),
]