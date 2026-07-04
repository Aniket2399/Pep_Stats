"""
Social Media Scraper for Live Pitch
Scrapes Twitter and Reddit for match sentiment
"""

import logging
import random
from typing import List, Dict, Any
from datetime import datetime
from kafka_producer import EventProducer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SocialMediaScraper:
    """Scrape social media for match sentiment"""
    
    def __init__(self):
        """Initialize scraper"""
        self.producer = EventProducer()
        self.twitter_api = None  # Will be initialized with API key
        self.reddit = None  # Will be initialized with credentials
        
        # Realistic sample posts for testing
        self.sample_posts = {
            "goal": [
                "GOOOAAL!!! 🔥🔥🔥",
                "YES!!! What a finish!",
                "UNBELIEVABLE! Best goal of the tournament!",
                "Football at its finest! 🎉",
                "Incredible skill, horrible defending!",
                "That's how you score in a final!",
            ],
            "save": [
                "What a save!!! 🧤",
                "Best goalkeeper performance ever!",
                "That was a world-class save!",
                "How did he even get to that?!",
            ],
            "card": [
                "Red card! That's too harsh...",
                "Deserved red card, dangerous play!",
                "Soft yellow, ref is having a bad day",
                "That wasn't even a foul!",
            ],
            "general": [
                "Amazing match so far! 🏆",
                "Terrible performance...",
                "Can't believe what I'm watching!",
                "Best game of the tournament!",
                "We've got this! Come on team!",
                "This is embarrassing...",
            ]
        }
        
        logger.info("✅ Social Media Scraper initialized")
    
    def get_sample_posts(self, match_id: int, event_type: str = None) -> List[Dict[str, Any]]:
        """
        Get sample posts for testing
        In production, this would scrape real social media
        
        Args:
            match_id: Match ID
            event_type: Type of event (goal, save, card, general)
        
        Returns:
            List of sample posts
        """
        posts = []
        
        # Determine post type
        if event_type and event_type in self.sample_posts:
            available_posts = self.sample_posts[event_type]
        else:
            available_posts = self.sample_posts["general"]
        
        # Generate 3-5 random posts
        num_posts = random.randint(3, 5)
        for _ in range(num_posts):
            post = {
                "text": random.choice(available_posts),
                "source": random.choice(["twitter", "reddit"]),
                "sentiment_score": random.uniform(-1, 1),
                "match_id": match_id,
                "team": random.choice(["France", "Argentina"]),
                "timestamp": datetime.utcnow().isoformat(),
                "likes": random.randint(10, 10000),
                "retweets": random.randint(0, 5000),
                "author_followers": random.randint(100, 1000000)
            }
            posts.append(post)
        
        return posts
    
    def scrape_twitter_sentiment(self, match_id: int, search_terms: List[str] = None):
        """
        Scrape Twitter for match sentiment
        
        Args:
            match_id: Match ID
            search_terms: List of search terms (team names, players, hashtags)
        
        Note:
            Requires Twitter API credentials in .env
            API endpoints: search/tweets, search/tweets_recent
        """
        try:
            if not self.twitter_api:
                logger.warning("⚠️  Twitter API not configured")
                return None
            
            # In production, this would call:
            # tweets = self.twitter_api.search_tweets(
            #     q=f"({' OR '.join(search_terms)}) -is:retweet",
            #     lang="en",
            #     result_type="recent",
            #     max_results=100
            # )
            
            logger.info(f"🐦 Scraping Twitter for match {match_id}")
            
            # For now, return sample data
            return self.get_sample_posts(match_id)
        
        except Exception as e:
            logger.error(f"❌ Twitter scraping error: {e}")
            return None
    
    def scrape_reddit_sentiment(self, match_id: int, subreddits: List[str] = None):
        """
        Scrape Reddit for match sentiment
        
        Args:
            match_id: Match ID
            subreddits: List of subreddits to scrape (e.g., r/football, r/soccer)
        
        Note:
            Requires Reddit API credentials in .env
        """
        try:
            if not self.reddit:
                logger.warning("⚠️  Reddit API not configured")
                return None
            
            # In production, this would call:
            # submissions = self.reddit.subreddit('soccer').search(
            #     f'match:{match_id}',
            #     time_filter='new',
            #     limit=100
            # )
            
            logger.info(f"🔴 Scraping Reddit for match {match_id}")
            
            # For now, return sample data
            return self.get_sample_posts(match_id)
        
        except Exception as e:
            logger.error(f"❌ Reddit scraping error: {e}")
            return None
    
    def stream_live_sentiment(self, match_id: int, duration_minutes: int = 90):
        """
        Stream live sentiment during match
        
        Args:
            match_id: Match ID
            duration_minutes: Duration to stream (default: 90 minutes)
        """
        import time
        
        logger.info(f"📡 Starting live sentiment stream for match {match_id}")
        logger.info(f"Duration: {duration_minutes} minutes")
        
        try:
            for minute in range(duration_minutes):
                # Randomly decide if there's an event this minute
                event_type = None
                if random.random() < 0.15:  # 15% chance of goal
                    event_type = "goal"
                elif random.random() < 0.05:  # 5% chance of save
                    event_type = "save"
                elif random.random() < 0.08:  # 8% chance of card
                    event_type = "card"
                
                # Get posts for this minute
                posts = self.get_sample_posts(match_id, event_type)
                
                # Send each post to Kafka
                for post in posts:
                    self.producer.send_sentiment(post)
                    logger.info(
                        f"📤 {minute}': \"{post['text'][:50]}...\" "
                        f"({post['source']}, score: {post['sentiment_score']:.2f})"
                    )
                
                # Wait before next minute
                time.sleep(2)  # 2 seconds per match minute (fast simulation)
            
            logger.info("✅ Live sentiment stream complete")
            self.producer.close()
        
        except KeyboardInterrupt:
            logger.info("⏹️  Stream stopped by user")
            self.producer.close()
        except Exception as e:
            logger.error(f"❌ Streaming error: {e}")
            self.producer.close()
    
    def setup_twitter_api(self, api_key: str, api_secret: str, access_token: str, access_secret: str):
        """
        Setup Twitter API credentials
        
        Args:
            api_key: Twitter API key
            api_secret: Twitter API secret
            access_token: Twitter access token
            access_secret: Twitter access secret
        """
        try:
            import tweepy
            
            auth = tweepy.OAuthHandler(api_key, api_secret)
            auth.set_access_token(access_token, access_secret)
            self.twitter_api = tweepy.API(auth)
            
            logger.info("✅ Twitter API configured")
        except Exception as e:
            logger.error(f"❌ Twitter API setup error: {e}")
    
    def setup_reddit_api(self, client_id: str, client_secret: str, user_agent: str):
        """
        Setup Reddit API credentials
        
        Args:
            client_id: Reddit client ID
            client_secret: Reddit client secret
            user_agent: Reddit user agent
        """
        try:
            import praw
            
            self.reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent
            )
            
            logger.info("✅ Reddit API configured")
        except Exception as e:
            logger.error(f"❌ Reddit API setup error: {e}")


# Test script
if __name__ == "__main__":
    logger.info("🧪 Testing Social Media Scraper...")
    
    scraper = SocialMediaScraper()
    
    logger.info("\n" + "="*60)
    logger.info("SOCIAL MEDIA SENTIMENT STREAMING")
    logger.info("="*60)
    
    # Stream live sentiment for a 5-minute match (fast simulation)
    scraper.stream_live_sentiment(match_id=1, duration_minutes=5)
    
    logger.info("\n" + "="*60)
    logger.info("✅ Social Media Scraper test complete!")
    logger.info("="*60)