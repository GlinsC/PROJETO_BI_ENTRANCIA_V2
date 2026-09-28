from django.db import models

# Create your models here.

class Promotoria(models.Model):
    nome_promotoria = models.CharField(max_length=100)
    entrancia = models.CharField(max_length=50)

    def __str__(self):
        return self.nome_promotoria

class Resolucao(models.Model):
    nome_resolucao = models.CharField(max_length=100)
    descricao_resolucao = models.TextField(blank=True)
    prazo_resolucao = models.CharField(max_length=100, blank=True)
    numero_resolucao = models.PositiveIntegerField()
    ano_resolucao = models.PositiveIntegerField()

    def __str__(self):
        return self.nome_resolucao

class PromotoriaResolucao(models.Model):
    promotoria = models.ForeignKey(Promotoria, on_delete=models.CASCADE)
    resolucao = models.ForeignKey(Resolucao, on_delete=models.CASCADE)
    Unidade = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.promotoria.nome_promotoria} - {self.resolucao.nome_resolucao}"