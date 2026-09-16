from django.shortcuts import render
from .models import Message, Profil
from .serializers import MessageSerialiser
from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Story, StoryView
from .serializers import StorySerializer

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerialiser
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        receiver_id = self.request.query_params.get('receiver')
        
        if receiver_id:
            return Message.objects.filter(
                (Q(sender=user) & Q(receiver_id=receiver_id)) | 
                (Q(sender_id=receiver_id) & Q(receiver=user))
            ).order_by('timestamp')
        
        return Message.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class RegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny] 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class UserListView(generics.ListAPIView):
    queryset = User.objects.exclude(username=None)
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class UpdateAvatarView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            profil, _ = Profil.objects.get_or_create(user=request.user)
            
            avatar_file = request.data.get('avatar')
            if not avatar_file:
                return Response({"error": "Aucune image reçue"}, status=400)

            profil.avatar = avatar_file
            profil.save()

            return Response({
                "avatar": request.build_absolute_uri(profil.avatar.url)
            }, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        



# Ajouter une story
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_story(request):
    serializer = StorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data)
    return Response(serializer.errors)

# Récupérer les stories (24h)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_stories(request):
    stories = Story.objects.filter(
        created_at__gte=timezone.now() - timedelta(hours=24)
    ).order_by("-created_at")

    data = {}

    for story in stories:
        user_id = story.user.id

        if user_id not in data:
            data[user_id] = {
                "user_id": story.user.id,
                "username": story.user.username,
                "stories": []
            }

        data[user_id]["stories"].append({
            "id": story.id,
            "image": request.build_absolute_uri(story.image.url),
            "created_at": story.created_at
        })

    return Response(list(data.values()))

# Voir une story
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def view_story(request, story_id):
    story = Story.objects.get(id=story_id)

    StoryView.objects.get_or_create(
        story=story,
        viewer=request.user
    )

    return Response({"message": "Vu"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def story_views(request, story_id):
    views = StoryView.objects.filter(story_id=story_id)
    users = [view.viewer.username for view in views]
    return Response(users)