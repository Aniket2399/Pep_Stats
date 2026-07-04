"""
Redis Caching Layer for Live Pitch
High-performance caching for real-time data
"""

import logging
import json
import redis
from typing import Any, Optional
from datetime import timedelta

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CacheManager:
    """Manage Redis caching for Live Pitch"""
    
    def __init__(self, host: str = 'localhost', port: int = 6379, db: int = 0):
        """
        Initialize Redis cache manager
        
        Args:
            host: Redis host
            port: Redis port
            db: Redis database number
        """
        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info(f"✅ Connected to Redis - {host}:{port}")
        except redis.ConnectionError as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            raise
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default: 1 hour)
        
        Returns:
            Success status
        """
        try:
            json_value = json.dumps(value) if not isinstance(value, str) else value
            self.redis_client.setex(key, ttl, json_value)
            logger.debug(f"✅ Cached: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"❌ Cache set error ({key}): {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None
        """
        try:
            value = self.redis_client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            logger.debug(f"❌ Cache miss: {key}")
            return None
        except Exception as e:
            logger.error(f"❌ Cache get error ({key}): {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            self.redis_client.delete(key)
            logger.debug(f"✅ Deleted: {key}")
            return True
        except Exception as e:
            logger.error(f"❌ Cache delete error ({key}): {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern
        
        Args:
            pattern: Key pattern (e.g., "match:*")
        
        Returns:
            Number of keys deleted
        """
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"✅ Deleted {deleted} keys matching '{pattern}'")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"❌ Cache clear error: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"❌ Cache exists error ({key}): {e}")
            return False
    
    def ttl(self, key: str) -> int:
        """Get TTL of key in seconds"""
        try:
            ttl = self.redis_client.ttl(key)
            return ttl if ttl >= 0 else 0
        except Exception as e:
            logger.error(f"❌ Cache ttl error ({key}): {e}")
            return 0
    
    def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter in cache"""
        try:
            return self.redis_client.incrby(key, amount)
        except Exception as e:
            logger.error(f"❌ Cache increment error ({key}): {e}")
            return 0
    
    def append(self, key: str, value: Any) -> bool:
        """Append to list in cache"""
        try:
            json_value = json.dumps(value) if not isinstance(value, str) else value
            self.redis_client.rpush(key, json_value)
            return True
        except Exception as e:
            logger.error(f"❌ Cache append error ({key}): {e}")
            return False
    
    def get_list(self, key: str) -> list:
        """Get all values from list in cache"""
        try:
            values = self.redis_client.lrange(key, 0, -1)
            return [json.loads(v) if v else v for v in values]
        except Exception as e:
            logger.error(f"❌ Cache get_list error ({key}): {e}")
            return []
    
    def clear_all(self) -> bool:
        """Clear entire cache (WARNING: Deletes all data)"""
        try:
            self.redis_client.flushdb()
            logger.warning("⚠️  Cache cleared (all data deleted)")
            return True
        except Exception as e:
            logger.error(f"❌ Cache clear_all error: {e}")
            return False
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        try:
            info = self.redis_client.info()
            return {
                "used_memory_mb": info.get('used_memory_human', 'N/A'),
                "connected_clients": info.get('connected_clients', 0),
                "total_commands": info.get('total_commands_processed', 0),
                "uptime_seconds": info.get('uptime_in_seconds', 0),
                "keys_count": self.redis_client.dbsize()
            }
        except Exception as e:
            logger.error(f"❌ Cache stats error: {e}")
            return {}


# Cache helpers for specific data types
class MatchCache:
    """Cache manager for match-specific data"""
    
    def __init__(self, cache: CacheManager):
        self.cache = cache
    
    def set_match_stats(self, match_id: int, stats: dict, ttl: int = 300):
        """Cache match statistics (5 min default)"""
        return self.cache.set(f"match:{match_id}:stats", stats, ttl)
    
    def get_match_stats(self, match_id: int) -> Optional[dict]:
        """Get cached match statistics"""
        return self.cache.get(f"match:{match_id}:stats")
    
    def set_predictions(self, match_id: int, predictions: dict, ttl: int = 300):
        """Cache match predictions (5 min default)"""
        return self.cache.set(f"match:{match_id}:predictions", predictions, ttl)
    
    def get_predictions(self, match_id: int) -> Optional[dict]:
        """Get cached predictions"""
        return self.cache.get(f"match:{match_id}:predictions")
    
    def set_sentiment(self, match_id: int, sentiment: dict, ttl: int = 300):
        """Cache sentiment analysis (5 min default)"""
        return self.cache.set(f"match:{match_id}:sentiment", sentiment, ttl)
    
    def get_sentiment(self, match_id: int) -> Optional[dict]:
        """Get cached sentiment"""
        return self.cache.get(f"match:{match_id}:sentiment")
    
    def clear_match_cache(self, match_id: int) -> int:
        """Clear all cache for a match"""
        return self.cache.clear_pattern(f"match:{match_id}:*")


# Test script
if __name__ == "__main__":
    logger.info("🧪 Testing Cache Manager...")
    
    try:
        cache = CacheManager()
        
        logger.info("\n" + "="*60)
        logger.info("CACHE OPERATIONS TEST")
        logger.info("="*60)
        
        # Test set/get
        test_data = {
            "match_id": 1,
            "team1": "France",
            "team2": "Argentina",
            "score": "1-0",
            "possession": 58
        }
        
        logger.info("\n1. Testing Set/Get:")
        cache.set("test:match:1", test_data, ttl=3600)
        retrieved = cache.get("test:match:1")
        logger.info(f"  Stored: {test_data}")
        logger.info(f"  Retrieved: {retrieved}")
        logger.info(f"  ✅ Match: {test_data == retrieved}")
        
        # Test TTL
        logger.info("\n2. Testing TTL:")
        ttl = cache.ttl("test:match:1")
        logger.info(f"  Remaining TTL: {ttl} seconds")
        
        # Test counters
        logger.info("\n3. Testing Counters:")
        cache.set("test:counter", 0)
        for i in range(5):
            count = cache.increment("test:counter")
            logger.info(f"  Count: {count}")
        
        # Test lists
        logger.info("\n4. Testing Lists:")
        cache.delete("test:events")
        cache.append("test:events", {"type": "goal", "player": "Mbappe"})
        cache.append("test:events", {"type": "card", "player": "Mascherano"})
        events = cache.get_list("test:events")
        logger.info(f"  Events stored: {len(events)}")
        logger.info(f"  Events: {events}")
        
        # Test MatchCache
        logger.info("\n5. Testing MatchCache:")
        match_cache = MatchCache(cache)
        match_cache.set_match_stats(1, test_data)
        stats = match_cache.get_match_stats(1)
        logger.info(f"  Match stats cached: {stats is not None}")
        
        # Test cache stats
        logger.info("\n6. Cache Statistics:")
        stats = cache.get_stats()
        logger.info(f"  Memory: {stats.get('used_memory_mb')}")
        logger.info(f"  Connected clients: {stats.get('connected_clients')}")
        logger.info(f"  Keys stored: {stats.get('keys_count')}")
        
        # Cleanup
        logger.info("\n7. Cleanup:")
        cache.clear_pattern("test:*")
        logger.info("  ✅ Test data cleaned up")
        
        logger.info("\n" + "="*60)
        logger.info("✅ Cache Manager test complete!")
        logger.info("="*60)
    
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")