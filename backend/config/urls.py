"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from storage.views import (
    latest_sensor_data,
    sensor_history,
    ai_recommendation,
    health_check
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/latest/', latest_sensor_data, name='latest_sensor_data'),
    path('api/history/', sensor_history, name='sensor_history'),
    path('api/ai-recommendation/', ai_recommendation, name='ai_recommendation'),
    path('api/health/', health_check, name='health_check'),
]
