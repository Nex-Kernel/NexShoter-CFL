import React, { useState } from 'react';
import { Trophy, Share2, Copy, Check, RotateCcw, Home, Sparkles, Coins, Shield, Flame, CloudSun, CloudRain, Wind, Snowflake, Play, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameMode, PlayerTeam, TeamScores, WeatherInfo, MatchHighlight } from '../types';
import { MatchHighlightsView } from './MatchHighlightsView';

interface GameOverModalProps {
  winner: string;
  kills: number;
  deaths: number;
  headshots: number;
  bestStreak: number;
  highlights?: MatchHighlight[];
  gameMode?: GameMode;
  playerTeam?: PlayerTeam;
  teamScores?: TeamScores;
  weather?: WeatherInfo;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  kills,
  deaths,
  headshots,
  bestStreak,
  highlights = [],
  gameMode = 'ffa',
  playerTeam = 'blue',
  teamScores = { red: 0, blue: 0 },
  weather,
  onPlayAgain,
  onReturnToLobby
}) => {
  const isTDM = gameMode === 'tdm';
  const isVictory = isTDM
    ? (winner === 'Blue Team' && playerTeam === 'blue') || (winner === 'Red Team' && playerTeam === 'red')
    : winner === 'You';

  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  const xpEarned = kills * 120 + (isVictory ? 500 : 200) + headshots * 50;
  const coinsEarned = kills * 25 + (isVictory ? 150 : 50);

  const [activeTab, setActiveTab] = useState<'highlights' | 'overview'>('highlights');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isVictory) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [isVictory]);

  const handleShareTwitter = () => {
    const modeStr = isTDM ? `[Team Deathmatch: Blue ${teamScores.blue} - ${teamScores.red} Red]` : '[FFA]';
    const weatherStr = weather ? ` in ${weather.name}` : '';
    const bestMomentStr = highlights.length > 0 ? ` with MVP play: "${highlights[0].title}"!` : '!';
    const text = `I just finished a match ${modeStr}${weatherStr} in VengeStrike 3D with ${kills} kills, ${deaths} deaths (${kd} K/D) and a ${bestStreak}x streak${bestMomentStr} Can you beat my score?`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCopy = () => {
    const modeStr = isTDM ? `Team Deathmatch (Blue: ${teamScores.blue} | Red: ${teamScores.red})` : 'Free For All';
    const weatherStr = weather ? `\nAtmosphere: ${weather.name} (${weather.condition})` : '';
    const highlightSummary = highlights.length > 0
      ? `\n🔥 Top Play: ${highlights[0].title} (${highlights[0].killsCount} Frags, ${highlights[0].damageDealt} DMG)`
      : '';
    const text = `🏆 VengeStrike 3D Match Result 🏆\nMode: ${modeStr}${weatherStr}\nOutcome: ${isVictory ? 'VICTORY' : 'DEFEAT'}\nKills: ${kills} | Deaths: ${deaths} | K/D: ${kd}\nHeadshots: ${headshots} | Best Streak: ${bestStreak}x${highlightSummary}\nPlay free in browser: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="game-over-modal" className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-rajdhani overflow-y-auto">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-7 max-w-2xl w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Top Victory / Defeat Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 text-left">
            <div className={`p-2.5 rounded-2xl border ${
              isVictory ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}>
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold font-heading tracking-wide ${isVictory ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isVictory ? 'MATCH VICTORY' : 'MATCH COMPLETE'}
              </h2>
              <p className="text-xs text-slate-400">
                {isTDM
                  ? `Winning Squad: ${winner} (${winner === 'Blue Team' ? 'Blue Vanguard' : 'Red Legion'})`
                  : isVictory
                  ? 'Supreme Combatant of the Arena'
                  : `Winner: ${winner}`}
              </p>
            </div>
          </div>

          {/* Atmosphere & Weather Badge */}
          {weather && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 rounded-full border border-slate-800 text-[11px] font-mono text-slate-300">
              <span>{weather.type === 'storm' ? '⛈️' : weather.type === 'sandstorm' ? '🌪️' : weather.type === 'snow' ? '❄️' : weather.type === 'cyber_fog' ? '🌆' : '☀️'}</span>
              <span className="font-bold uppercase text-slate-200">{weather.name}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation: Match Highlights vs Overview */}
        <div className="flex p-1 bg-slate-950/90 rounded-2xl border border-slate-800 mb-5">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono font-bold transition ${
              activeTab === 'highlights'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>MATCH HIGHLIGHTS</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
              activeTab === 'highlights' ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              TOP 3 PLAYS
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono font-bold transition ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>MATCH STATS & RECAP</span>
          </button>
        </div>

        {/* TAB 1: HIGHLIGHTS VIEW */}
        {activeTab === 'highlights' && (
          <div className="mb-6">
            <MatchHighlightsView
              highlights={highlights}
              onPlayAgain={onPlayAgain}
            />
          </div>
        )}

        {/* TAB 2: STATS & OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 mb-6 text-left">
            {/* TDM Team Score Card */}
            {isTDM && (
              <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                  playerTeam === 'blue' ? 'bg-blue-600/30 border-blue-400/70 text-blue-200' : 'bg-slate-900 border-slate-800 text-blue-400'
                }`}>
                  <Shield className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-[9px] font-bold uppercase">BLUE TEAM {playerTeam === 'blue' && '(YOU)'}</div>
                    <div className="text-lg font-mono font-black">{teamScores.blue}</div>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-slate-500">VS</div>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                  playerTeam === 'red' ? 'bg-red-600/30 border-red-400/70 text-red-200' : 'bg-slate-900 border-slate-800 text-red-400'
                }`}>
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase">{playerTeam === 'red' && '(YOU)'} RED TEAM</div>
                    <div className="text-lg font-mono font-black">{teamScores.red}</div>
                  </div>
                  <Flame className="w-4 h-4 text-red-400" />
                </div>
              </div>
            )}

            {/* Quick Teaser to Highlights */}
            {highlights.length > 0 && (
              <button
                onClick={() => setActiveTab('highlights')}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-amber-950/40 border border-amber-500/40 hover:border-amber-400 rounded-2xl transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                      <span>👑 TOP PLAY: {highlights[0].title}</span>
                      <span className="bg-amber-500/20 px-1.5 py-0.2 rounded text-[9px]">{highlights[0].badge}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      {highlights[0].killsCount} frags, {highlights[0].damageDealt} DMG in {highlights[0].durationSec}s — Click to inspect top 3 moments
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-amber-400 group-hover:translate-x-1 transition">
                  <span>REVIEW</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </button>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500">KILLS / DEATHS</span>
                <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">{kills} / {deaths}</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500">K/D RATIO</span>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{kd}</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500">HEADSHOTS</span>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{headshots}</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500">BEST STREAK</span>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{bestStreak}x</div>
              </div>
            </div>

            {/* Rewards Earned */}
            <div className="flex items-center justify-around p-3 bg-slate-950/90 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-cyan-300">+{xpEarned} XP</span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold text-amber-300">+{coinsEarned} Coins</span>
              </div>
            </div>

            {/* Social Sharing */}
            <div className="flex gap-2">
              <button
                onClick={handleShareTwitter}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-bold transition"
              >
                <Share2 className="w-4 h-4" />
                <span>SHARE ON X</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono font-bold transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED' : 'COPY RECAP'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Action Buttons (Always accessible) */}
        <div className="flex gap-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={onReturnToLobby}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-mono font-bold transition"
          >
            <Home className="w-4 h-4" />
            <span>LOBBY</span>
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl text-xs font-mono font-bold transition shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
