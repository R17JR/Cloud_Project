from confluent_kafka import Producer, Consumer, KafkaError
from transformers import pipeline
import json
from django.conf import settings

# Kafka Configuration
KAFKA_BROKER = settings.KAFKA_CONFIG['BROKER']
REQUEST_TOPIC = settings.KAFKA_CONFIG['REQUEST_TOPIC']
RESPONSE_TOPIC = settings.KAFKA_CONFIG['RESPONSE_TOPIC']

# Initialize the summarization pipeline
summarizer = pipeline('summarization', model='facebook/bart-large-cnn')

# Kafka Producer Configuration
producer_conf = {'bootstrap.servers': KAFKA_BROKER}
producer = Producer(producer_conf)

# Kafka Consumer Configuration
consumer_conf = {
    'bootstrap.servers': KAFKA_BROKER,
    'group.id': 'summary_service_worker',
    'auto.offset.reset': 'earliest',
}


def process_message(data):
    """
    Processes a single Kafka message, performs summarization,
    and sends the response back to Kafka.
    """
    print(f"[Consumer] Received data: {data}")

    # Validate the message structure
    if 'task_id' not in data or 'text' not in data or 'style' not in data:
        print(f"[Consumer Error] Invalid message format: {data}")
        return

    task_id = data['task_id']
    text = data['text']
    style = data['style']
    print(f"[Consumer] Processing job {task_id}")

    try:
        # Summarize the text
        summary = summarizer(text, max_length=50, min_length=10, do_sample=False)[0]['summary_text']

        # Apply the specified style
        styled_summary = apply_style(summary, style)

        # Create the response
        response = {'id': task_id, 'translated_text': styled_summary}

        # Produce the response to the response topic
        producer.produce(RESPONSE_TOPIC, json.dumps(response))
        producer.flush()

        print(f"[Consumer] Summarized text sent for job {task_id}")
    except Exception as e:
        print(f"[Consumer Error] Failed to process job {task_id}: {e}")


def apply_style(summary, style):
    """
    Apply a specific style to the summary.
    """
    if style == 'formal':
        return summary.replace("it's", "it is").replace("can't", "cannot")
    elif style == 'informal':
        return summary.replace("cannot", "can't").replace("do not", "don't")
    elif style == 'technical':
        return f"[TECHNICAL SUMMARY]: {summary}"
    else:
        return summary


def kafka_consumer_worker():
    """
    Kafka Consumer Worker to listen to the request topic and process messages.
    """
    consumer = Consumer(consumer_conf)
    consumer.subscribe([REQUEST_TOPIC])

    try:
        print("[Consumer] Kafka Consumer Worker Started...")
        while True:
            msg = consumer.poll(1.0)  # Poll for new messages
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"[Consumer Error] {msg.error()}")
                    break

            # Process the incoming message
            try:
                data = json.loads(msg.value().decode('utf-8'))
                process_message(data)
            except json.JSONDecodeError:
                print(f"[Consumer Error] Unable to decode message: {msg.value()}")
    finally:
        consumer.close()
        print("[Consumer] Kafka Consumer Worker Stopped.")