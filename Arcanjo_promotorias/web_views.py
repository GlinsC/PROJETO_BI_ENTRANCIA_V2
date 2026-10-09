from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import reverse_lazy
from django.views.generic import TemplateView


class LoginPageView(LoginView):
    template_name = 'arcanjo/login.html'
    redirect_authenticated_user = True


class DashboardView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = 'arcanjo/painel.html'
    login_url = reverse_lazy('login')

    def test_func(self):
        return self.request.user.is_staff


class CorreicaoDashboardView(DashboardView):
    template_name = 'arcanjo/correicoes.html'


class LogoutPageView(LogoutView):
    next_page = reverse_lazy('login')