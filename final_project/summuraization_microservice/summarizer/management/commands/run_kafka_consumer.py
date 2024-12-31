from django.core.management.base import BaseCommand
from summarizer.kafka_worker import kafka_consumer_worker

class Command(BaseCommand):
    help = "Run Kafka Consumer Worker"

    def handle(self, *args, **kwargs):
        self.stdout.write("[Command] Starting Kafka Consumer Worker...")
        kafka_consumer_worker()