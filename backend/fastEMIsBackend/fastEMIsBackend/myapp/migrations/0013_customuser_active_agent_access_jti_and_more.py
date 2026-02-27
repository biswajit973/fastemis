from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0012_customuser_last_location_accuracy_m_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='active_agent_access_jti',
            field=models.CharField(blank=True, db_index=True, max_length=80, null=True),
        ),
        migrations.AddField(
            model_name='customuser',
            name='active_agent_refresh_jti',
            field=models.CharField(blank=True, db_index=True, max_length=80, null=True),
        ),
    ]
