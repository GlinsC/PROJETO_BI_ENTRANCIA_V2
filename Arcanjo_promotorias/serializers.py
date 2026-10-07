from rest_framework import serializers
from .models import Promotoria, Resolucao, PromotoriaResolucao, correicao

class PromotoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotoria
        fields = '__all__'

class ResolucaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resolucao
        fields = '__all__'

class PromotoriaResolucaoSerializer(serializers.ModelSerializer):
    promotoria = PromotoriaSerializer(read_only=True)
    resolucao = ResolucaoSerializer(read_only=True)
    promotoria_id = serializers.PrimaryKeyRelatedField(
        source='promotoria',
        queryset=Promotoria.objects.all(),
        write_only=True,
    )
    resolucao_id = serializers.PrimaryKeyRelatedField(
        source='resolucao',
        queryset=Resolucao.objects.all(),
        write_only=True,
    )

    class Meta:
        model = PromotoriaResolucao
        fields = [
            'id',
            'Unidade',
            'promotoria_id',
            'resolucao_id',
            'promotoria',
            'resolucao',
        ]

class CorreicaoSerializer(serializers.ModelSerializer):
    nome_promotoria = serializers.CharField(
        source='promotoria_unidade.nome_promotoria',
        read_only=True,
    )
    promotoria_id = serializers.PrimaryKeyRelatedField(
        source='promotoria_unidade',
        queryset=Promotoria.objects.all(),
        write_only=True,
    )

    class Meta:
        model = correicao
        fields = [
            'id',
            'promotoria_id',
            'nome_promotoria',
            'data_correcao',
        ]