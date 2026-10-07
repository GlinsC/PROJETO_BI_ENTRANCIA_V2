from dj_rql.filter_cls import AutoRQLFilterClass, FilterLookups
from .models import Promotoria, PromotoriaResolucao, Resolucao, correicao

class PromotoriaFilterClass(AutoRQLFilterClass):
    MODEL = Promotoria


class ResolucaoFilterClass(AutoRQLFilterClass):
    MODEL = Resolucao
    

class PromotoriaResolucaoFilterClass(AutoRQLFilterClass):
    MODEL = PromotoriaResolucao
    FILTERS = [
        {
            'filter': 'promotoria_id',
            'source': 'promotoria__id',
        },
        {
            'filter': 'resolucao_id',
            'source': 'resolucao__id',
        },
    ]

class CorreicaoFilterClass(AutoRQLFilterClass):
    MODEL = correicao
    FILTERS = [
        {
            'filter': 'promotoria_unidade_id',
            'source': 'promotoria_unidade__id',
        },
    ]