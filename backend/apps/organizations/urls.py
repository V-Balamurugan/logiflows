from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, MyMembershipsView

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')

urlpatterns = [
    path('', include(router.urls)),
    path('memberships/me/', MyMembershipsView.as_view(), name='memberships-me'),
]

