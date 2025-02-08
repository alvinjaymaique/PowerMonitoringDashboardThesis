from django.contrib import admin
from .models import ElectricalParameter

# Register your models here.

@admin.register(ElectricalParameter)
class ElectricalParameterAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'voltage', 'current', 'power', 'power_factor', 'frequency', 'is_anomaly')
    list_filter = ('is_anomaly', 'timestamp')