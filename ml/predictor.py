"""
Win Probability Prediction Model
Machine learning model for predicting match outcomes
"""

import logging
import joblib
import numpy as np
from typing import Dict, Tuple
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import os

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class WinPredictor:
    """Predict win probability for teams"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize predictor with trained model
        
        Args:
            model_path: Path to saved model
        """
        self.model = None
        self.scaler = None
        self.feature_names = [
            'possession', 'shots', 'shots_on_target', 'passes',
            'pass_accuracy', 'fouls', 'corners', 'cards'
        ]
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self._create_initial_model()
        
        logger.info("✅ Win Predictor initialized")
    
    def _create_initial_model(self):
        """Create initial model with dummy training data"""
        logger.info("🔧 Creating initial prediction model...")
        
        self.model = GradientBoostingClassifier(
            n_estimators=50,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        
        # Generate realistic dummy training data
        np.random.seed(42)
        n_samples = 200
        
        # Features: possession, shots, shots_on_target, passes, pass_accuracy, fouls, corners, cards
        X_dummy = np.random.rand(n_samples, 8)
        X_dummy[:, 0] = np.random.uniform(30, 70, n_samples)  # possession: 30-70%
        X_dummy[:, 1] = np.random.poisson(5, n_samples)  # shots: ~5 per match
        X_dummy[:, 2] = np.random.poisson(2, n_samples)  # shots_on_target: ~2 per match
        X_dummy[:, 3] = np.random.poisson(150, n_samples)  # passes: ~150 per match
        X_dummy[:, 4] = np.random.uniform(60, 90, n_samples)  # pass_accuracy: 60-90%
        X_dummy[:, 5] = np.random.poisson(8, n_samples)  # fouls: ~8 per match
        X_dummy[:, 6] = np.random.poisson(5, n_samples)  # corners: ~5 per match
        X_dummy[:, 7] = np.random.poisson(1, n_samples)  # cards: ~1 per match
        
        # Create labels based on features (better possession = higher win chance)
        y_dummy = (X_dummy[:, 0] > 50).astype(int)  # Win if possession > 50%
        
        # Add some randomness
        random_flip = np.random.rand(n_samples) < 0.3
        y_dummy[random_flip] = 1 - y_dummy[random_flip]
        
        # Fit model
        self.scaler.fit(X_dummy)
        self.model.fit(self.scaler.transform(X_dummy), y_dummy)
        
        logger.info("✅ Initial model created with 200 training samples")
    
    def predict_win_probability(self, team_stats: Dict) -> Tuple[float, Dict]:
        """
        Predict win probability for a team
        
        Args:
            team_stats: Dictionary with stats (possession, shots, etc)
        
        Returns:
            (win_probability, details)
        """
        try:
            # Extract features in correct order
            features = np.array([[
                team_stats.get('possession', 50),
                team_stats.get('shots', 0),
                team_stats.get('shots_on_target', 0),
                team_stats.get('passes', 0),
                team_stats.get('pass_accuracy', 70),
                team_stats.get('fouls', 0),
                team_stats.get('corners', 0),
                team_stats.get('cards', 0)
            ]])
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Predict probability
            win_prob = self.model.predict_proba(features_scaled)[0][1]
            
            # Get feature importance
            feature_importance = dict(zip(
                self.feature_names,
                self.model.feature_importances_
            ))
            
            # Sort by importance
            top_features = sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:3]
            
            return float(win_prob), {
                "win_probability": float(win_prob),
                "loss_probability": float(1 - win_prob),
                "confidence": float(np.max(self.model.predict_proba(features_scaled))),
                "top_features": top_features
            }
        
        except Exception as e:
            logger.error(f"❌ Prediction error: {e}")
            return 0.5, {
                "win_probability": 0.5,
                "loss_probability": 0.5,
                "confidence": 0.5,
                "error": str(e)
            }
    
    def predict_match_outcome(self, team1_stats: Dict, team2_stats: Dict) -> Dict:
        """
        Predict match outcome (win/draw/loss for team1)
        
        Args:
            team1_stats: Team 1 statistics
            team2_stats: Team 2 statistics
        
        Returns:
            Predicted probabilities for win/draw/loss
        """
        team1_prob, team1_details = self.predict_win_probability(team1_stats)
        team2_prob, team2_details = self.predict_win_probability(team2_stats)
        
        # Normalize probabilities
        total = team1_prob + team2_prob
        team1_prob_norm = team1_prob / total if total > 0 else 0.5
        team2_prob_norm = team2_prob / total if total > 0 else 0.5
        
        # Draw probability (base 15%, increases if teams are evenly matched)
        draw_base = 0.15
        evenness = 1 - abs(team1_prob_norm - team2_prob_norm)
        draw_prob = draw_base + (evenness * 0.1)
        
        # Adjust win probabilities to account for draw
        team1_win = max(0, team1_prob_norm - draw_prob)
        team2_win = max(0, team2_prob_norm - draw_prob)
        
        # Normalize to sum to 1
        total_prob = team1_win + team2_win + draw_prob
        team1_win /= total_prob
        team2_win /= total_prob
        draw_prob /= total_prob
        
        return {
            "team1_win": team1_win,
            "team2_win": team2_win,
            "draw": draw_prob,
            "team1_details": team1_details,
            "team2_details": team2_details,
            "most_likely": max(
                ("team1_win", team1_win),
                ("draw", draw_prob),
                ("team2_win", team2_win),
                key=lambda x: x[1]
            )[0]
        }
    
    def save_model(self, path: str):
        """Save model to disk"""
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }, path)
        logger.info(f"✅ Model saved to {path}")
    
    def load_model(self, path: str):
        """Load model from disk"""
        try:
            data = joblib.load(path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_names = data.get('feature_names', self.feature_names)
            logger.info(f"✅ Model loaded from {path}")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            self._create_initial_model()


# Test script
if __name__ == "__main__":
    logger.info("🧪 Testing Win Predictor...")
    
    predictor = WinPredictor()
    
    logger.info("\n" + "="*60)
    logger.info("WIN PROBABILITY PREDICTIONS")
    logger.info("="*60)
    
    # Test predictions
    test_cases = [
        {
            "name": "Strong Team",
            "stats": {
                'possession': 65,
                'shots': 12,
                'shots_on_target': 6,
                'passes': 450,
                'pass_accuracy': 85,
                'fouls': 4,
                'corners': 7,
                'cards': 0
            }
        },
        {
            "name": "Weak Team",
            "stats": {
                'possession': 35,
                'shots': 4,
                'shots_on_target': 1,
                'passes': 250,
                'pass_accuracy': 65,
                'fouls': 12,
                'corners': 2,
                'cards': 2
            }
        },
        {
            "name": "Evenly Matched",
            "stats": {
                'possession': 50,
                'shots': 8,
                'shots_on_target': 3,
                'passes': 350,
                'pass_accuracy': 75,
                'fouls': 8,
                'corners': 5,
                'cards': 1
            }
        }
    ]
    
    for test in test_cases:
        logger.info(f"\n{test['name']}:")
        prob, details = predictor.predict_win_probability(test['stats'])
        
        logger.info(f"  Win Probability: {prob:.1%}")
        logger.info(f"  Loss Probability: {details['loss_probability']:.1%}")
        logger.info(f"  Confidence: {details['confidence']:.1%}")
        logger.info(f"  Top Features: {details['top_features']}")
    
    # Test match outcome
    logger.info("\n" + "="*60)
    logger.info("MATCH OUTCOME PREDICTION")
    logger.info("="*60)
    
    france_stats = {
        'possession': 58,
        'shots': 8,
        'shots_on_target': 4,
        'passes': 234,
        'pass_accuracy': 82,
        'fouls': 6,
        'corners': 3,
        'cards': 0
    }
    
    argentina_stats = {
        'possession': 42,
        'shots': 5,
        'shots_on_target': 2,
        'passes': 198,
        'pass_accuracy': 79,
        'fouls': 8,
        'corners': 2,
        'cards': 1
    }
    
    outcome = predictor.predict_match_outcome(france_stats, argentina_stats)
    
    logger.info("\nFrance vs Argentina:")
    logger.info(f"  France Win: {outcome['team1_win']:.1%}")
    logger.info(f"  Draw: {outcome['draw']:.1%}")
    logger.info(f"  Argentina Win: {outcome['team2_win']:.1%}")
    logger.info(f"  Most Likely: {outcome['most_likely']}")
    
    # Save model
    predictor.save_model("ml/win_predictor_model.pkl")
    
    logger.info("\n" + "="*60)
    logger.info("✅ Win Predictor test complete!")
    logger.info("="*60)