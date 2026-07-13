from django.apps import AppConfig


class ShotsConfig(AppConfig):
    name = 'apps.shots'

    def ready(self):
        # import apps.shots.signals
        pass

