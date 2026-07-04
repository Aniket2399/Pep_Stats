"""
Mock Data Generator for Live Pitch
Generates realistic FIFA World Cup match data for testing
"""

import random
import time
import logging
from datetime import datetime
from typing import List
from kafka_producer import EventProducer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MockDataGenerator:
    """Generate realistic mock FIFA World Cup match data"""
    
    # Sample teams for testing
    TEAMS = [
        ("France", "ARG"),
        ("Argentina", "FRA"),
        ("Brazil", "GER"),
        ("Germany", "BRA"),
        ("Spain", "NED"),
        ("Netherlands", "ESP"),
        ("England", "FRA"),
        ("Italy", "ESP"),
    ]
    
    # Sample players
    FRANCE_PLAYERS = ["Mbappe", "Griezmann", "Benzema", "Grizou", "Pogba"]
    ARGENTINA_PLAYERS = ["Messi", "Di Maria", "Aguero", "Mascherano", "Romero"]
    
    def __init__(self):
        """Initialize mock data generator"""
        self.producer = EventProducer()
        self.match_id = 1
        self.minute = 0
        self.team1_score = 0
        self.team2_score = 0
        self.team1_possession = 55
        self.team1_name = "France"
        self.team2_name = "Argentina"
        logger.info("✅ Mock Data Generator initialized")
    
    def generate_possession_change(self):
        """Generate realistic possession percentage change"""
        change = random.randint(-3, 3)
        self.team1_possession = max(30, min(70, self.team1_possession + change))
    
    def generate_goal(self) -> bool:
        """
        Simulate goal with probability
        Returns:
            bool: True if goal occurred
        """
        # 10% chance per minute
        if random.random() < 0.10:
            return True
        return False
    
    def generate_card(self) -> bool:
        """
        Simulate card (yellow/red) with probability
        Returns:
            bool: True if card occurred
        """
        # 5% chance per minute
        if random.random() < 0.05:
            return True
        return False
    
    def generate_substitution(self) -> bool:
        """
        Simulate substitution with probability
        Returns:
            bool: True if substitution occurred
        """
        # 2% chance per minute
        if random.random() < 0.02:
            return True
        return False
    
    def generate_match_events(self, duration_minutes: int = 10, speed_factor: int = 2):
        """
        Simulate a complete match with realistic events
        
        Args:
            duration_minutes: Length of match to simulate
            speed_factor: Speed multiplier (2 = 2x faster than real)
        """
        logger.info(f"⚽ Starting mock match simulation...")
        logger.info(f"Match: {self.team1_name} vs {self.team2_name}")
        logger.info(f"Duration: {duration_minutes} minutes at {speed_factor}x speed")
        logger.info("=" * 60)
        
        try:
            for minute in range(duration_minutes):
                self.minute = minute
                
                # Generate possession change
                self.generate_possession_change()
                
                # Send possession stats every minute
                self.producer.send_possession_stats({
                    "match_id": self.match_id,
                    "team1": self.team1_name,
                    "team2": self.team2_name,
                    "team1_possession": self.team1_possession,
                    "team2_possession": 100 - self.team1_possession,
                    "minute": minute,
                    "status": "LIVE"
                })
                
                # Check for goal
                if self.generate_goal():
                    team = random.choice([self.team1_name, self.team2_name])
                    
                    if team == self.team1_name:
                        self.team1_score += 1
                        scorer = random.choice(self.FRANCE_PLAYERS)
                    else:
                        self.team2_score += 1
                        scorer = random.choice(self.ARGENTINA_PLAYERS)
                    
                    self.producer.send_match_event({
                        "match_id": self.match_id,
                        "team1": self.team1_name,
                        "team2": self.team2_name,
                        "event_type": "goal",
                        "team": team,
                        "player": scorer,
                        "minute": minute,
                        "score": f"{self.team1_score}-{self.team2_score}",
                        "assist": None
                    })
                    
                    logger.info(f"⚽ GOAL! {scorer} ({team}) - Score: {self.team1_score}-{self.team2_score}")
                    
                    # Send sentiment
                    self.producer.send_sentiment({
                        "text": f"GOOOAAL {scorer}!!! 🔥🔥🔥",
                        "source": "twitter",
                        "sentiment_score": 0.95,
                        "match_id": self.match_id,
                        "team": team
                    })
                
                # Check for card
                if self.generate_card():
                    team = random.choice([self.team1_name, self.team2_name])
                    player = f"Player_{random.randint(1, 11)}"
                    card_type = random.choice(["yellow", "red"])
                    
                    self.producer.send_match_event({
                        "match_id": self.match_id,
                        "event_type": "card",
                        "team": team,
                        "player": player,
                        "card_type": card_type,
                        "minute": minute,
                        "reason": random.choice(["Foul", "Dive", "Unsporting"])
                    })
                    
                    card_emoji = "🟨" if card_type == "yellow" else "🟥"
                    logger.info(f"{card_emoji} {card_type.upper()} CARD: {player} ({team})")
                
                # Check for substitution
                if self.generate_substitution():
                    team = random.choice([self.team1_name, self.team2_name])
                    player_off = f"Player_{random.randint(1, 11)}"
                    player_on = f"Player_{random.randint(1, 11)}"
                    
                    self.producer.send_match_event({
                        "match_id": self.match_id,
                        "event_type": "substitution",
                        "team": team,
                        "player_off": player_off,
                        "player_on": player_on,
                        "minute": minute
                    })
                    
                    logger.info(f"🔄 SUBSTITUTION ({team}): {player_off} → {player_on}")
                
                # Send periodic sentiment posts
                if random.random() < 0.3:
                    sentiments = [
                        ("Amazing pass!", 0.8),
                        ("What a save!", 0.85),
                        ("We can do this!", 0.7),
                        ("Terrible defending!", -0.6),
                        ("Come on team!", 0.75),
                    ]
                    text, score = random.choice(sentiments)
                    
                    self.producer.send_sentiment({
                        "text": text,
                        "source": random.choice(["twitter", "reddit"]),
                        "sentiment_score": score,
                        "match_id": self.match_id,
                        "team": random.choice([self.team1_name, self.team2_name])
                    })
                
                # Sleep based on speed factor (2 seconds per match minute at 2x speed)
                sleep_time = 2 / speed_factor
                time.sleep(sleep_time)
            
            logger.info("=" * 60)
            logger.info(f"✅ Match simulation complete!")
            logger.info(f"Final Score: {self.team1_name} {self.team1_score} - {self.team2_score} {self.team2_name}")
            logger.info("=" * 60)
            
            self.producer.flush()
        
        except KeyboardInterrupt:
            logger.info("⏹️  Match simulation stopped by user")
        
        except Exception as e:
            logger.error(f"❌ Error during simulation: {e}")
        
        finally:
            self.producer.close()
    
    def run_tournament_simulation(self, num_matches: int = 3):
        """
        Run multiple matches in sequence
        
        Args:
            num_matches: Number of matches to simulate
        """
        logger.info(f"🏆 Starting tournament simulation with {num_matches} matches...")
        
        for i in range(num_matches):
            self.match_id = i + 1
            self.minute = 0
            self.team1_score = 0
            self.team2_score = 0
            self.team1_possession = random.randint(40, 60)
            
            team1, team2 = random.choice(self.TEAMS)
            self.team1_name = team1
            self.team2_name = team2
            
            logger.info(f"\n{'='*60}")
            logger.info(f"Match {i+1}/{num_matches}")
            logger.info(f"{'='*60}")
            
            self.generate_match_events(duration_minutes=5, speed_factor=3)
            
            if i < num_matches - 1:
                logger.info("⏳ Waiting 10 seconds before next match...")
                time.sleep(10)
        
        logger.info(f"\n✅ Tournament simulation complete!")


# Main execution
if __name__ == "__main__":
    generator = MockDataGenerator()
    
    # Option 1: Single match (10 minutes, 2x speed)
    generator.generate_match_events(duration_minutes=10, speed_factor=2)
    
    # Option 2: Tournament simulation (uncomment to run instead)
    # generator.run_tournament_simulation(num_matches=3)