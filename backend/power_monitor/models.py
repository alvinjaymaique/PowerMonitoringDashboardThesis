from django.db import models
from django.utils import timezone

# Create your models here.
class ElectricalParameter(models.Model):
    timestamp = models.DateTimeField(default=timezone.now)
    voltage = models.FloatField()
    current = models.FloatField()
    power = models.FloatField()
    power_factor = models.FloatField()
    frequency = models.FloatField()
    is_anomaly = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Reading at {self.timestamp}"