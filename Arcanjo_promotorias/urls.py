from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromotoriaViewSet, ResolucaoViewSet, PromotoriaResolucaoViewSet

router = DefaultRouter()
router.register('promotorias', PromotoriaViewSet)
router.register('resolucoes', ResolucaoViewSet)
router.register('promotorias-resolucoes', PromotoriaResolucaoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]