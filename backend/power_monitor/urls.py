from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnomalyDetectionView,
    FirebaseDataView,
    FirebaseNodesView,
    FirebaseCompareView,
    NodeDateRangeView,
    # Add these new imports
    CacheStatsView,
    ClearCacheView,
    CachedNodesView,
    YearsForNodeView,
    MonthsForNodeYearView,
    DaysForNodeYearMonthView,
    NodeDataView,
    DashboardDataView,
    UserRegistrationView,
    UserLoginView,
    export_csv,
    user_profile,
    ClassifyReadingsView,
    ExplainAnomalyView,
    GlobalFeatureImportanceView,
    TestMLClassifierView,
)

# Create a router and register our ViewSets
router = DefaultRouter()

# Define URL patterns
urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Direct view endpoints
    path('anomalies/', AnomalyDetectionView.as_view(), name='anomalies'),
    path('firebase/data/', FirebaseDataView.as_view(), name='firebase-data'),
    path('firebase/nodes/', FirebaseNodesView.as_view(), name='firebase-nodes'),
    path('firebase/compare/', FirebaseCompareView.as_view(), name='firebase-compare'),
    path('firebase/date-range/', NodeDateRangeView.as_view(), name='firebase-date-range'),

    # Add new cache endpoints
    path('cache/stats/', CacheStatsView.as_view(), name='cache-stats'),
    path('cache/clear/', ClearCacheView.as_view(), name='clear-cache'),
    path('cache/nodes/', CachedNodesView.as_view(), name='cached-nodes'),
    path('firebase/years/', YearsForNodeView.as_view(), name='years-for-node'),
    path('firebase/months/', MonthsForNodeYearView.as_view(), name='months-for-node-year'),
    path('firebase/days/', DaysForNodeYearMonthView.as_view(), name='days-for-node-year-month'),
    path('firebase/node-data/', NodeDataView.as_view(), name='node-data'),
    path('firebase/dashboard-data/', DashboardDataView.as_view(), name='dashboard-data'),
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('power-readings/export-csv/', export_csv, name='export_csv'),
    path('auth/user-profile/', user_profile, name='user-profile'),
    path('firebase/node-date-range/', NodeDateRangeView.as_view(), name='node-date-range'),
    path('classify-readings/', ClassifyReadingsView.as_view(), name='classify-readings'),
    path('explain-anomaly/', ExplainAnomalyView.as_view(), name='explain-anomaly'),
    path('global-feature-importance/', GlobalFeatureImportanceView.as_view(), name='global-feature-importance'),
    path('test-ml-classifier/', TestMLClassifierView.as_view(), name='test-ml-classifier'),
]