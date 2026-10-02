from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PromotoriaResolucaoViewSet,
    PromotoriaResolucaoVisualizacaoView,
    PromotoriaViewSet,
    ResolucaoViewSet,
)

router = DefaultRouter()
router.register('promotorias', PromotoriaViewSet)
router.register('resolucoes', ResolucaoViewSet)
router.register('promotorias-resolucoes', PromotoriaResolucaoViewSet)

urlpatterns = [
    path(
        'visualizacao/',
        PromotoriaResolucaoVisualizacaoView.as_view(),
        name='promotorias-resolucoes-visualizacao',
    ),
    path('', include(router.urls)),
]