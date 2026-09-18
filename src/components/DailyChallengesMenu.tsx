import React from 'react';
import { DailyChallenge, PlayerStats } from '../types';
import { Calendar, CheckCircle2, Coins, Sparkles, Clock, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyChallengesMenuProps {
  challenges: DailyChallenge[];
  stats: PlayerStats;
  onClaimReward: (challengeId: string) => void;
  onClose: () => void;
}

export const DailyChallengesMenu: React.FC<DailyChallengesMenuProps> = ({
  challenges,
  stats,
  onClaimReward,
  onClose
}) => {
  const handleClaim = (chId: string) => {
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
    onClaimReward(chId);
  };

  return (
    <div id="daily-challenges-menu" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">DAILY COMBAT PROTOCOLS</h1>
            <p className="text-xs text-slate-400">Complete daily combat assignments for bonus Credits and XP</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>RESET IN: 14h 22m</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono font-bold transition"
          >
            RETURN
          </button>
        </div>
      </div>

      {/* Challenges List */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {challenges.map((ch) => {
            const isFinished = ch.progress >= ch.target;
            const pct = Math.min(100, (ch.progress / ch.target) * 100);

            return (
              <div
                key={ch.id}
                className={`p-6 rounded-3xl border transition ${
                  ch.claimed
                    ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                    : isFinished
                    ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-white">{ch.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{ch.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      <Coins className="w-3.5 h-3.5" />
                      +{ch.rewardCoins}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      +{ch.rewardXp} XP
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">PROGRESS</span>
                    <span className="text-slate-200 font-bold">
                      {ch.progress} / {ch.target}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFinished ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Claim Button */}
                <div className="mt-4 flex justify-end">
                  {ch.claimed ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      REWARD CLAIMED
                    </span>
                  ) : isFinished ? (
                    <button
                      onClick={() => handleClaim(ch.id)}
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-lg transition"
                    >
                      <span>CLAIM REWARD</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">IN PROGRESS</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
