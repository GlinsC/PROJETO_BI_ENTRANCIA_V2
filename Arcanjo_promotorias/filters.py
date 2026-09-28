from dj_rql.filter_cls import AutoRQLFilterClass, FilterLookups
from .models import Promotoria, PromotoriaResolucao, Resolucao

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
