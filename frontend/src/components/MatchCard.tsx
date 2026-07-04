import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';

interface Team {
  name: string;
  flag: string;
  score: number;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passes?: number;
  accuracy?: number;
}

interface MatchCardProps {
  team1: Team;
  team2: Team;
  time: string;
  stadium: string;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
}

export const MatchCard: React.FC<MatchCardProps> = ({
  team1,
  team2,
  time,
  stadium,
  status,
}) => {
  const isLive = status === 'LIVE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative rounded-2xl p-8 border-4 overflow-hidden ${
        isLive
          ? 'border-fifa-gold bg-gradient-to-br from-white to-fifa-light'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Live indicator */}
      {isLive && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute top-4 right-4 flex items-center gap-2 bg-fifa-red text-white px-4 py-2 rounded-full text-sm font-bold"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </motion.div>
      )}

      {/* Stadium info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-2 text-fifa-navy font-bold">
          <MapPin size={18} />
          <span className="text-sm sm:text-base">{stadium}</span>
        </div>
        <div className="flex items-center gap-2 text-fifa-navy font-bold">
          <Clock size={18} />
          <span className="text-sm sm:text-base">{time}</span>
        </div>
      </div>

      {/* Teams and Score */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        {/* Team 1 */}
        <motion.div
          className="flex-1 text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-6xl sm:text-7xl mb-2">{team1.flag}</div>
          <h2 className="text-xl sm:text-2xl font-bold text-fifa-navy">
            {team1.name}
          </h2>
        </motion.div>

        {/* Score */}
        <motion.div
          animate={isLive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1.5, repeat: isLive ? Infinity : 0 }}
          className="mx-4 sm:mx-8"
        >
          <div className="text-6xl sm:text-7xl font-bold text-fifa-gold font-mono tracking-widest">
            {team1.score} - {team2.score}
          </div>
        </motion.div>

        {/* Team 2 */}
        <motion.div
          className="flex-1 text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-6xl sm:text-7xl mb-2">{team2.flag}</div>
          <h2 className="text-xl sm:text-2xl font-bold text-fifa-navy">
            {team2.name}
          </h2>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatItem
          label="Possession"
          team1={`${team1.possession}%`}
          team2={`${team2.possession}%`}
          advantage={team1.possession > team2.possession ? 'team1' : 'team2'}
        />
        <StatItem
          label="Shots"
          team1={team1.shots}
          team2={team2.shots}
          advantage={team1.shots > team2.shots ? 'team1' : 'team2'}
        />
        <StatItem
          label="On Target"
          team1={team1.shotsOnTarget}
          team2={team2.shotsOnTarget}
          advantage={team1.shotsOnTarget > team2.shotsOnTarget ? 'team1' : 'team2'}
        />
        <StatItem
          label="Accuracy"
          team1={`${
            team1.shots > 0
              ? ((team1.shotsOnTarget / team1.shots) * 100).toFixed(0)
              : 0
          }%`}
          team2={`${
            team2.shots > 0
              ? ((team2.shotsOnTarget / team2.shots) * 100).toFixed(0)
              : 0
          }%`}
          advantage={
            team1.shots > 0 && team2.shots > 0
              ? team1.shotsOnTarget / team1.shots > team2.shotsOnTarget / team2.shots
                ? 'team1'
                : 'team2'
              : 'tie'
          }
        />
      </div>
    </motion.div>
  );
};

interface StatItemProps {
  label: string;
  team1: string | number;
  team2: string | number;
  advantage: 'team1' | 'team2' | 'tie';
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  team1,
  team2,
  advantage,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-fifa-light rounded-lg p-3 sm:p-4"
  >
    <div className="text-xs font-bold text-fifa-navy uppercase tracking-widest mb-2">
      {label}
    </div>
    <div className="flex justify-between items-center">
      <div
        className={`font-mono text-lg font-bold transition-colors ${
          advantage === 'team1' ? 'text-fifa-gold' : 'text-gray-400'
        }`}
      >
        {team1}
      </div>
      <div
        className={`font-mono text-lg font-bold transition-colors ${
          advantage === 'team2' ? 'text-fifa-gold' : 'text-gray-400'
        }`}
      >
        {team2}
      </div>
    </div>
  </motion.div>
);

export default MatchCard;
