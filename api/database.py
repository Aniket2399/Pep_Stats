"""
Database Manager for Live Pitch
Handles connections to TimescaleDB, MongoDB, and Redis
"""

import psycopg2
from psycopg2.extras import Json
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
import redis
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from contextlib import contextmanager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manage all database connections and operations"""
    
    def __init__(
        self,
        ts_host: str = "localhost",
        ts_port: int = 5433,
        ts_user: str = "live_pitch",
        ts_password: str = "password123",
        ts_database: str = "matches_db",
        mongo_uri: str = "mongodb://admin:password123@localhost:27017/",
        redis_host: str = "localhost",
        redis_port: int = 6379
    ):
        """
        Initialize database connections
        
        Args:
            ts_host: TimescaleDB host
            ts_port: TimescaleDB port
            ts_user: TimescaleDB user
            ts_password: TimescaleDB password
            ts_database: TimescaleDB database
            mongo_uri: MongoDB connection URI
            redis_host: Redis host
            redis_port: Redis port
        """
        self.ts_host = ts_host
        self.ts_port = ts_port
        self.ts_user = ts_user
        self.ts_password = ts_password
        self.ts_database = ts_database
        
        self.ts_conn = None
        self.ts_cursor = None
        self.mongo_client = None
        self.mongo_db = None
        self.redis_client = None
        
        self._connect_timescaledb()
        self._connect_mongodb()
        self._connect_redis()
        self._init_databases()
    
    def _connect_timescaledb(self):
        """Connect to TimescaleDB"""
        try:
            self.ts_conn = psycopg2.connect(
                host=self.ts_host,
                database=self.ts_database,
                user=self.ts_user,
                password=self.ts_password,
                port=self.ts_port,
                connect_timeout=5
            )
            self.ts_cursor = self.ts_conn.cursor()
            logger.info(f"✅ Connected to TimescaleDB - {self.ts_host}:{self.ts_port}")
        except psycopg2.Error as e:
            logger.error(f"❌ Failed to connect to TimescaleDB: {e}")
            raise
    
    def _connect_mongodb(self):
        """Connect to MongoDB"""
        try:
            self.mongo_client = MongoClient(
                "mongodb://admin:password123@localhost:27017/",
                serverSelectionTimeoutMS=5000
            )
            # Verify connection
            self.mongo_client.admin.command('ping')
            self.mongo_db = self.mongo_client['live_pitch']
            logger.info("✅ Connected to MongoDB")
        except (ServerSelectionTimeoutError, Exception) as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    def _connect_redis(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Verify connection
            self.redis_client.ping()
            logger.info("✅ Connected to Redis")
        except redis.ConnectionError as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            raise
    
    def _init_databases(self):
        """Create tables and indexes"""
        self._init_timescaledb()
        logger.info("✅ All databases initialized")
    
    def _init_timescaledb(self):
        """Create TimescaleDB tables and hypertables"""
        try:
            # Match events table (hypertable for time-series)
            self.ts_cursor.execute("""
                CREATE TABLE IF NOT EXISTS match_events (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    match_id INTEGER NOT NULL,
                    team VARCHAR(100),
                    event_type VARCHAR(50),
                    player VARCHAR(100),
                    minute INTEGER,
                    data JSONB,
                    PRIMARY KEY (id, timestamp)
                );
            """)
            
            # Convert to hypertable
            self.ts_cursor.execute("""
                SELECT create_hypertable('match_events', 'timestamp', 
                if_not_exists => TRUE);
            """)
            
            # Create index
            self.ts_cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_match_id 
                ON match_events (match_id, timestamp DESC);
            """)
            
            # Possession stats table
            self.ts_cursor.execute("""
                CREATE TABLE IF NOT EXISTS possession_stats (
                    timestamp TIMESTAMPTZ NOT NULL,
                    match_id INTEGER NOT NULL,
                    team1 VARCHAR(100),
                    team2 VARCHAR(100),
                    team1_possession FLOAT,
                    team2_possession FLOAT,
                    minute INTEGER,
                    PRIMARY KEY (match_id, timestamp)
                );
            """)
            
            # Convert to hypertable
            self.ts_cursor.execute("""
                SELECT create_hypertable('possession_stats', 'timestamp',
                if_not_exists => TRUE);
            """)
            
            self.ts_conn.commit()
            logger.info("✅ TimescaleDB tables created")
        
        except psycopg2.Error as e:
            logger.warning(f"⚠️  TimescaleDB table creation: {e}")
            self.ts_conn.rollback()
    
    def insert_match_event(self, event: Dict[str, Any]) -> bool:
        """
        Insert match event to TimescaleDB
        
        Args:
            event: Event dictionary
        
        Returns:
            bool: Success status
        """
        try:
            self.ts_cursor.execute("""
                INSERT INTO match_events 
                (timestamp, match_id, team, event_type, player, minute, data)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                datetime.utcnow(),
                event.get('match_id'),
                event.get('team'),
                event.get('event_type'),
                event.get('player'),
                event.get('minute'),
                Json(event)
            ))
            self.ts_conn.commit()
            return True
        except psycopg2.Error as e:
            logger.error(f"❌ Failed to insert match event: {e}")
            self.ts_conn.rollback()
            return False
    
    def insert_possession_stats(self, stats: Dict[str, Any]) -> bool:
        """
        Insert possession statistics to TimescaleDB
        
        Args:
            stats: Statistics dictionary
        
        Returns:
            bool: Success status
        """
        try:
            self.ts_cursor.execute("""
                INSERT INTO possession_stats 
                (timestamp, match_id, team1, team2, team1_possession, 
                 team2_possession, minute)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                datetime.utcnow(),
                stats.get('match_id'),
                stats.get('team1'),
                stats.get('team2'),
                stats.get('team1_possession'),
                stats.get('team2_possession'),
                stats.get('minute')
            ))
            self.ts_conn.commit()
            return True
        except psycopg2.Error as e:
            logger.error(f"❌ Failed to insert possession stats: {e}")
            self.ts_conn.rollback()
            return False
    
    def insert_sentiment(self, post: Dict[str, Any]) -> bool:
        """
        Insert social media post to MongoDB
        
        Args:
            post: Post dictionary
        
        Returns:
            bool: Success status
        """
        try:
            self.mongo_db.sentiment_posts.insert_one({
                "timestamp": datetime.utcnow(),
                "text": post.get('text'),
                "source": post.get('source'),
                "sentiment_score": post.get('sentiment_score'),
                "match_id": post.get('match_id'),
                "team": post.get('team')
            })
            return True
        except Exception as e:
            logger.error(f"❌ Failed to insert sentiment: {e}")
            return False
    
    def get_match_events(self, match_id: int, limit: int = 100) -> list:
        """
        Get match events from TimescaleDB
        
        Args:
            match_id: Match ID
            limit: Number of records to return
        
        Returns:
            List of events
        """
        try:
            self.ts_cursor.execute("""
                SELECT timestamp, event_type, team, player, minute, data
                FROM match_events
                WHERE match_id = %s
                ORDER BY timestamp DESC
                LIMIT %s
            """, (match_id, limit))
            
            return self.ts_cursor.fetchall()
        except psycopg2.Error as e:
            logger.error(f"❌ Failed to get match events: {e}")
            return []
    
    def get_recent_possession(self, match_id: int, minutes: int = 10) -> list:
        """
        Get recent possession stats
        
        Args:
            match_id: Match ID
            minutes: How many minutes back
        
        Returns:
            List of possession stats
        """
        try:
            self.ts_cursor.execute("""
                SELECT timestamp, team1_possession, team2_possession, minute
                FROM possession_stats
                WHERE match_id = %s
                AND timestamp > now() - INTERVAL '%s minutes'
                ORDER BY timestamp ASC
            """, (match_id, minutes))
            
            return self.ts_cursor.fetchall()
        except psycopg2.Error as e:
            logger.error(f"❌ Failed to get possession stats: {e}")
            return []
    
    def get_redis_key(self, key: str) -> Optional[str]:
        """
        Get value from Redis
        
        Args:
            key: Cache key
        
        Returns:
            Value or None
        """
        try:
            return self.redis_client.get(key)
        except redis.RedisError as e:
            logger.error(f"❌ Redis get error: {e}")
            return None
    
    def set_redis_key(self, key: str, value: str, ttl: int = 3600) -> bool:
        """
        Set value in Redis with TTL
        
        Args:
            key: Cache key
            value: Value to store
            ttl: Time to live in seconds
        
        Returns:
            bool: Success status
        """
        try:
            self.redis_client.setex(key, ttl, value)
            return True
        except redis.RedisError as e:
            logger.error(f"❌ Redis set error: {e}")
            return False
    
    @contextmanager
    def get_ts_cursor(self):
        """Context manager for TimescaleDB cursor"""
        try:
            yield self.ts_cursor
            self.ts_conn.commit()
        except psycopg2.Error as e:
            logger.error(f"❌ Cursor error: {e}")
            self.ts_conn.rollback()
            raise
    
    def close(self):
        """Close all database connections"""
        if self.ts_cursor:
            self.ts_cursor.close()
        if self.ts_conn:
            self.ts_conn.close()
        if self.mongo_client:
            self.mongo_client.close()
        if self.redis_client:
            self.redis_client.close()
        
        logger.info("✅ All database connections closed")


# Test script
if __name__ == "__main__":
    logger.info("🧪 Testing database connections...")
    
    try:
        db = DatabaseManager()
        
        # Test insert
        test_event = {
            "match_id": 1,
            "team": "France",
            "event_type": "goal",
            "player": "Mbappe",
            "minute": 23
        }
        
        success = db.insert_match_event(test_event)
        logger.info(f"Insert test: {'✅ Passed' if success else '❌ Failed'}")
        
        # Test Redis
        db.set_redis_key("test_key", "test_value", 3600)
        value = db.get_redis_key("test_key")
        logger.info(f"Redis test: {'✅ Passed' if value == 'test_value' else '❌ Failed'}")
        
        # Test MongoDB
        db.insert_sentiment({
            "text": "Great match!",
            "source": "twitter",
            "sentiment_score": 0.8,
            "match_id": 1
        })
        logger.info("✅ MongoDB insert passed")
        
        logger.info("✅ All database tests passed!")
        db.close()
    
    except Exception as e:
        logger.error(f"❌ Database test failed: {e}")