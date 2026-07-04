import React from 'react';
import { motion } from 'framer-motion';
import MatchCard from '@components/MatchCard';
import { SoccerField } from '@components/SoccerField';
import useWebSocket from '@hooks/useWebSocket';

export default function LiveMatchPage() {
  // Mock data - replace with real API call
  const mockMatch = {
    team1: {
      name: 'France',
      flag: '🇫🇷',
      score: 2,
      possession: 58,
      shots: 8,
      shotsOnTarget: 4,
    },
    team2: {
      name: 'Argentina',
      flag: '🇦🇷',
      score: 1,
      possession: 42,
      shots: 5,
      shotsOnTarget: 2,
    },
    time: '45+2\'',
    stadium: 'Lusail Stadium',
    status: 'LIVE' as const,
  };

  // Mock player data
  const team1Players = [
    { id: '1', name: 'Goalkeeper', x: 10, y: 32, team: 'team1' as const, activity: 20 },
    { id: '2', name: 'Defender', x: 20, y: 20, team: 'team1' as const, activity: 35 },
    { id: '3', name: 'Defender', x: 20, y: 44, team: 'team1' as const, activity: 40 },
    { id: '4', name: 'Midfielder', x: 40, y: 25, team: 'team1' as const, activity: 65 },
    { id: '5', name: 'Midfielder', x: 40, y: 39, team: 'team1' as const, activity: 60 },
    { id: '6', name: 'Forward', x: 75, y: 30, team: 'team1' as const, activity: 85 },
    { id: '7', name: 'Forward', x: 80, y: 45, team: 'team1' as const, activity: 75 },
  ];

  const team2Players = [
    { id: '1', name: 'Goalkeeper', x: 90, y: 32, team: 'team2' as const, activity: 25 },
    { id: '2', name: 'Defender', x: 80, y: 20, team: 'team2' as const, activity: 45 },
    { id: '3', name: 'Defender', x: 80, y: 44, team: 'team2' as const, activity: 50 },
    { id: '4', name: 'Midfielder', x: 60, y: 28, team: 'team2' as const, activity: 55 },
    { id: '5', name: 'Midfielder', x: 60, y: 36, team: 'team2' as const, activity: 50 },
    { id: '6', name: 'Forward', x: 25, y: 32, team: 'team2' as const, activity: 70 },
  ];

  const matchEvents = [
    {
      time: '45+2',
      event: 'GOAL',
      team: 'France',
      player: 'Mbappe',
      description: 'Excellent finish after a brilliant team move',
      icon: '⚽',
    },
    {
      time: '43',
      event: 'YELLOW CARD',
      team: 'Argentina',
      player: 'Mascherano',
      description: 'Tactical foul to stop counter-attack',
      icon: '🟨',
    },
    {
      time: '38',
      event: 'SAVE',
      team: 'France',
      player: 'Lloris',
      description: 'Brilliant reflexive save from close range',
      icon: '🧤',
    },
    {
      time: '30',
      event: 'GOAL',
      team: 'Argentina',
      player: 'Messi',
      description: 'Clinical finish from the edge of the box',
      icon: '⚽',
    },
  ];

  const predictions = {
    france: 62.5,
    draw: 15.0,
    argentina: 22.5,
  };

  return (
    <div className="min-h-screen bg-fifa-light py-8">
      <div className="container">
        {/* Hero Match Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <MatchCard {...mockMatch} />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Soccer Field & Events */}
          <div className="lg:col-span-2 space-y-8">
            {/* Soccer Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-fifa-navy mb-4">
                Live Possession & Movement
              </h2>
              <SoccerField
                team1Players={team1Players}
                team2Players={team2Players}
                possession={mockMatch.team1.possession}
              />
            </motion.div>

            {/* Match Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-fifa-navy mb-4">Match Events</h2>
              <div className="space-y-3">
                {matchEvents.map((event, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="card p-4 border-l-4 border-fifa-gold"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{event.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-fifa-navy">{event.time}'</span>
                          <span className="badge badge-gold">{event.event}</span>
                          <span className="text-sm font-semibold text-fifa-navy">
                            {event.team}
                          </span>
                        </div>
                        <p className="font-semibold text-fifa-navy">{event.player}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Predictions & Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Match Predictions */}
            <div className="card card-gold p-6">
              <h3 className="text-xl font-bold text-fifa-navy mb-4">
                🔮 Match Predictions
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-fifa-navy">France Win</span>
                    <span className="text-lg font-bold text-fifa-gold num">
                      {predictions.france}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-fifa-gold h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${predictions.france}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-fifa-navy">Draw</span>
                    <span className="text-lg font-bold text-fifa-gold num">
                      {predictions.draw}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-fifa-gold h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${predictions.draw}%` }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-fifa-navy">Argentina Win</span>
                    <span className="text-lg font-bold text-fifa-gold num">
                      {predictions.argentina}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-fifa-gold h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${predictions.argentina}%` }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-fifa-navy mb-4">📊 Team Comparison</h3>
              <div className="space-y-3">
                <StatRow
                  label="Possession"
                  team1={`${mockMatch.team1.possession}%`}
                  team2={`${mockMatch.team2.possession}%`}
                />
                <StatRow
                  label="Shots"
                  team1={mockMatch.team1.shots}
                  team2={mockMatch.team2.shots}
                />
                <StatRow
                  label="On Target"
                  team1={mockMatch.team1.shotsOnTarget}
                  team2={mockMatch.team2.shotsOnTarget}
                />
              </div>
            </div>

            {/* Live Sentiment */}
            <div className="card p-6 bg-fifa-light">
              <h3 className="text-xl font-bold text-fifa-navy mb-4">💬 Fan Sentiment</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-fifa-navy">😍 Positive</span>
                  <span className="text-sm font-bold text-fifa-gold num">72%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-fifa-navy">😐 Neutral</span>
                  <span className="text-sm font-bold text-fifa-gold num">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-fifa-navy">😠 Negative</span>
                  <span className="text-sm font-bold text-fifa-gold num">10%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  team1: string | number;
  team2: string | number;
}

function StatRow({ label, team1, team2 }: StatRowProps) {
  return (
    <div className="pb-3 border-b border-gray-200">
      <p className="text-xs font-bold text-fifa-navy uppercase mb-2">{label}</p>
      <div className="flex justify-between">
        <span className="font-semibold text-fifa-navy num">{team1}</span>
        <span className="font-semibold text-fifa-navy num">{team2}</span>
      </div>
    </div>
  );
}
