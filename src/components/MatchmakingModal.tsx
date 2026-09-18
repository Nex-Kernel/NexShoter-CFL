import React, { useState } from 'react';
import { GameMode, GameMap, GameSettings, PlayerTeam, WeatherType } from '../types';
import { DEFAULT_MAPS } from '../game/maps';
import { Swords, Users, ShieldAlert, Wifi, WifiOff, Globe, Play, Copy, Check, Shield, Flame, CloudRain, Sun, Wind, Snowflake, Sparkles, Shuffle } from 'lucide-react';

interface MatchmakingModalProps {
  settings: GameSettings;
  customMaps: GameMap[];
  onStartMatch: (map: GameMap, mode: GameMode, isOffline: boolean, team?: PlayerTeam, weather?: WeatherType | 'random') => void;
  onUpdateSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  settings,
  customMaps,
  onStartMatch,
  onUpdateSettings,
  onClose
}) => {
  const [matchType, setMatchType] = useState<'quick' | 'ranked' | 'custom'>('quick');
  const [selectedMapId, setSelectedMapId] = useState<string>(DEFAULT_MAPS[0].id);
  const [selectedMode, setSelectedMode] = useState<GameMode>('ffa');
  const [selectedTeam, setSelectedTeam] = useState<PlayerTeam>('blue');
  const [selectedWeather, setSelectedWeather] = useState<WeatherType | 'random'>('random');
  const [roomCode, setRoomCode] = useState('ARENA-782');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const allMaps = [...DEFAULT_MAPS, ...customMaps];
  const activeMap = allMaps.find(m => m.id === selectedMapId) || DEFAULT_MAPS[0];

  const handleLaunch = () => {
    if (matchType === 'quick') {
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        onStartMatch(activeMap, selectedMode, settings.offlineMode, selectedTeam, selectedWeather);
      }, 800);
    } else {
      onStartMatch(activeMap, selectedMode, settings.offlineMode, selectedTeam, selectedWeather);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div id="matchmaking-modal" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">ARENA MATCHMAKING & LOBBIES</h1>
            <p className="text-xs text-slate-400">Low-latency cross-platform matchmaking & custom lobbies</p>
          </div>
        </div>

        {/* Offline Mode Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdateSettings({ ...settings, offlineMode: !settings.offlineMode })}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition ${
              settings.offlineMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {settings.offlineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            <span>{settings.offlineMode ? 'OFFLINE MODE (ACTIVE)' : 'ONLINE LOBBY (18ms)'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono font-bold transition"
          >
            RETURN
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Matchmaking Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setMatchType('quick')}
              className={`p-6 rounded-3xl border cursor-pointer transition flex flex-col justify-between ${
                matchType === 'quick'
                  ? 'bg-slate-900/90 border-emerald-400 shadow-xl shadow-emerald-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Swords className="w-6 h-6 text-emerald-400" />
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                    INSTANT PLAY
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-white">QUICK MATCH</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Jump into high-speed action instantly with nearest ping matchmakers and intelligent bot backfill.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-6 pt-3 border-t border-slate-800">
                Avg. Queue Time: &lt; 2s
              </div>
            </div>

            <div
              onClick={() => setMatchType('ranked')}
              className={`p-6 rounded-3xl border cursor-pointer transition flex flex-col justify-between ${
                matchType === 'ranked'
                  ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <ShieldAlert className="w-6 h-6 text-cyan-400" />
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold">
                    COMPETITIVE
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-white">RANKED ARENA</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Compete for global leaderboard prestige, ELO ranking points, and exclusive season badges.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-6 pt-3 border-t border-slate-800">
                Tier: Platinum Division
              </div>
            </div>

            <div
              onClick={() => setMatchType('custom')}
              className={`p-6 rounded-3xl border cursor-pointer transition flex flex-col justify-between ${
                matchType === 'custom'
                  ? 'bg-slate-900/90 border-purple-400 shadow-xl shadow-purple-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-6 h-6 text-purple-400" />
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold">
                    CUSTOM LOBBY
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-white">CUSTOM ROOM</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Host custom matches with friends, select community maps, tweak movement rules, and share room code.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-6 pt-3 border-t border-slate-800">
                Direct Invitation Code
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">MATCH CONFIGURATION</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Map Selection */}
              <div>
                <label className="text-xs font-mono text-slate-400 mb-2 block">SELECT MAP</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allMaps.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMapId(m.id)}
                      className={`p-3 rounded-2xl border cursor-pointer text-xs font-mono transition flex flex-col justify-between ${
                        selectedMapId === m.id
                          ? 'bg-slate-950 border-cyan-400 text-white shadow'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{m.name}</span>
                          {m.weather && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] uppercase font-bold text-amber-300">
                              {m.weather === 'storm' ? '⛈️ Storm' : m.weather === 'sandstorm' ? '🌪️ Desert' : m.weather === 'snow' ? '❄️ Snow' : m.weather === 'cyber_fog' ? '🌆 Smog' : '☀️ Clear'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">By {m.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Mode */}
              <div>
                <label className="text-xs font-mono text-slate-400 mb-2 block">GAME MODE</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { mode: 'ffa', label: 'Free For All', desc: 'Solo deathmatch' },
                    { mode: 'tdm', label: 'Team Deathmatch', desc: 'Red vs Blue' },
                    { mode: 'parkour', label: 'Parkour Sprint', desc: 'Speed course' },
                    { mode: 'gungame', label: 'Gun Game', desc: 'Weapon cycling' }
                  ].map((g) => (
                    <div
                      key={g.mode}
                      onClick={() => setSelectedMode(g.mode as GameMode)}
                      className={`p-3 rounded-2xl border cursor-pointer text-xs font-mono transition ${
                        selectedMode === g.mode
                          ? 'bg-slate-950 border-cyan-400 text-white shadow'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-slate-200">{g.label}</div>
                      <div className="text-[10px] text-slate-500">{g.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Team Selection Toggle for TDM */}
                {selectedMode === 'tdm' && (
                  <div className="mt-4 p-3 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                        CHOOSE TEAM (RED / BLUE)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">3v3 Squads</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTeam('blue')}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-mono font-bold transition ${
                          selectedTeam === 'blue'
                            ? 'bg-blue-600/30 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400 flex items-center justify-center">
                          <Shield className="w-3 h-3 text-blue-300 fill-blue-300/40" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-blue-300">BLUE TEAM</div>
                          <div className="text-[9px] text-blue-400/80 font-normal">Azure Vanguard</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTeam('red')}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-mono font-bold transition ${
                          selectedTeam === 'red'
                            ? 'bg-red-600/30 border-red-400 text-red-200 shadow-md shadow-red-500/20'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-red-500/30 border border-red-400 flex items-center justify-center">
                          <Flame className="w-3 h-3 text-red-300 fill-red-300/40" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-red-300">RED TEAM</div>
                          <div className="text-[9px] text-red-400/80 font-normal">Crimson Legion</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {matchType === 'custom' && (
                  <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block">FRIENDS ROOM CODE</span>
                      <span className="font-mono font-bold text-cyan-300 text-sm">{roomCode}</span>
                    </div>
                    <button
                      onClick={copyRoomCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono transition"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Weather Atmosphere Selector */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ENVIRONMENTAL WEATHER SYSTEM</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">Dynamic lighting, fog & precipitation</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { type: 'random', label: 'Random', icon: Shuffle, desc: 'Rotating per match', color: 'text-amber-400' },
                  { type: 'clear', label: 'Clear Sky', icon: Sun, desc: 'High noon sun', color: 'text-yellow-400' },
                  { type: 'storm', label: 'Storm', icon: CloudRain, desc: 'Thunder & rain', color: 'text-blue-400' },
                  { type: 'sandstorm', label: 'Sandstorm', icon: Wind, desc: 'Dust & low vis', color: 'text-orange-400' },
                  { type: 'snow', label: 'Blizzard', icon: Snowflake, desc: 'Sub-zero snow', color: 'text-sky-300' },
                  { type: 'cyber_fog', label: 'Neon Smog', icon: Sparkles, desc: 'Cyberpunk mist', color: 'text-pink-400' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedWeather === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedWeather(item.type as any)}
                      className={`p-2.5 rounded-xl border text-left font-mono transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-950 border-emerald-400 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <div className="mt-2">
                        <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {item.label}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-400">
                {settings.offlineMode ? (
                  <span className="text-amber-400 font-bold">⚡ Offline Local Match (Bots enabled)</span>
                ) : (
                  <span className="text-emerald-400 font-bold">● Connected to Global Match Cluster</span>
                )}
              </div>

              <button
                onClick={handleLaunch}
                disabled={isSearching}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isSearching ? 'FINDING SERVERS...' : 'DEPLOY TO ARENA'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
