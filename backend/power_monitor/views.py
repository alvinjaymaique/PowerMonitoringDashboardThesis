from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ElectricalParameter
from .serializers import ElectricalParameterSerializer

# Create your views here.

class ElectricalParameterList(generics.ListCreateAPIView):
    queryset = ElectricalParameter.objects.all()
    serializer_class = ElectricalParameterSerializer
    # permission_classes = [IsAuthenticated]

class ElectricalParameterDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ElectricalParameter.objects.all()
    serializer_class = ElectricalParameterSerializer
    permission_classes = [IsAuthenticated]