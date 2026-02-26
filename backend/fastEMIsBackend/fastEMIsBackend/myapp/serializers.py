import re
from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from .models import (
    Announcement,
    AgreementAnswer,
    AgreementQuestion,
    ChatMessage,
    CommunityPersona,
    CommunitySettings,
    CommunityPost,
    CustomUser,
    GhostChatMessage,
    GhostChatThread,
    GlobalPaymentConfig,
    ModerationEvent,
    PaymentConfigTemplate,
    PaymentTransaction
)

PAN_PATTERN = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]$')
AADHAR_PATTERN = re.compile(r'^[0-9]{12}$')
GHOST_ID_PATTERN = re.compile(r'^[A-Za-z0-9_-]{3,40}$')

PROFILE_REQUIRED_FIELDS = [
    'mobile_number',
    'marital_status',
    'pincode',
    'city',
    'full_address',
    'employment_type',
    'what_you_do',
    'monthly_salary',
    'requested_amount',
    'aadhar_number',
    'pan_number',
    'aadhar_image',
    'pancard_image',
    'live_photo'
]

PROFILE_FIELD_LABELS = {
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'email': 'Email',
    'mobile_number': 'Mobile Number',
    'marital_status': 'Marital Status',
    'spouse_occupation': 'Spouse Occupation',
    'pincode': 'PIN Code',
    'city': 'City',
    'full_address': 'Full Address',
    'employment_type': 'Employment Type',
    'what_you_do': 'What You Do',
    'monthly_salary': 'Monthly Salary',
    'requested_amount': 'Requested Amount',
    'aadhar_number': 'Aadhaar Number',
    'pan_number': 'PAN Number',
    'aadhar_image': 'Aadhaar Proof',
    'pancard_image': 'PAN Proof',
    'live_photo': 'Live Photo',
    'agreement_signature': 'Agreement Signature',
    'agreement_consent_video': 'Agreement Consent Video'
}


def _has_value(value) -> bool:
    if value is None:
        return False

    if hasattr(value, 'name'):
        file_name = getattr(value, 'name', None)
        if file_name is None:
            return False
        return bool(str(file_name).strip())

    if isinstance(value, str):
        return bool(value.strip())

    return True


def _to_positive_number(raw_value: str):
    try:
        value = Decimal(str(raw_value).strip())
    except (InvalidOperation, TypeError, ValueError):
        return None

    if value <= 0:
        return None
    return value


def calculate_profile_completion(user: CustomUser) -> dict:
    required_fields = list(PROFILE_REQUIRED_FIELDS)
    if str(user.marital_status or '').strip().lower() == 'married':
        required_fields.append('spouse_occupation')

    missing_fields = [
        field for field in required_fields
        if not _has_value(getattr(user, field, None))
    ]

    completed = len(required_fields) - len(missing_fields)
    progress = int(round((completed / len(required_fields)) * 100)) if required_fields else 100

    return {
        'profile_complete': len(missing_fields) == 0,
        'profile_progress': progress,
        'missing_fields': missing_fields
    }


def _format_profile_value(value):
    if not _has_value(value):
        return 'Not filled yet'

    if hasattr(value, 'url'):
        try:
            file_url = getattr(value, 'url', '')
        except Exception:
            file_url = ''
        return str(file_url or '').strip() or 'Not filled yet'

    return str(value).strip() or 'Not filled yet'


def build_agent_user_summary_payload(user: CustomUser) -> dict:
    completion = calculate_profile_completion(user)
    required_count = len(PROFILE_REQUIRED_FIELDS)
    if str(user.marital_status or '').strip().lower() == 'married':
        required_count += 1

    return {
        'id': str(user.id),
        'full_name': (str(user.first_name or '').strip() + ' ' + str(user.last_name or '').strip()).strip() or 'Not filled yet',
        'email': str(user.email or '').strip() or 'Not filled yet',
        'mobile_number': str(user.mobile_number or '').strip() or 'Not filled yet',
        'requested_amount': str(user.requested_amount or '').strip() or 'Not filled yet',
        'marital_status': str(user.marital_status or '').strip() or 'Not filled yet',
        'is_active': bool(user.is_active),
        'is_chat_favorite': bool(user.is_chat_favorite),
        'agreement_tab_enabled': bool(user.agreement_tab_enabled),
        'agreement_completed_at': user.agreement_completed_at.isoformat() if user.agreement_completed_at else None,
        'last_location': build_location_payload(user),
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'profile_complete': completion['profile_complete'],
        'profile_progress': completion['profile_progress'],
        'missing_fields': completion['missing_fields'],
        'filled_fields_count': required_count - len(completion['missing_fields']),
        'total_required_fields': required_count
    }


def build_agent_user_detail_payload(user: CustomUser) -> dict:
    completion = calculate_profile_completion(user)
    missing_set = set(completion['missing_fields'])
    field_keys = list(PROFILE_REQUIRED_FIELDS)
    is_married = str(user.marital_status or '').strip().lower() == 'married'
    if is_married:
        field_keys.append('spouse_occupation')

    field_statuses = []
    for key in field_keys:
        raw_value = getattr(user, key, None)
        field_statuses.append({
            'key': key,
            'label': PROFILE_FIELD_LABELS.get(key, key.replace('_', ' ').title()),
            'value': _format_profile_value(raw_value),
            'status': 'not_filled_yet' if key in missing_set else 'filled'
        })

    if not is_married:
        field_statuses.append({
            'key': 'spouse_occupation',
            'label': PROFILE_FIELD_LABELS['spouse_occupation'],
            'value': 'Not required',
            'status': 'not_required'
        })

    for key in ['agreement_signature', 'agreement_consent_video']:
        raw_value = getattr(user, key, None)
        field_statuses.append({
            'key': key,
            'label': PROFILE_FIELD_LABELS.get(key, key.replace('_', ' ').title()),
            'value': _format_profile_value(raw_value),
            'status': 'filled' if _has_value(raw_value) else 'not_filled_yet'
        })

    payload = build_agent_user_summary_payload(user)
    payload.update({
        'field_statuses': field_statuses
    })
    return payload


def build_location_payload(user: CustomUser) -> dict:
    latitude = getattr(user, 'last_location_latitude', None)
    longitude = getattr(user, 'last_location_longitude', None)
    accuracy = getattr(user, 'last_location_accuracy_m', None)
    captured_at = getattr(user, 'last_location_captured_at', None)

    lat_value = float(latitude) if latitude is not None else None
    lng_value = float(longitude) if longitude is not None else None
    maps_url = ''
    if lat_value is not None and lng_value is not None:
        maps_url = f'https://maps.google.com/?q={lat_value},{lng_value}'

    return {
        'latitude': lat_value,
        'longitude': lng_value,
        'accuracy_m': float(accuracy) if accuracy is not None else None,
        'captured_at': captured_at.isoformat() if captured_at else None,
        'maps_url': maps_url
    }


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        return self.Meta.model.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    email = serializers.EmailField()
    mobile_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    marital_status = serializers.CharField(max_length=255, required=False, allow_blank=True)
    spouse_occupation = serializers.CharField(max_length=255, required=False, allow_blank=True)
    what_you_do = serializers.CharField(max_length=255, required=False, allow_blank=True)
    monthly_salary = serializers.CharField(max_length=25, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=4)

    def validate_email(self, value):
        email = value.strip().lower()
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email

    def create(self, validated_data):
        password = validated_data.pop('password')
        return CustomUser.objects.create_user(password=password, **validated_data)


class AgentAccessSerializer(serializers.Serializer):
    passcode = serializers.CharField(write_only=True)


class AgentUserManageSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['disable', 'enable'])


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'mobile_number',
            'marital_status',
            'spouse_occupation',
            'pincode',
            'city',
            'full_address',
            'employment_type',
            'what_you_do',
            'monthly_salary',
            'requested_amount',
            'aadhar_number',
            'pan_number',
            'aadhar_image',
            'pancard_image',
            'live_photo'
        ]

    def validate(self, attrs):
        instance = self.instance
        merged = {}
        for field_name in self.Meta.fields:
            merged[field_name] = attrs.get(field_name, getattr(instance, field_name, None) if instance else None)

        errors = {}

        marital_status = str(merged.get('marital_status') or '').strip().lower()
        if marital_status and marital_status not in ['married', 'unmarried']:
            errors['marital_status'] = 'Marital status must be married or unmarried.'

        aadhar_number = str(merged.get('aadhar_number') or '').strip()
        if aadhar_number and not AADHAR_PATTERN.match(aadhar_number):
            errors['aadhar_number'] = 'Aadhar number must be exactly 12 digits.'

        pan_number = str(merged.get('pan_number') or '').strip().upper()
        if pan_number and not PAN_PATTERN.match(pan_number):
            errors['pan_number'] = 'PAN number must be in valid format (e.g. ABCDE1234F).'

        for numeric_field in ['monthly_salary', 'requested_amount']:
            value = merged.get(numeric_field)
            if _has_value(value) and _to_positive_number(value) is None:
                errors[numeric_field] = 'Must be a positive number.'

        spouse_occupation = str(merged.get('spouse_occupation') or '').strip()
        if marital_status == 'married' and not spouse_occupation:
            errors['spouse_occupation'] = 'Spouse occupation is required when marital status is married.'

        required_fields = list(PROFILE_REQUIRED_FIELDS)
        if marital_status == 'married':
            required_fields.append('spouse_occupation')

        for field_name in required_fields:
            value = merged.get(field_name)
            if not _has_value(value):
                errors[field_name] = 'This field is required.'

        self._validate_proof_file(attrs.get('aadhar_image'), 'aadhar_image', errors)
        self._validate_proof_file(attrs.get('pancard_image'), 'pancard_image', errors)
        self._validate_live_photo(attrs.get('live_photo'), errors)

        if errors:
            raise serializers.ValidationError(errors)

        attrs['marital_status'] = marital_status
        attrs['pan_number'] = pan_number
        attrs['aadhar_number'] = aadhar_number
        return attrs

    def _validate_proof_file(self, uploaded_file, field_name: str, errors: dict):
        if uploaded_file is None:
            return

        content_type = str(getattr(uploaded_file, 'content_type', '') or '').lower()
        if content_type and not (content_type.startswith('image/') or content_type.startswith('video/')):
            errors[field_name] = 'Only image or video files are allowed.'

    def _validate_live_photo(self, uploaded_file, errors: dict):
        if uploaded_file is None:
            return

        content_type = str(getattr(uploaded_file, 'content_type', '') or '').lower()
        if content_type and not content_type.startswith('image/'):
            errors['live_photo'] = 'Live photo must be an image file.'


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}


class UserLocationCaptureSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)
    accuracy_m = serializers.FloatField(required=False, min_value=0, max_value=100000)


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    senderName = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at')
    type = serializers.CharField(source='message_type')
    mediaUrl = serializers.SerializerMethodField()
    mediaName = serializers.CharField(source='media_name')
    read = serializers.SerializerMethodField()
    canDelete = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id',
            'sender',
            'senderName',
            'content',
            'timestamp',
            'type',
            'mediaUrl',
            'mediaName',
            'read',
            'canDelete'
        ]

    def get_sender(self, obj: ChatMessage):
        return obj.sender_role

    def get_senderName(self, obj: ChatMessage):
        actor_role = self.context.get('actor_role')
        if actor_role == 'user' and obj.sender_role == ChatMessage.SENDER_AGENT:
            return 'Support Executive'
        if obj.sender_role == ChatMessage.SENDER_AGENT:
            return str(obj.sender_label or '').strip() or 'Support Executive'
        if obj.sender_role == ChatMessage.SENDER_SYSTEM:
            return 'System'
        return 'User'

    def get_content(self, obj: ChatMessage):
        return obj.content or ''

    def get_mediaUrl(self, obj: ChatMessage):
        if not obj.media_file:
            return ''
        try:
            return obj.media_file.url
        except Exception:
            return ''

    def get_read(self, obj: ChatMessage):
        actor_role = self.context.get('actor_role')
        if actor_role == 'agent':
            return bool(obj.read_by_agent)
        return bool(obj.read_by_user)

    def get_canDelete(self, obj: ChatMessage):
        actor_role = self.context.get('actor_role')
        return bool(actor_role == 'agent' and obj.sender_role != ChatMessage.SENDER_SYSTEM)


class ChatMessageCreateSerializer(serializers.Serializer):
    user_id = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField(required=False, allow_blank=True)
    media_file = serializers.FileField(required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context.get('request')
        is_agent = bool(request and request.user and request.user.is_authenticated and request.user.is_admin)

        content = str(attrs.get('content') or '').strip()
        media_file = attrs.get('media_file')
        user_id = str(attrs.get('user_id') or '').strip()

        if is_agent and not user_id:
            raise serializers.ValidationError({'user_id': 'User id is required for agent message.'})

        if not is_agent and not request.user:
            raise serializers.ValidationError({'error': 'Invalid user session.'})

        if not content and not media_file:
            raise serializers.ValidationError({'content': 'Message text or media file is required.'})

        attrs['content'] = content
        attrs['user_id'] = user_id
        return attrs


class ChatMessageDeleteSerializer(serializers.Serializer):
    message_id = serializers.IntegerField(required=False)


class ChatAliasSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    alias = serializers.CharField(max_length=120)

    def validate_alias(self, value: str):
        alias = str(value or '').strip()
        if not alias:
            raise serializers.ValidationError('Alias is required.')
        return alias


class ChatThreadFavoriteSerializer(serializers.Serializer):
    favorite = serializers.BooleanField(required=True)


class AnnouncementSerializer(serializers.ModelSerializer):
    target_user_id = serializers.SerializerMethodField()
    target_user_name = serializers.SerializerMethodField()
    target_user_mobile = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id',
            'type',
            'target_user_id',
            'target_user_name',
            'target_user_mobile',
            'title',
            'description',
            'cta_text',
            'priority_label',
            'is_active',
            'created_at',
            'updated_at'
        ]

    def get_target_user_id(self, obj: Announcement):
        return str(obj.target_user_id) if obj.target_user_id else ''

    def get_target_user_name(self, obj: Announcement):
        target = getattr(obj, 'target_user', None)
        if target is None:
            return ''
        first = str(getattr(target, 'first_name', '') or '').strip()
        last = str(getattr(target, 'last_name', '') or '').strip()
        full = f'{first} {last}'.strip()
        return full or str(getattr(target, 'email', '') or '').strip() or 'User'

    def get_target_user_mobile(self, obj: Announcement):
        target = getattr(obj, 'target_user', None)
        if target is None:
            return ''
        return str(getattr(target, 'mobile_number', '') or '').strip()


class AnnouncementCreateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=[Announcement.TYPE_GLOBAL, Announcement.TYPE_PRIVATE])
    target_user_id = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(max_length=180)
    description = serializers.CharField(max_length=3000)
    cta_text = serializers.CharField(max_length=80)
    priority_label = serializers.CharField(max_length=32, required=False, allow_blank=True)

    def validate_title(self, value: str):
        text = str(value or '').strip()
        if not text:
            raise serializers.ValidationError('Title is required.')
        return text

    def validate_description(self, value: str):
        text = str(value or '').strip()
        if not text:
            raise serializers.ValidationError('Description is required.')
        return text

    def validate_cta_text(self, value: str):
        text = str(value or '').strip()
        if not text:
            raise serializers.ValidationError('CTA text is required.')
        return text

    def validate_priority_label(self, value: str):
        text = str(value or '').strip().upper()
        return text or 'IMPORTANT'

    def validate(self, attrs):
        ann_type = str(attrs.get('type') or '').strip().upper()
        target_user_id = str(attrs.get('target_user_id') or '').strip()

        if ann_type == Announcement.TYPE_PRIVATE and not target_user_id:
            raise serializers.ValidationError({'target_user_id': 'Target user is required for private announcements.'})

        if ann_type == Announcement.TYPE_GLOBAL:
            attrs['target_user_id'] = ''

        attrs['type'] = ann_type
        return attrs


class AnnouncementUpdateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=[Announcement.TYPE_GLOBAL, Announcement.TYPE_PRIVATE], required=False)
    target_user_id = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(max_length=180, required=False)
    description = serializers.CharField(max_length=3000, required=False)
    cta_text = serializers.CharField(max_length=80, required=False)
    priority_label = serializers.CharField(max_length=32, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one field is required.')
        return attrs

    def validate_title(self, value: str):
        text = str(value or '').strip()
        if not text:
            raise serializers.ValidationError('Title is required.')
        return text

    def validate_description(self, value: str):
        text = str(value or '').strip()
        if not text:
            raise serializers.ValidationError('Description is required.')
        return text

    def validate_cta_text(self, value: str):
        text = str(value or '').strip()
        if not text:
            raise serializers.ValidationError('CTA text is required.')
        return text

    def validate_priority_label(self, value: str):
        text = str(value or '').strip().upper()
        return text or 'IMPORTANT'

class GlobalPaymentConfigCreateSerializer(serializers.Serializer):
    qr_image = serializers.FileField(required=False, allow_null=True)
    account_holder_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    bank_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    account_number = serializers.CharField(max_length=80, required=False, allow_blank=True)
    ifsc = serializers.CharField(max_length=20, required=False, allow_blank=True)
    branch = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_qr_image(self, value):
        content_type = str(getattr(value, 'content_type', '') or '').lower()
        if content_type and not content_type.startswith('image/'):
            raise serializers.ValidationError('QR file must be an image.')
        return value

    def validate_ifsc(self, value: str):
        return str(value or '').strip().upper()

    def validate(self, attrs):
        attrs['account_holder_name'] = str(attrs.get('account_holder_name') or '').strip()
        attrs['bank_name'] = str(attrs.get('bank_name') or '').strip()
        attrs['account_number'] = str(attrs.get('account_number') or '').strip()
        attrs['ifsc'] = str(attrs.get('ifsc') or '').strip().upper()
        attrs['branch'] = str(attrs.get('branch') or '').strip()

        has_qr = attrs.get('qr_image') is not None
        bank_fields = ['account_holder_name', 'bank_name', 'account_number', 'ifsc']
        filled_bank_fields = [key for key in bank_fields if attrs.get(key)]
        has_bank = len(filled_bank_fields) > 0

        if not has_qr and not has_bank:
            raise serializers.ValidationError('Upload QR or provide bank details.')

        if has_bank and len(filled_bank_fields) < len(bank_fields):
            raise serializers.ValidationError({
                'bank': 'To use bank details, account holder, bank name, account number and IFSC are required.'
            })

        attrs['has_qr'] = has_qr
        attrs['has_bank'] = has_bank
        return attrs


class GlobalPaymentConfigSerializer(serializers.ModelSerializer):
    qr_image_url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    valid_for_minutes = serializers.SerializerMethodField()
    has_qr = serializers.SerializerMethodField()
    has_bank = serializers.SerializerMethodField()

    class Meta:
        model = GlobalPaymentConfig
        fields = [
            'id',
            'qr_image_url',
            'account_holder_name',
            'bank_name',
            'account_number',
            'ifsc',
            'branch',
            'created_at',
            'expires_at',
            'is_active',
            'status',
            'valid_for_minutes',
            'has_qr',
            'has_bank'
        ]

    def get_qr_image_url(self, obj: GlobalPaymentConfig):
        try:
            return obj.qr_image.url if obj.qr_image else ''
        except Exception:
            return ''

    def get_status(self, obj: GlobalPaymentConfig):
        now = self.context.get('now')
        if now is None:
            from django.utils import timezone
            now = timezone.now()
        if not obj.is_active:
            return 'inactive'
        if obj.expires_at <= now:
            return 'expired'
        return 'active'

    def get_valid_for_minutes(self, _obj: GlobalPaymentConfig):
        return 5

    def get_has_qr(self, obj: GlobalPaymentConfig):
        return bool(obj.qr_image)

    def get_has_bank(self, obj: GlobalPaymentConfig):
        return bool(
            str(obj.account_holder_name or '').strip() and
            str(obj.bank_name or '').strip() and
            str(obj.account_number or '').strip() and
            str(obj.ifsc or '').strip()
        )


class PaymentConfigTemplateSerializer(serializers.ModelSerializer):
    qr_image_url = serializers.SerializerMethodField()
    has_qr = serializers.SerializerMethodField()
    has_bank = serializers.SerializerMethodField()

    class Meta:
        model = PaymentConfigTemplate
        fields = [
            'id',
            'qr_image_url',
            'account_holder_name',
            'bank_name',
            'account_number',
            'ifsc',
            'branch',
            'created_at',
            'has_qr',
            'has_bank'
        ]

    def get_qr_image_url(self, obj: PaymentConfigTemplate):
        try:
            return obj.qr_image.url if obj.qr_image else ''
        except Exception:
            return ''

    def get_has_qr(self, obj: PaymentConfigTemplate):
        return bool(obj.qr_image)

    def get_has_bank(self, obj: PaymentConfigTemplate):
        return bool(
            str(obj.account_holder_name or '').strip() and
            str(obj.bank_name or '').strip() and
            str(obj.account_number or '').strip() and
            str(obj.ifsc or '').strip()
        )


class PaymentTransactionCreateSerializer(serializers.Serializer):
    transaction_id = serializers.CharField(max_length=120)
    proof_image = serializers.FileField(required=True)
    amount_inr = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=Decimal('0'))
    payment_set_id = serializers.CharField(max_length=80, required=False, allow_blank=True)
    payment_scope = serializers.ChoiceField(choices=['global', 'user'], required=False, allow_blank=True)

    def validate_transaction_id(self, value: str):
        txid = str(value or '').strip()
        if not txid:
            raise serializers.ValidationError('Transaction ID is required.')
        return txid

    def validate_proof_image(self, value):
        content_type = str(getattr(value, 'content_type', '') or '').lower()
        if content_type and not content_type.startswith('image/'):
            raise serializers.ValidationError('Payment proof must be an image file.')
        return value


class PaymentTransactionStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[PaymentTransaction.STATUS_VERIFIED, PaymentTransaction.STATUS_REJECTED])


class PaymentTransactionSerializer(serializers.ModelSerializer):
    proof_image_url = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    user_number = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'user',
            'user_name',
            'user_number',
            'transaction_id',
            'proof_image_url',
            'amount_inr',
            'status',
            'payment_set_id',
            'payment_scope',
            'created_at',
            'updated_at',
            'reviewed_at'
        ]

    def get_proof_image_url(self, obj: PaymentTransaction):
        try:
            return obj.proof_image.url if obj.proof_image else ''
        except Exception:
            return ''

    def get_user_name(self, obj: PaymentTransaction):
        first = str(getattr(obj.user, 'first_name', '') or '').strip()
        last = str(getattr(obj.user, 'last_name', '') or '').strip()
        full = f'{first} {last}'.strip()
        return full or str(getattr(obj.user, 'email', '') or '').strip() or 'User'

    def get_user_number(self, obj: PaymentTransaction):
        return str(getattr(obj.user, 'mobile_number', '') or '').strip() or 'Not filled yet'


class AgreementQuestionInputSerializer(serializers.Serializer):
    questionId = serializers.IntegerField(min_value=1, max_value=20)
    description = serializers.CharField()

    def validate_description(self, value: str):
        text = str(value or '').strip()
        if not text:
            raise serializers.ValidationError('Description is required.')
        return text


class AgreementQuestionSerializer(serializers.ModelSerializer):
    questionId = serializers.IntegerField(source='question_id')
    answerType = serializers.SerializerMethodField()

    class Meta:
        model = AgreementQuestion
        fields = ['questionId', 'description', 'is_active', 'answerType', 'updated_at']

    def get_answerType(self, _obj: AgreementQuestion):
        return 'yes_no'


class AgreementUserQuestionSerializer(serializers.Serializer):
    questionId = serializers.IntegerField()
    description = serializers.CharField()
    answerType = serializers.CharField()
    answer = serializers.ChoiceField(choices=['yes', 'no'], allow_null=True)
    readonly = serializers.BooleanField()


class AgreementAnswerInputSerializer(serializers.Serializer):
    questionId = serializers.IntegerField(min_value=1, max_value=20)
    answer = serializers.ChoiceField(choices=['yes', 'no'])


class AgreementSubmitAnswersSerializer(serializers.Serializer):
    answers = AgreementAnswerInputSerializer(many=True)

    def validate_answers(self, value):
        if not value:
            raise serializers.ValidationError('At least one answer is required.')
        if len(value) > 20:
            raise serializers.ValidationError('Maximum 20 answers are allowed.')
        ids = [item['questionId'] for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('Duplicate question ids are not allowed.')
        return value


class AgreementResetUserSerializer(serializers.Serializer):
    user_id = serializers.CharField()


class AgreementVisibilityUpdateSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    agreement_tab_enabled = serializers.BooleanField(required=True)


class AgreementCompleteSerializer(serializers.Serializer):
    answers_json = serializers.CharField(required=False, allow_blank=True)
    signature_image = serializers.FileField(required=False, allow_null=True)
    consent_video = serializers.FileField(required=False, allow_null=True)

    def validate_signature_image(self, value):
        content_type = str(getattr(value, 'content_type', '') or '').lower()
        if content_type and not content_type.startswith('image/'):
            raise serializers.ValidationError('Digital signature must be an image.')
        return value

    def validate_consent_video(self, value):
        content_type = str(getattr(value, 'content_type', '') or '').lower()
        if content_type and not content_type.startswith('video/'):
            raise serializers.ValidationError('Agreement consent must be a video file.')
        return value


class CommunityPersonaSerializer(serializers.ModelSerializer):
    ghost_member_id = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPersona
        fields = [
            'id',
            'ghost_member_id',
            'ghost_id',
            'display_name',
            'identity_tag',
            'info',
            'avatar_url',
            'short_bio',
            'tone_guidelines',
            'is_active',
            'sort_order',
            'created_at',
            'updated_at'
        ]

    def get_ghost_member_id(self, obj: CommunityPersona):
        return obj.id

    def to_representation(self, instance):
        data = super().to_representation(instance)
        actor_role = str(self.context.get('actor_role') or '')
        if actor_role != 'agent':
            data.pop('ghost_id', None)
        return data


class CommunitySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunitySettings
        fields = [
            'community_title',
            'active_members_display',
            'updated_at'
        ]

    def validate_community_title(self, value: str):
        text = str(value or '').strip()
        return text or 'community chat.'

    def validate_active_members_display(self, value: int):
        number = int(value or 0)
        if number <= 0:
            raise serializers.ValidationError('Active members must be greater than 0.')
        if number > 500000:
            raise serializers.ValidationError('Active members value is too large.')
        return number


class CommunityPersonaUpsertSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=80)
    ghost_id = serializers.CharField(max_length=40, required=False, allow_blank=False)
    identity_tag = serializers.CharField(max_length=80, required=False, allow_blank=True)
    info = serializers.CharField(max_length=220, required=False, allow_blank=True)
    avatar_url = serializers.CharField(max_length=400, required=False, allow_blank=True)
    short_bio = serializers.CharField(max_length=180, required=False, allow_blank=True)
    tone_guidelines = serializers.CharField(max_length=255, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    sort_order = serializers.IntegerField(required=False, min_value=0, max_value=9999)

    def validate_display_name(self, value: str):
        name = str(value or '').strip()
        if not name:
            raise serializers.ValidationError('Display name is required.')
        return name

    def validate_ghost_id(self, value: str):
        ghost_id = str(value or '').strip()
        if not ghost_id:
            raise serializers.ValidationError('Ghost ID is required.')
        if not GHOST_ID_PATTERN.match(ghost_id):
            raise serializers.ValidationError('Ghost ID must match [A-Za-z0-9_-]{3,40}.')
        return ghost_id

    def validate_identity_tag(self, value: str):
        tag = str(value or '').strip()
        if not tag:
            raise serializers.ValidationError('Identity tag is required.')
        return tag

    def validate_info(self, value: str):
        return str(value or '').strip()[:220]

    def validate_avatar_url(self, value: str):
        return str(value or '').strip()

    def validate_short_bio(self, value: str):
        return str(value or '').strip()

    def validate_tone_guidelines(self, value: str):
        return str(value or '').strip()


class CommunityPostCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True)
    parent_id = serializers.IntegerField(required=False, min_value=1)
    ghost_member_id = serializers.IntegerField(required=False, min_value=1)
    persona_id = serializers.IntegerField(required=False, min_value=1)
    media_file = serializers.FileField(required=False, allow_null=True)

    def validate_content(self, value: str):
        return str(value or '').strip()

    def validate(self, attrs):
        content = str(attrs.get('content') or '').strip()
        media_file = attrs.get('media_file')
        if not content and media_file is None:
            raise serializers.ValidationError({'content': 'Content or media is required.'})
        persona_id = attrs.get('persona_id')
        ghost_member_id = attrs.get('ghost_member_id')
        if persona_id and ghost_member_id and int(persona_id) != int(ghost_member_id):
            raise serializers.ValidationError({'ghost_member_id': 'ghost_member_id and persona_id mismatch.'})
        if not ghost_member_id and persona_id:
            attrs['ghost_member_id'] = int(persona_id)
        attrs['content'] = content
        return attrs


class CommunityPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    author_bio = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    persona_id = serializers.SerializerMethodField()
    ghost_member_id = serializers.SerializerMethodField()
    ghost_member_identity_tag = serializers.SerializerMethodField()
    ghost_member_info = serializers.SerializerMethodField()
    parent_id = serializers.SerializerMethodField()
    mediaUrl = serializers.SerializerMethodField()
    mediaName = serializers.CharField(source='media_name')
    can_reply_privately = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            'id',
            'parent_id',
            'author_type',
            'user_id',
            'persona_id',
            'ghost_member_id',
            'ghost_member_identity_tag',
            'ghost_member_info',
            'can_reply_privately',
            'author_name',
            'author_avatar',
            'author_bio',
            'content',
            'content_masked',
            'moderation_note',
            'mediaUrl',
            'mediaName',
            'created_at'
        ]

    def get_author_name(self, obj: CommunityPost):
        if obj.author_type == CommunityPost.AUTHOR_PERSONA and obj.persona:
            return str(obj.persona.display_name or '').strip() or 'Community Member'

        first = str(getattr(obj.user, 'first_name', '') or '').strip()
        last = str(getattr(obj.user, 'last_name', '') or '').strip()
        full = f'{first} {last}'.strip()
        if full:
            return full
        return str(getattr(obj.user, 'email', '') or '').strip() or 'User'

    def get_author_avatar(self, obj: CommunityPost):
        if obj.author_type == CommunityPost.AUTHOR_PERSONA and obj.persona:
            return str(obj.persona.avatar_url or '').strip()
        return ''

    def get_author_bio(self, obj: CommunityPost):
        if obj.author_type == CommunityPost.AUTHOR_PERSONA and obj.persona:
            return str(obj.persona.short_bio or '').strip()
        return ''

    def get_user_id(self, obj: CommunityPost):
        return str(obj.user_id) if obj.user_id else None

    def get_persona_id(self, obj: CommunityPost):
        return obj.persona_id if obj.persona_id else None

    def get_ghost_member_id(self, obj: CommunityPost):
        return obj.persona_id if obj.persona_id else None

    def get_ghost_member_identity_tag(self, obj: CommunityPost):
        if obj.persona_id and obj.persona:
            return str(obj.persona.identity_tag or '').strip()
        return ''

    def get_ghost_member_info(self, obj: CommunityPost):
        if obj.persona_id and obj.persona:
            return str(obj.persona.info or '').strip()
        return ''

    def get_parent_id(self, obj: CommunityPost):
        return obj.parent_id if obj.parent_id else None

    def get_mediaUrl(self, obj: CommunityPost):
        if not obj.media_file:
            return ''
        try:
            return obj.media_file.url
        except Exception:
            return ''

    def get_can_reply_privately(self, obj: CommunityPost):
        return bool(obj.author_type == CommunityPost.AUTHOR_PERSONA and obj.persona_id)


class GhostThreadCreateSerializer(serializers.Serializer):
    persona_id = serializers.IntegerField(min_value=1)


class GhostThreadFromCommunitySerializer(serializers.Serializer):
    community_post_id = serializers.IntegerField(min_value=1)


class GhostThreadManageSerializer(serializers.Serializer):
    is_favorite = serializers.BooleanField(required=False)
    is_persona_locked = serializers.BooleanField(required=False)
    persona_id = serializers.IntegerField(required=False, min_value=1)
    admin_override = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one field is required.')
        return attrs


class GhostMessageCreateSerializer(serializers.Serializer):
    thread_id = serializers.IntegerField(min_value=1)
    content = serializers.CharField(required=False, allow_blank=True)
    media_file = serializers.FileField(required=False, allow_null=True)

    def validate(self, attrs):
        content = str(attrs.get('content') or '').strip()
        media_file = attrs.get('media_file')
        if not content and media_file is None:
            raise serializers.ValidationError({'content': 'Message text or media file is required.'})
        attrs['content'] = content
        return attrs


class GhostMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    senderName = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at')
    type = serializers.CharField(source='message_type')
    mediaUrl = serializers.SerializerMethodField()
    mediaName = serializers.CharField(source='media_name')
    read = serializers.SerializerMethodField()
    canDelete = serializers.SerializerMethodField()

    class Meta:
        model = GhostChatMessage
        fields = [
            'id',
            'sender',
            'senderName',
            'content',
            'timestamp',
            'type',
            'mediaUrl',
            'mediaName',
            'read',
            'canDelete',
            'content_masked',
            'moderation_note'
        ]

    def get_sender(self, obj: GhostChatMessage):
        return obj.sender_role

    def get_senderName(self, obj: GhostChatMessage):
        actor_role = str(self.context.get('actor_role') or '')
        if obj.sender_role == GhostChatMessage.SENDER_AGENT:
            return str(obj.sender_label or '').strip() or 'Community Member'
        if obj.sender_role == GhostChatMessage.SENDER_SYSTEM:
            return 'System'
        if actor_role == 'agent':
            user = getattr(getattr(obj, 'thread', None), 'user', None)
            if user is not None:
                first = str(getattr(user, 'first_name', '') or '').strip()
                last = str(getattr(user, 'last_name', '') or '').strip()
                full = f'{first} {last}'.strip()
                if full:
                    return full
                email = str(getattr(user, 'email', '') or '').strip()
                if email:
                    return email
            return 'User'
        return 'You'

    def get_mediaUrl(self, obj: GhostChatMessage):
        if not obj.media_file:
            return ''
        try:
            return obj.media_file.url
        except Exception:
            return ''

    def get_read(self, obj: GhostChatMessage):
        actor_role = str(self.context.get('actor_role') or '')
        if actor_role == 'agent':
            return bool(obj.read_by_agent)
        return bool(obj.read_by_user)

    def get_canDelete(self, obj: GhostChatMessage):
        actor_role = str(self.context.get('actor_role') or '')
        return bool(actor_role == 'agent' and obj.sender_role != GhostChatMessage.SENDER_SYSTEM)


class ModerationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModerationEvent
        fields = [
            'id',
            'user',
            'context',
            'action',
            'reason',
            'channel_ref',
            'original_excerpt',
            'sanitized_excerpt',
            'created_at'
        ]
