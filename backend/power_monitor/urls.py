from django.urls import path
from . import views

app_name = 'power_monitor'

urlpatterns = [
    path('parameters/', views.ElectricalParameterList.as_view(), name='parameter-list'),
    path('parameters/<int:pk>/', views.ElectricalParameterDetail.as_view(), name='parameter-detail'),
]