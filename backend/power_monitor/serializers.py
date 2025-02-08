from rest_framework import serializers
from .models import ElectricalParameter

class ElectricalParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectricalParameter
        fields = '__all__'