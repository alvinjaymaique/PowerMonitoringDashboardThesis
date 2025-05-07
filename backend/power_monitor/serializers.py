from rest_framework import serializers
from .models import User, ElectricalParameter

class ElectricalParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectricalParameter
        fields = '__all__'\
            
class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password2']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords must match")
        return data
    
    def create(self, validated_data):
        # Remove password2 from validated data
        validated_data.pop('password2', None)
        
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(max_length=128, write_only=True)
    
class PowerReadingSerializer(serializers.Serializer):
    """Serializer for power reading data"""
    id = serializers.CharField()
    deviceId = serializers.CharField()
    timestamp = serializers.DateTimeField()
    voltage = serializers.FloatField()
    current = serializers.FloatField()
    power = serializers.FloatField()
    frequency = serializers.FloatField()
    power_factor = serializers.FloatField()
    is_anomaly = serializers.BooleanField(default=False)
    anomaly_parameters = serializers.ListField(child=serializers.CharField(), default=[])
    anomaly_type = serializers.CharField(default="Normal")  # Ensure this field is included