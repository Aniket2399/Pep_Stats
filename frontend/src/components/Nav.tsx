import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, Users, BarChart3, Brain } from 'lucide-react';

const Nav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Tournament', icon: Trophy },
    { path: '/match/1', label: 'Live Match', icon: Zap },
    { path: '/teams', label: 'Teams', icon: Users },
    { path: '/players', label: 'Players', icon: BarChart3 },
    { path: '/predictions', label: 'Predictions', icon: Brain },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-fifa-navy to-fifa-green shadow-lg">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl"
            >
              ⚽
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">LIVE PITCH</h1>
              <p className="text-xs text-fifa-gold">FIFA WORLD CUP 2026</p>
            </div>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative group"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      isActive
                        ? 'bg-fifa-gold text-fifa-navy'
                        : 'text-white hover:bg-fifa-gold hover:bg-opacity-20'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="hidden lg:inline">{item.label}</span>
                  </motion.button>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-highlight"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-fifa-gold rounded-t"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg bg-fifa-gold bg-opacity-20 text-white hover:bg-opacity-30"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
