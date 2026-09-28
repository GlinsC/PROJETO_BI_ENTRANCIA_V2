from dj_rql.drf import RQLFilterBackend
from rest_framework import viewsets
from .models import Promotoria, Resolucao, PromotoriaResolucao
from .serializers import PromotoriaSerializer, ResolucaoSerializer, PromotoriaResolucaoSerializer
from .filters import PromotoriaFilterClass, ResolucaoFilterClass, PromotoriaResolucaoFilterClass


# Create your views here.

class PromotoriaViewSet(viewsets.ModelViewSet):
    queryset = Promotoria.objects.all()
    serializer_class = PromotoriaSerializer
    filter_backends = [RQLFilterBackend]
    rql_filter_class = PromotoriaFilterClass

class ResolucaoViewSet(viewsets.ModelViewSet):
    queryset = Resolucao.objects.all()
    serializer_class = ResolucaoSerializer
    filter_backends = [RQLFilterBackend]
    rql_filter_class = ResolucaoFilterClass

class PromotoriaResolucaoViewSet(viewsets.ModelViewSet):
    queryset = PromotoriaResolucao.objects.select_related(
        'promotoria', 'resolucao'
    )
    serializer_class = PromotoriaResolucaoSerializer
    filter_backends = [RQLFilterBackend]
    rql_filter_class =PromotoriaResolucaoFilterClass
