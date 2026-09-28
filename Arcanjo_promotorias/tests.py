from types import SimpleNamespace

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

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
