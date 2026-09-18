import React, { useState } from 'react';
import { LeaderboardPlayer, PlayerStats } from '../types';
import { INITIAL_LEADERBOARD } from '../data/constants';
import { Trophy, Medal, Flame, Zap, Shield, Search, ArrowUp } from 'lucide-react';

interface LeaderboardMenuProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const LeaderboardMenu: React.FC<LeaderboardMenuProps> = ({ stats, onClose }) => {
  const [filter, setFilter] = useState<'score' | 'kills' | 'kd' | 'wins'>('score');
  const [searchQuery, setSearchQuery] = useState('');

  // Merge user's current stats into leaderboard
  const userKd = stats.deaths > 0 ? parseFloat((stats.kills / stats.deaths).toFixed(2)) : stats.kills;
  const userScore = stats.kills * 100 + stats.wins * 350 + stats.headshots * 50;

  const players: LeaderboardPlayer[] = INITIAL_LEADERBOARD.map(p => {
    if (p.isUser) {
      return {
        ...p,
        username: stats.username,
        score: userScore,
        kills: stats.kills,
        deaths: stats.deaths,
        kd: userKd,
        wins: stats.wins
      };
    }
    return p;
  });

  // Sort according to active filter
  const sortedPlayers = [...players].sort((a, b) => {
    if (filter === 'kills') return b.kills - a.kills;
    if (filter === 'kd') return b.kd - a.kd;
    if (filter === 'wins') return b.wins - a.wins;
    return b.score - a.score;
  }).map((p, idx) => ({ ...p, rank: idx + 1 }));

  const filteredList = sortedPlayers.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="leaderboard-menu" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">GLOBAL ARENA LEADERBOARDS</h1>
            <p className="text-xs text-slate-400">Real-time competitive combat rankings & prestige tiers</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono font-bold transition"
        >
          CLOSE
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-8 py-4 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['score', 'kills', 'kd', 'wins'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition ${
                filter === cat ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'kd' ? 'K/D RATIO' : cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search operativetag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-16">RANK</th>
                <th className="py-3 px-4">OPERATIVE</th>
                <th className="py-3 px-4 text-center">TIER</th>
                <th className="py-3 px-4 text-right">SCORE</th>
                <th className="py-3 px-4 text-right">KILLS</th>
                <th className="py-3 px-4 text-right">K/D</th>
                <th className="py-3 px-4 text-right">WINS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-mono">
              {filteredList.map((player) => {
                const isTop3 = player.rank <= 3;
                const isUser = player.isUser;

                return (
                  <tr
                    key={player.username}
                    className={`transition ${
                      isUser
                        ? 'bg-cyan-500/10 hover:bg-cyan-500/15 border-l-4 border-l-cyan-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-bold">
                      {player.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          1
                        </span>
                      ) : player.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40">
                          2
                        </span>
                      ) : player.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500">{player.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg shadow flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: player.skinColor }}
                      >
                        {player.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={isUser ? 'text-cyan-300' : 'text-slate-200'}>
                          {player.username} {isUser && <span className="text-[10px] text-cyan-400 font-normal">(YOU)</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] uppercase font-bold border border-slate-800 text-slate-300">
                        {player.badge}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                      {player.score.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{player.kills}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400">{player.kd.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{player.wins}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
