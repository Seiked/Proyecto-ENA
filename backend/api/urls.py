from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import SensorDataViewSet

router = DefaultRouter()
router.register(r'sensor-data', SensorDataViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]