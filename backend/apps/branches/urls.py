from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BranchViewSet, ServiceabilityCheckView

router = DefaultRouter()
router.register(r'branches', BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),
    path('serviceability/', ServiceabilityCheckView.as_view(), name='serviceability-check'),
]
