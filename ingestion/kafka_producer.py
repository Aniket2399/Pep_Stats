"""
Kafka Producer for Live Pitch
Sends match events, stats, and social posts to Kafka topics
"""

from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
import logging
from datetime import datetime
from typing import Dict, Any
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EventProducer:
    """Kafka producer for match events"""
    
    def __init__(self, bootstrap_servers=['localhost:9092'], max_retries=3):
        """
        Initialize Kafka Producer
        
        Args:
            bootstrap_servers: Kafka broker addresses
            max_retries: Number of retries for connection
        """
        self.bootstrap_servers = bootstrap_servers
        self.max_retries = max_retries
        self.producer = None
        self._connect()
    
    def _connect(self):
        """Establish connection to Kafka with retries"""
        retries = 0
        while retries < self.max_retries:
            try:
                self.producer = KafkaProducer(
                    bootstrap_servers=self.bootstrap_servers,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                    acks='all',  # Wait for all replicas
                    retries=3,
                    max_in_flight_requests_per_connection=1
                )
                logger.info(f"✅ Kafka Producer initialized - {self.bootstrap_servers}")
                return
            except Exception as e:
                retries += 1
                logger.warning(f"⚠️  Connection attempt {retries}/{self.max_retries} failed: {e}")
                if retries < self.max_retries:
                    time.sleep(2)
        
        logger.error("❌ Failed to connect to Kafka after retries")
        raise Exception("Could not connect to Kafka")
    
    def send_match_event(self, event: Dict[str, Any]) -> bool:
        """
        Send match event to 'match-events' topic
        
        Args:
            event: Event dictionary containing match info
        
        Returns:
            bool: True if sent successfully
        """
        try:
            event['timestamp'] = datetime.utcnow().isoformat()
            
            future = self.producer.send('match-events', value=event)
            record_metadata = future.get(timeout=10)
            
            logger.info(
                f"📤 Event sent: topic={record_metadata.topic}, "
                f"partition={record_metadata.partition}, "
                f"offset={record_metadata.offset} | "
                f"Type: {event.get('event_type')} | "
                f"Team: {event.get('team')}"
            )
            return True
        except KafkaError as e:
            logger.error(f"❌ Failed to send match event: {e}")
            return False
    
    def send_possession_stats(self, stats: Dict[str, Any]) -> bool:
        """
        Send possession stats to 'possession-stats' topic
        
        Args:
            stats: Possession statistics dictionary
        
        Returns:
            bool: True if sent successfully
        """
        try:
            stats['timestamp'] = datetime.utcnow().isoformat()
            
            future = self.producer.send('possession-stats', value=stats)
            record_metadata = future.get(timeout=10)
            
            logger.info(
                f"📊 Possession stats sent: "
                f"Team1: {stats.get('team1_possession')}% | "
                f"Team2: {stats.get('team2_possession')}%"
            )
            return True
        except KafkaError as e:
            logger.error(f"❌ Failed to send possession stats: {e}")
            return False
    
    def send_sentiment(self, post: Dict[str, Any]) -> bool:
        """
        Send social media post/sentiment to 'social-sentiment' topic
        
        Args:
            post: Social media post dictionary
        
        Returns:
            bool: True if sent successfully
        """
        try:
            post['timestamp'] = datetime.utcnow().isoformat()
            
            future = self.producer.send('social-sentiment', value=post)
            record_metadata = future.get(timeout=10)
            
            logger.info(
                f"💬 Sentiment posted: source={post.get('source')} | "
                f"Score={post.get('sentiment_score')}"
            )
            return True
        except KafkaError as e:
            logger.error(f"❌ Failed to send sentiment: {e}")
            return False
    
    def send_injury_alert(self, alert: Dict[str, Any]) -> bool:
        """
        Send injury alert to 'injury-alerts' topic
        
        Args:
            alert: Injury alert dictionary
        
        Returns:
            bool: True if sent successfully
        """
        try:
            alert['timestamp'] = datetime.utcnow().isoformat()
            
            future = self.producer.send('injury-alerts', value=alert)
            record_metadata = future.get(timeout=10)
            
            logger.warning(f"⚠️  Injury alert: {alert.get('player')} ({alert.get('team')})")
            return True
        except KafkaError as e:
            logger.error(f"❌ Failed to send injury alert: {e}")
            return False
    
    def flush(self):
        """Ensure all messages are sent"""
        if self.producer:
            self.producer.flush()
            logger.info("✅ All messages flushed")
    
    def close(self):
        """Close producer connection"""
        if self.producer:
            self.producer.close()
            logger.info("✅ Kafka Producer closed")


# Test script
if __name__ == "__main__":
    logger.info("🧪 Testing Kafka Producer...")
    
    try:
        producer = EventProducer()
        
        # Test match event
        producer.send_match_event({
            "match_id": 1,
            "team1": "France",
            "team2": "Argentina",
            "event_type": "goal",
            "player": "Mbappe",
            "team": "France",
            "minute": 23,
            "score": "1-0"
        })
        
        # Test possession stats
        producer.send_possession_stats({
            "match_id": 1,
            "team1": "France",
            "team2": "Argentina",
            "team1_possession": 58,
            "team2_possession": 42,
            "minute": 23
        })
        
        # Test sentiment
        producer.send_sentiment({
            "text": "GOOOAAL MBAPPE!!! 🔥",
            "source": "twitter",
            "sentiment_score": 0.95,
            "match_id": 1
        })
        
        producer.flush()
        producer.close()
        
        logger.info("✅ All test messages sent successfully!")
    
    except Exception as e:
        logger.error(f"❌ Error: {e}")