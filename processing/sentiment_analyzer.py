"""
Sentiment Analysis for Live Pitch
Real-time NLP analysis of social media posts
"""

import logging
from typing import Dict, Tuple
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Analyze sentiment from text using multiple NLP techniques"""
    
    def __init__(self):
        """Initialize sentiment analyzers"""
        self.vader = SentimentIntensityAnalyzer()
        logger.info("✅ Sentiment Analyzer initialized")
    
    def analyze_vader(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment using VADER (Valence Aware Dictionary)
        
        Args:
            text: Text to analyze
        
        Returns:
            Dict with: negative, neutral, positive, compound scores
        """
        scores = self.vader.polarity_scores(text)
        return {
            "negative": scores['neg'],
            "neutral": scores['neu'],
            "positive": scores['pos'],
            "compound": scores['compound']  # -1 to 1
        }
    
    def analyze_textblob(self, text: str) -> Tuple[float, float]:
        """
        Analyze sentiment using TextBlob
        
        Args:
            text: Text to analyze
        
        Returns:
            (polarity, subjectivity) both 0 to 1
        """
        blob = TextBlob(text)
        return blob.sentiment.polarity, blob.sentiment.subjectivity
    
    def analyze_combined(self, text: str) -> Dict[str, float]:
        """
        Combined sentiment analysis using multiple methods
        
        Args:
            text: Text to analyze
        
        Returns:
            - sentiment_score: -1 to 1
            - confidence: 0 to 1
            - subjectivity: 0 to 1
        """
        # VADER scores
        vader_scores = self.analyze_vader(text)
        vader_sentiment = vader_scores['compound']
        
        # TextBlob scores
        polarity, subjectivity = self.analyze_textblob(text)
        
        # Combined sentiment (average)
        combined_sentiment = (vader_sentiment + polarity) / 2
        
        # Confidence based on text length and consistency
        text_length_factor = min(len(text.split()) / 10, 1.0)
        consistency = 1 - abs(vader_sentiment - polarity)
        confidence = (text_length_factor + consistency) / 2
        
        return {
            "sentiment_score": combined_sentiment,  # -1 to 1
            "confidence": confidence,               # 0 to 1
            "subjectivity": subjectivity,           # 0 to 1
            "method": "combined",
            "details": {
                "vader": vader_sentiment,
                "textblob_polarity": polarity,
                "vader_positive": vader_scores['positive'],
                "vader_negative": vader_scores['negative']
            }
        }
    
    def detect_event_sentiment(self, text: str, event_type: str = None) -> Dict:
        """
        Detect sentiment with event context (goal, card, injury)
        
        Args:
            text: Text to analyze
            event_type: Type of event (goal, card, injury, etc)
        
        Returns:
            Sentiment analysis with context
        """
        analysis = self.analyze_combined(text)
        
        # Boost sentiment for positive events
        if event_type == "goal":
            if "GOAL" in text.upper() or "!" in text:
                analysis["sentiment_score"] = min(1.0, analysis["sentiment_score"] + 0.2)
                analysis["confidence"] = min(1.0, analysis["confidence"] + 0.1)
        
        # Negative sentiment for red cards
        elif event_type == "red_card":
            if analysis["sentiment_score"] > 0:
                analysis["sentiment_score"] *= -1
        
        analysis["event_type"] = event_type
        return analysis
    
    def classify_sentiment(self, sentiment_score: float) -> str:
        """
        Classify sentiment into categories
        
        Args:
            sentiment_score: Score from -1 to 1
        
        Returns:
            Category: very_negative, negative, neutral, positive, very_positive
        """
        if sentiment_score < -0.6:
            return "very_negative"
        elif sentiment_score < -0.2:
            return "negative"
        elif sentiment_score < 0.2:
            return "neutral"
        elif sentiment_score < 0.6:
            return "positive"
        else:
            return "very_positive"
    
    def get_sentiment_emoji(self, sentiment_score: float) -> str:
        """Get emoji for sentiment category"""
        category = self.classify_sentiment(sentiment_score)
        emojis = {
            "very_negative": "😠",
            "negative": "😟",
            "neutral": "😐",
            "positive": "😊",
            "very_positive": "🎉"
        }
        return emojis.get(category, "😐")


# Test script
if __name__ == "__main__":
    logger.info("🧪 Testing Sentiment Analyzer...")
    
    analyzer = SentimentAnalyzer()
    
    # Test samples
    samples = [
        ("GOOOAAL MBAPPE!!! 🔥🔥🔥", "goal"),
        ("Terrible defending...", None),
        ("Amazing save!", None),
        ("We can do this!", None),
        ("Red card! That's unfair!", "red_card"),
        ("What a boring match", None),
        ("Best performance ever!", None),
    ]
    
    logger.info("\n" + "="*60)
    logger.info("SENTIMENT ANALYSIS RESULTS")
    logger.info("="*60)
    
    for text, event in samples:
        result = analyzer.detect_event_sentiment(text, event)
        category = analyzer.classify_sentiment(result['sentiment_score'])
        emoji = analyzer.get_sentiment_emoji(result['sentiment_score'])
        
        logger.info(f"\nText: {text}")
        logger.info(f"Score: {result['sentiment_score']:.3f} {emoji}")
        logger.info(f"Category: {category}")
        logger.info(f"Confidence: {result['confidence']:.1%}")
        logger.info(f"Subjectivity: {result['subjectivity']:.1%}")
    
    logger.info("\n" + "="*60)
    logger.info("✅ Sentiment Analyzer test complete!")
    logger.info("="*60)