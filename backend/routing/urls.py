"""
URL routing for routing app
"""

from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('routes/analyze/', views.analyze_routes, name='analyze_routes'),
]
