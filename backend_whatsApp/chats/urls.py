from django.urls import path
from .views import MessageListCreateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView
from .views import UserListView
from .views import UpdateAvatarView
from .views import create_story, get_stories, view_story, story_views

urlpatterns = [
    path('messages/', MessageListCreateView.as_view(), name='messages'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('update-avatar/', UpdateAvatarView.as_view(), name='update-avatar'),

    path("story/", create_story),
    path("stories/", get_stories),
    path("story/<int:story_id>/view/", view_story),
    path("story/<int:story_id>/views/", story_views),
]

