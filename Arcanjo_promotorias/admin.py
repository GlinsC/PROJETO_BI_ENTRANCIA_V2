from django.contrib import admin

from Arcanjo_promotorias.models import Promotoria, PromotoriaResolucao, Resolucao

# Register your models here.
class PromotoriaAdmin(admin.ModelAdmin):
    list_display = ('nome_promotoria', 'entrancia')
    search_fields = ('nome_promotoria', 'entrancia')

class ResolucaoAdmin(admin.ModelAdmin):
    list_display = ('nome_resolucao', 'descricao_resolucao', 'prazo_resolucao', 'numero_resolucao', 'ano_resolucao')
    search_fields = ('nome_resolucao', 'descricao_resolucao')

class PromotoriaResolucaoAdmin(admin.ModelAdmin):
    list_display = ('promotoria', 'resolucao', 'Unidade')
    search_fields = ('promotoria__nome_promotoria', 'resolucao__nome_resolucao', 'Unidade')

admin.site.register(Promotoria, PromotoriaAdmin)
admin.site.register(Resolucao, ResolucaoAdmin)
admin.site.register(PromotoriaResolucao, PromotoriaResolucaoAdmin)