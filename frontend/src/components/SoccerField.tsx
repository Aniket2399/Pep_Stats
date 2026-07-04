import React from 'react';
import { motion } from 'framer-motion';

interface PlayerPos {
  id: string;
  name: string;
  x: number; // 0-100 (percentage)
  y: number; // 0-100 (percentage)
  team: 'team1' | 'team2';
  activity: number; // 0-100
}

interface SoccerFieldProps {
  team1Players: PlayerPos[];
  team2Players: PlayerPos[];
  possession: number;
  passNet?: Array<{ from: PlayerPos; to: PlayerPos }>;
}

export const SoccerField: React.FC<SoccerFieldProps> = ({
  team1Players,
  team2Players,
  possession,
  passNet = [],
}) => {
  return (
    <div className="w-full bg-fifa-green rounded-lg overflow-hidden border-4 border-fifa-dark">
      <svg
        width="100%"
        height="400"
        viewBox="0 0 100 64"
        preserveAspectRatio="xMidYMid meet"
        className="bg-gradient-to-b from-fifa-green to-[#0f3a23]"
      >
        {/* Field markings */}
        <g stroke="white" strokeWidth="0.3" fill="none">
          {/* Outer boundary */}
          <rect x="0" y="0" width="100" height="64" />
          
          {/* Center line */}
          <line x1="50" y1="0" x2="50" y2="64" />
          
          {/* Center circle */}
          <circle cx="50" cy="32" r="9" />
          
          {/* Center spot */}
          <circle cx="50" cy="32" r="0.5" fill="white" />
          
          {/* Left penalty area */}
          <rect x="0" y="19.2" width="16.5" height="25.6" />
          <rect x="0" y="26.4" width="5.5" height="11.2" />
          <circle cx="11" cy="32" r="1" />
          
          {/* Right penalty area */}
          <rect x="83.5" y="19.2" width="16.5" height="25.6" />
          <rect x="94.5" y="26.4" width="5.5" height="11.2" />
          <circle cx="89" cy="32" r="1" />
          
          {/* Corner arcs */}
          <path d="M 0 0 A 1 1 0 0 1 1 1" />
          <path d="M 100 0 A 1 1 0 0 0 99 1" />
          <path d="M 100 64 A 1 1 0 0 1 99 63" />
          <path d="M 0 64 A 1 1 0 0 0 1 63" />
        </g>

        {/* Pass network */}
        {passNet.map((pass, i) => (
          <motion.line
            key={`pass-${i}`}
            x1={pass.from.x}
            y1={pass.from.y}
            x2={pass.to.x}
            y2={pass.to.y}
            stroke={
              pass.from.team === 'team1'
                ? 'rgba(10, 49, 97, 0.2)'
                : 'rgba(230, 57, 70, 0.2)'
            }
            strokeWidth="0.3"
            strokeDasharray="0.5,0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        ))}

        {/* Team 1 Players (Navy) */}
        {team1Players.map((player) => (
          <g key={`team1-${player.id}`}>
            {/* Activity heatmap */}
            <motion.circle
              cx={player.x}
              cy={player.y}
              r={2 + (player.activity / 100) * 2}
              fill="rgba(10, 49, 97, 0.15)"
              opacity={(player.activity / 100) * 0.5}
              animate={{ r: [2, 2.5, 2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* Player circle */}
            <motion.circle
              cx={player.x}
              cy={player.y}
              r="1.2"
              fill="#0A3161"
              stroke="white"
              strokeWidth="0.2"
              whileHover={{ r: 1.5, filter: 'drop-shadow(0 0 2px white)' }}
            />
            {/* Player number */}
            <text
              x={player.x}
              y={player.y + 0.3}
              textAnchor="middle"
              fontSize="0.6"
              fill="white"
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              {player.id}
            </text>
          </g>
        ))}

        {/* Team 2 Players (Red) */}
        {team2Players.map((player) => (
          <g key={`team2-${player.id}`}>
            {/* Activity heatmap */}
            <motion.circle
              cx={player.x}
              cy={player.y}
              r={2 + (player.activity / 100) * 2}
              fill="rgba(230, 57, 70, 0.15)"
              opacity={(player.activity / 100) * 0.5}
              animate={{ r: [2, 2.5, 2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* Player circle */}
            <motion.circle
              cx={player.x}
              cy={player.y}
              r="1.2"
              fill="#E63946"
              stroke="white"
              strokeWidth="0.2"
              whileHover={{ r: 1.5, filter: 'drop-shadow(0 0 2px white)' }}
            />
            {/* Player number */}
            <text
              x={player.x}
              y={player.y + 0.3}
              textAnchor="middle"
              fontSize="0.6"
              fill="white"
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              {player.id}
            </text>
          </g>
        ))}
      </svg>

      {/* Possession indicator below field */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-fifa-navy">POSSESSION</span>
          <span className="text-sm font-bold text-fifa-navy num">
            {possession}% - {100 - possession}%
          </span>
        </div>
        <motion.div
          className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-fifa-navy"
            initial={{ width: 0 }}
            animate={{ width: `${possession}%` }}
            transition={{ duration: 0.5, type: 'spring' }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default SoccerField;
