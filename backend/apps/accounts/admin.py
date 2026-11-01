from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserProfile, AuditLog, AccountToken


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = (
        'email',
        'role',
        'first_name',
        'last_name',
        'is_staff',
        'is_active',
        'failed_login_attempts',
        'lockout_until',
        'created_at',
    )
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Role & Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Security & Lockout', {'fields': ('failed_login_attempts', 'last_failed_login', 'lockout_until', 'last_login_ip')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'role', 'password', 'is_staff', 'is_active'),
            },
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'created_at')
    search_fields = ('user__email', 'phone')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'actor_email', 'target_type', 'target_id', 'ip_address')
    list_filter = ('action', 'created_at')
    search_fields = ('actor_email', 'action', 'target_id', 'ip_address')
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(AccountToken)
class AccountTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token_type', 'is_used', 'expires_at', 'created_at')
    list_filter = ('token_type', 'is_used')
    search_fields = ('user__email', 'token_hash')
    readonly_fields = ('token_hash', 'created_at', 'used_at')
