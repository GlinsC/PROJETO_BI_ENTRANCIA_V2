from dj_rql.drf import RQLFilterBackend
from rest_framework import generics, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from .models import Promotoria, Resolucao, PromotoriaResolucao, correicao
from .serializers import CorreicaoSerializer, PromotoriaSerializer, ResolucaoSerializer, PromotoriaResolucaoSerializer
from .filters import CorreicaoFilterClass, PromotoriaFilterClass, ResolucaoFilterClass, PromotoriaResolucaoFilterClass


# Create your views here.

class CrudPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PromotoriaResolucaoPagination(CrudPagination):
    max_page_size = 600


class PromotoriaViewSet(viewsets.ModelViewSet):
    queryset = Promotoria.objects.order_by('id')
    serializer_class = PromotoriaSerializer
    pagination_class = CrudPagination
    filter_backends = [RQLFilterBackend]
    rql_filter_class = PromotoriaFilterClass

class ResolucaoViewSet(viewsets.ModelViewSet):
    queryset = Resolucao.objects.order_by('id')
    serializer_class = ResolucaoSerializer
    pagination_class = CrudPagination
    filter_backends = [RQLFilterBackend]
    rql_filter_class = ResolucaoFilterClass

class PromotoriaResolucaoViewSet(viewsets.ModelViewSet):
    queryset = PromotoriaResolucao.objects.select_related(
        'promotoria', 'resolucao'
    ).order_by('id')
    serializer_class = PromotoriaResolucaoSerializer
    pagination_class = PromotoriaResolucaoPagination
    filter_backends = [RQLFilterBackend]
    rql_filter_class =PromotoriaResolucaoFilterClass


class PromotoriaResolucaoVisualizacaoView(generics.ListAPIView):
    http_method_names = ['get']
    permission_classes = [AllowAny]
    pagination_class = None
    queryset = PromotoriaResolucao.objects.select_related(
        'promotoria', 'resolucao'
    )
    serializer_class = PromotoriaResolucaoSerializer

class CorreicaoViewSet(viewsets.ModelViewSet):
    queryset = correicao.objects.select_related('promotoria_unidade').order_by('id')
    serializer_class = CorreicaoSerializer
    pagination_class = CrudPagination
    filter_backends = [RQLFilterBackend]
    rql_filter_class = CorreicaoFilterClass
