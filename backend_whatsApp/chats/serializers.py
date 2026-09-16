from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

from .models import Story, StoryView, User
from .models import Message 
from .models import Profil

class MessageSerialiser(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
   
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'content', 'timestamp', 'sender_username', 'receiver_username', 'is_read']
        read_only_fields = ['sender', 'timestamp']



class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username        
        return token
    
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar"]

    def get_avatar(self, obj):
        try:
            profil = Profil.objects.get(user=obj)
            if profil.avatar:
                return self.context['request'].build_absolute_uri(profil.avatar.url)
        except:
            return None

class StorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = '__all__'

class StoryViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryView
        fields = '__all__'

