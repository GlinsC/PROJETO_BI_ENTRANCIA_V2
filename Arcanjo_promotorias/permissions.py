from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            self.message = 'Authentication credentials were not provided.'
            return False
        if not user.is_staff:
            self.message = 'Apenas membros da equipe podem acessar a API.'
            return False
        return True