from django.urls import path

from . import views

urlpatterns = [
    path('register_user', views.register_user, name='register_user'),
    path('submit_ans', views.submit_ans, name='submit_ans'),
    path('view_record', views.view_record, name='view_record'),
]
