from django.shortcuts import render
from .models import Message
from .serializers import MessageSerialiser
from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from django.db.models import Q

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

# Un serializer pour afficher uniquement l'id et le nom
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

# La vue pour lister les utilisateurs
class UserListView(generics.ListAPIView):
    queryset = User.objects.exclude(username=None) # Ou n'importe quel filtre
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]