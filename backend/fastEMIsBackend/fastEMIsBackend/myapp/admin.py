from django.contrib import admin
from .models import (
    Announcement,
    AgreementAnswer,
    AgreementQuestion,
    ChatMessage,
    CustomUser,
    GlobalPaymentConfig,
    PaymentConfigTemplate,
    PaymentTransaction
)

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'first_name', 'is_active', 'is_admin', 'is_chat_favorite', 'last_login', 'last_seen_at')
    search_fields = ('email', 'first_name', 'mobile_number')
    list_filter = ('is_active', 'is_admin', 'is_chat_favorite')


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'sender_role', 'message_type', 'created_at', 'deleted_for_everyone')
    list_filter = ('sender_role', 'message_type', 'deleted_for_everyone')
    search_fields = ('user__email', 'content', 'media_name')


@admin.register(GlobalPaymentConfig)
class GlobalPaymentConfigAdmin(admin.ModelAdmin):
    list_display = ('id', 'account_holder_name', 'bank_name', 'created_at', 'expires_at', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('account_holder_name', 'bank_name', 'account_number', 'ifsc')


@admin.register(PaymentConfigTemplate)
class PaymentConfigTemplateAdmin(admin.ModelAdmin):
    list_display = ('id', 'account_holder_name', 'bank_name', 'created_at')
    search_fields = ('account_holder_name', 'bank_name', 'account_number', 'ifsc')


@admin.register(AgreementQuestion)
class AgreementQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_id', 'description', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('description',)


@admin.register(AgreementAnswer)
class AgreementAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'question', 'answer', 'answered_at')
    list_filter = ('answer',)
    search_fields = ('user__email', 'question__description')


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'transaction_id', 'amount_inr', 'status', 'created_at', 'reviewed_at')
    list_filter = ('status',)
    search_fields = ('transaction_id', 'user__email', 'user__mobile_number')


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'target_user', 'title', 'is_active', 'created_at', 'updated_at')
    list_filter = ('type', 'is_active')
    search_fields = ('title', 'description', 'cta_text', 'target_user__email', 'target_user__mobile_number')
