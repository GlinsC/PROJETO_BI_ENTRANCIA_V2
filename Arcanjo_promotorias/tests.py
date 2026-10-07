from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework.test import APIClient, APIRequestFactory, APITestCase

from .models import Promotoria, PromotoriaResolucao, Resolucao, correicao
from .permissions import IsStaff
from .web_views import DashboardView



class IsStaffPermissionTests(SimpleTestCase):
	def setUp(self):
		self.permission = IsStaff()
		self.factory = APIRequestFactory()

	def test_allows_staff_user(self):
		request = self.factory.get('/api/')
		request.user = SimpleNamespace(is_authenticated=True, is_staff=True)

		self.assertTrue(self.permission.has_permission(request, None))

	def test_denies_authenticated_non_staff_user(self):
		request = self.factory.get('/api/')
		request.user = SimpleNamespace(is_authenticated=True, is_staff=False)

		self.assertFalse(self.permission.has_permission(request, None))

	def test_denies_anonymous_user(self):
		request = self.factory.get('/api/')
		request.user = SimpleNamespace(is_authenticated=False, is_staff=False)

		self.assertFalse(self.permission.has_permission(request, None))


class DashboardAccessTests(SimpleTestCase):
	def test_only_staff_can_pass_dashboard_check(self):
		view = DashboardView()
		view.request = SimpleNamespace(user=SimpleNamespace(is_staff=True))
		self.assertTrue(view.test_func())

		view.request = SimpleNamespace(user=SimpleNamespace(is_staff=False))
		self.assertFalse(view.test_func())


class CrudPaginationTests(APITestCase):
	def setUp(self):
		user = get_user_model().objects.create_user(
			username='staff-pagination',
			password='test-password',
			is_staff=True,
		)
		self.client.force_authenticate(user=user)
		for numero in range(3):
			Promotoria.objects.create(
				nome_promotoria=f'Promotoria {numero}',
				entrancia='1ª Entrância',
			)

	def test_crud_list_returns_paginated_results(self):
		response = self.client.get('/api/promotorias/?page_size=2')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['count'], 3)
		self.assertEqual(len(response.data['results']), 2)
		self.assertIsNotNone(response.data['next'])


class PromotoriaResolucaoPaginationTests(APITestCase):
	def setUp(self):
		user = get_user_model().objects.create_user(
			username='staff-relation-pagination',
			password='test-password',
			is_staff=True,
		)
		self.client.force_authenticate(user=user)
		promotoria = Promotoria.objects.create(
			nome_promotoria='Promotoria de teste',
			entrancia='1ª Entrância',
		)
		resolucao = Resolucao.objects.create(
			nome_resolucao='Resolução de teste',
			descricao_resolucao='',
			prazo_resolucao='',
			numero_resolucao=1,
			ano_resolucao=2026,
		)
		PromotoriaResolucao.objects.bulk_create([
			PromotoriaResolucao(promotoria=promotoria, resolucao=resolucao)
			for _ in range(601)
		])

	def test_relation_list_accepts_page_size_of_600_and_caps_larger_requests(self):
		response = self.client.get('/api/promotorias-resolucoes/?page_size=1000')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['count'], 601)
		self.assertEqual(len(response.data['results']), 600)
		self.assertIsNotNone(response.data['next'])


class PromotoriaResolucaoVisualizacaoTests(APITestCase):
	def setUp(self):
		self.client = APIClient()
		promotoria = Promotoria.objects.create(
			nome_promotoria='Promotoria de teste',
			entrancia='1ª Entrância',
		)
		resolucao = Resolucao.objects.create(
			nome_resolucao='Resolução de teste',
			descricao_resolucao='Descrição de teste',
			prazo_resolucao='30 dias',
			numero_resolucao=1,
			ano_resolucao=2026,
		)
		PromotoriaResolucao.objects.create(
			promotoria=promotoria,
			resolucao=resolucao,
			Unidade='Unidade de teste',
		)

	def test_get_returns_nested_promotoria_and_resolucao(self):
		response = self.client.get(reverse('promotorias-resolucoes-visualizacao'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data[0]['promotoria']['nome_promotoria'], 'Promotoria de teste')
		self.assertEqual(response.data[0]['resolucao']['nome_resolucao'], 'Resolução de teste')

	def test_post_is_not_allowed(self):
		response = self.client.post(reverse('promotorias-resolucoes-visualizacao'), {})

		self.assertEqual(response.status_code, 405)


class CorreicaoApiTests(APITestCase):
	def setUp(self):
		user = get_user_model().objects.create_user(
			username='staff-correicao',
			password='test-password',
			is_staff=True,
		)
		self.client.force_authenticate(user=user)
		self.promotoria = Promotoria.objects.create(
			nome_promotoria='Promotoria de teste',
			entrancia='1ª Entrância',
		)

	def test_create_accepts_promotoria_id_and_returns_name_and_date(self):
		response = self.client.post('/api/correicoes/', {
			'promotoria_id': self.promotoria.id,
			'data_correcao': '2026-10-07',
		}, format='json')

		self.assertEqual(response.status_code, 201)
		self.assertEqual(response.data['nome_promotoria'], 'Promotoria de teste')
		self.assertEqual(response.data['data_correcao'], '2026-10-07')
		self.assertNotIn('promotoria_id', response.data)
		self.assertEqual(correicao.objects.get().promotoria_unidade, self.promotoria)
