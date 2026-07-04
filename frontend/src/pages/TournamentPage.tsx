import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Target } from 'lucide-react';

export default function TournamentPage() {
  const standings = [
    { rank: 1, team: 'France', flag: '🇫🇷', w: 3, d: 0, l: 0, gf: 8, ga: 1, pts: 9 },
    { rank: 2, team: 'Argentina', flag: '🇦🇷', w: 2, d: 1, l: 0, gf: 7, ga: 2, pts: 7 },
    { rank: 3, team: 'Spain', flag: '🇪🇸', w: 2, d: 0, l: 1, gf: 6, ga: 4, pts: 6 },
    { rank: 4, team: 'England', flag: '🇬🇧', w: 1, d: 0, l: 2, gf: 5, ga: 5, pts: 3 },
  ];

  const topScorers = [
    { rank: 1, player: 'Mbappe', team: 'France', flag: '🇫🇷', goals: 5, assists: 2 },
    { rank: 2, player: 'Messi', team: 'Argentina', flag: '🇦🇷', goals: 4, assists: 1 },
    { rank: 3, player: 'Pedri', team: 'Spain', flag: '🇪🇸', goals: 3, assists: 3 },
    { rank: 4, player: 'Sterling', team: 'England', flag: '🇬🇧', goals: 2, assists: 2 },
  ];

  return (
    <div className="min-h-screen bg-fifa-light">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-fifa-navy to-fifa-green py-12 sm:py-16"
      >
        <div className="container">
          <div className="text-center">
            <motion.h1
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-5xl sm:text-6xl font-bold text-white mb-2"
            >
              🏆 FIFA WORLD CUP 2026
            </motion.h1>
            <p className="text-lg sm:text-xl text-fifa-gold font-semibold">
              Official Tournament Analytics
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container py-12">
        {/* Standings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-fifa-gold" size={32} />
            <h2 className="text-3xl font-bold text-fifa-navy">Group Standings</h2>
          </div>

          <div className="bg-white rounded-lg border-2 border-fifa-light overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-fifa-gold bg-fifa-light">
                    <th className="text-left py-3 px-4 font-bold text-fifa-navy">Rank</th>
                    <th className="text-left py-3 px-4 font-bold text-fifa-navy">Team</th>
                    <th className="text-center py-3 px-4 font-bold text-fifa-navy">W</th>
                    <th className="text-center py-3 px-4 font-bold text-fifa-navy">D</th>
                    <th className="text-center py-3 px-4 font-bold text-fifa-navy">L</th>
                    <th className="text-center py-3 px-4 font-bold text-fifa-navy">GD</th>
                    <th className="text-center py-3 px-4 font-bold text-fifa-gold num">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`border-b border-gray-200 hover:bg-fifa-light transition-colors ${
                        idx === 0 ? 'border-l-4 border-l-fifa-gold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-fifa-navy">{row.rank}</td>
                      <td className="py-3 px-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{row.flag}</span>
                          <span className="text-fifa-navy">{row.team}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-fifa-navy">
                        {row.w}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-fifa-navy">
                        {row.d}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-fifa-navy">
                        {row.l}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-fifa-navy">
                        {row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-fifa-gold num">
                        {row.pts}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Top Scorers */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-fifa-gold" size={32} />
            <h2 className="text-3xl font-bold text-fifa-navy">⭐ Top Scorers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topScorers.map((player, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card card-gold p-4 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-3xl">{player.flag}</div>
                    <h3 className="font-bold text-fifa-navy">{player.player}</h3>
                    <p className="text-sm text-gray-600">{player.team}</p>
                  </div>
                  <div className="bg-fifa-gold text-fifa-navy font-bold rounded-full w-12 h-12 flex items-center justify-center text-xl">
                    {player.goals}
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="badge badge-navy">Assists: {player.assists}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
