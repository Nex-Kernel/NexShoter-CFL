import React from 'react';
import { CrosshairSettings, WeaponConfig, KillFeedItem, GameMode, PlayerTeam, TeamScores, WeatherInfo } from '../types';
import { Shield, Heart, Zap, Crosshair, Volume2, Mic, MicOff, RefreshCw, Flame, CloudSun, CloudRain, Wind, Snowflake, Sparkles } from 'lucide-react';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapon: WeaponConfig;
  ammo: number;
  isReloading: boolean;
  reloadProgress: number;
  isAiming: boolean;
  isSliding: boolean;
  isWallRunning: boolean;
  speedBoostTimer: number;
  momentumMultiplier: number;
  hitmarkerActive: boolean;
  hitmarkerIsHeadshot: boolean;
  damageVignette: number;
  damageDirectionAngle: number | null;
  kills: number;
  deaths: number;
  killstreak: number;
  matchTimer: number;
  killFeed: KillFeedItem[];
  crosshair: CrosshairSettings;
  isVoiceActive: boolean;
  isPttPressed: boolean;
  voiceSpeakers: string[];
  isLocked: boolean;
  gameMode?: GameMode;
  playerTeam?: PlayerTeam;
  teamScores?: TeamScores;
  teamTargetScore?: number;
  weather?: WeatherInfo;
  isInspecting?: boolean;
  weaponSkinName?: string;
  onLockClick: () => void;
  onMobileFire?: () => void;
  onMobileJump?: () => void;
  onMobileSlide?: () => void;
  onMobileReload?: () => void;
  onMobileAim?: () => void;
  onMobileInspect?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  health,
  maxHealth,
  shield,
  maxShield,
  weapon,
  ammo,
  isReloading,
  reloadProgress,
  isAiming,
  isSliding,
  isWallRunning,
  speedBoostTimer,
  momentumMultiplier,
  hitmarkerActive,
  hitmarkerIsHeadshot,
  damageVignette,
  damageDirectionAngle,
  kills,
  deaths,
  killstreak,
  matchTimer,
  killFeed,
  crosshair,
  isVoiceActive,
  isPttPressed,
  voiceSpeakers,
  isLocked,
  gameMode = 'ffa',
  playerTeam = 'blue',
  teamScores = { red: 0, blue: 0 },
  teamTargetScore = 25,
  weather,
  isInspecting = false,
  weaponSkinName,
  onLockClick,
  onMobileFire,
  onMobileJump,
  onMobileSlide,
  onMobileReload,
  onMobileAim,
  onMobileInspect,
}) => {
  const formatTimer = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.floor(Math.max(0, seconds) % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const shieldPct = Math.max(0, Math.min(100, (shield / maxShield) * 100));

  // Dynamic spread offset for crosshair
  const spreadOffset = crosshair.dynamicSpread
    ? (isSliding ? 14 : isWallRunning ? 10 : isAiming ? -2 : 0)
    : 0;
  const gap = Math.max(2, crosshair.gap + spreadOffset);

  const isTDM = gameMode === 'tdm';

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Red Damage Vignette */}
      {damageVignette > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-75"
          style={{
            boxShadow: `inset 0 0 100px 35px rgba(239, 68, 68, ${damageVignette * 0.7})`,
            opacity: damageVignette
          }}
        />
      )}

      {/* Speed Boost Warp Lines */}
      {speedBoostTimer > 0 && (
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(16,185,129,0.3)_100%)] animate-pulse" />
      )}

      {/* Top Header: Timer, Match Score / Team Score, Killstreak */}
      {isTDM ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-5 py-2 rounded-2xl border border-slate-700/80 shadow-2xl">
          {/* Blue Team Score */}
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition ${
            playerTeam === 'blue'
              ? 'bg-blue-600/30 border-blue-400/80 text-blue-200 ring-1 ring-blue-500/50'
              : 'bg-blue-950/40 border-blue-900/50 text-blue-300'
          }`}>
            <Shield className="w-4 h-4 text-blue-400 fill-blue-400/30" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-wide uppercase text-blue-300">BLUE</span>
                {playerTeam === 'blue' && (
                  <span className="px-1 py-0.2 rounded bg-blue-500 text-slate-950 text-[8px] font-bold">YOU</span>
                )}
              </div>
              <div className="text-xl font-mono font-black text-blue-300 leading-none">{teamScores.blue}</div>
            </div>
          </div>

          {/* Center Target & Timer */}
          <div className="flex flex-col items-center px-2">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              FIRST TO {teamTargetScore}
            </span>
            <span className="text-lg font-mono font-bold text-amber-400">{formatTimer(matchTimer)}</span>
            <div className="text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">{kills}K</span> / <span className="text-rose-400 font-bold">{deaths}D</span>
            </div>
          </div>

          {/* Red Team Score */}
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition ${
            playerTeam === 'red'
              ? 'bg-red-600/30 border-red-400/80 text-red-200 ring-1 ring-red-500/50'
              : 'bg-red-950/40 border-red-900/50 text-red-300'
          }`}>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {playerTeam === 'red' && (
                  <span className="px-1 py-0.2 rounded bg-red-500 text-slate-950 text-[8px] font-bold">YOU</span>
                )}
                <span className="text-[10px] font-bold tracking-wide uppercase text-red-300">RED</span>
              </div>
              <div className="text-xl font-mono font-black text-red-300 leading-none">{teamScores.red}</div>
            </div>
            <Flame className="w-4 h-4 text-red-400 fill-red-400/30" />
          </div>

          {killstreak >= 2 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded-lg animate-pulse ml-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-bold text-amber-300 uppercase">{killstreak}x</span>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700/60 shadow-lg">
          <div className="text-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Time Left</div>
            <div className="text-xl font-mono font-bold text-amber-400">{formatTimer(matchTimer)}</div>
          </div>
          <div className="h-7 w-px bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-xs text-slate-400 font-bold">KILLS</span>
              <div className="text-lg font-bold text-emerald-400">{kills}</div>
            </div>
            <div className="text-slate-600 font-bold">/</div>
            <div className="text-center">
              <span className="text-xs text-slate-400 font-bold">DEATHS</span>
              <div className="text-lg font-bold text-rose-400">{deaths}</div>
            </div>
          </div>
          {killstreak >= 2 && (
            <>
              <div className="h-7 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 rounded-md animate-pulse">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase">{killstreak}x STREAK</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dynamic Weather & Atmospheric Conditions Badge */}
      {weather && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1 rounded-full border border-slate-700/60 shadow-lg text-[11px] font-mono pointer-events-none">
          {weather.type === 'storm' && <CloudRain className="w-3.5 h-3.5 text-blue-400 animate-pulse" />}
          {weather.type === 'sandstorm' && <Wind className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />}
          {weather.type === 'snow' && <Snowflake className="w-3.5 h-3.5 text-sky-300 animate-spin" style={{ animationDuration: '8s' }} />}
          {weather.type === 'cyber_fog' && <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />}
          {weather.type === 'clear' && <CloudSun className="w-3.5 h-3.5 text-amber-300" />}

          <span className="font-bold text-slate-200 tracking-wide uppercase">{weather.name}</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 font-medium hidden sm:inline">{weather.condition}</span>
        </div>
      )}

      {/* Top Left: Voice Comms & Team Assignment Badge */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {isTDM && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md text-xs font-mono font-bold shadow ${
            playerTeam === 'blue'
              ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
              : 'bg-red-950/80 border-red-500/60 text-red-300'
          }`}>
            {playerTeam === 'blue' ? (
              <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400/40" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400/40" />
            )}
            <span>ASSIGNED: {playerTeam === 'blue' ? 'BLUE VANGUARD' : 'RED LEGION'}</span>
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-800">
          {isPttPressed ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <Mic className="w-4 h-4 animate-bounce" />
              <span className="text-xs font-bold font-mono tracking-wide uppercase">VOICE: BROADCASTING [V]</span>
            </div>
          ) : isVoiceActive ? (
            <div className="flex items-center gap-2 text-slate-300">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono">RADIO COMMS ACTIVE (HOLD V)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <MicOff className="w-4 h-4" />
              <span className="text-xs font-mono">RADIO MUTED</span>
            </div>
          )}
        </div>

        {/* Live Active Speakers list */}
        {voiceSpeakers.length > 0 && (
          <div className="flex flex-col gap-1">
            {voiceSpeakers.map((speaker, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1 rounded border border-emerald-500/40 text-xs font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{speaker}</span>
                <span className="text-[10px] text-emerald-500 ml-auto">96kbps</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Right: Kill Feed */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end max-w-xs">
        {killFeed.map((item) => {
          const killerColor = item.killerTeam === 'blue'
            ? 'text-blue-400 font-bold'
            : item.killerTeam === 'red'
            ? 'text-red-400 font-bold'
            : item.killer === 'You' || item.killer === 'You (Offline)'
            ? 'text-cyan-400 font-bold'
            : 'text-slate-300';

          const victimColor = item.victimTeam === 'blue'
            ? 'text-blue-400'
            : item.victimTeam === 'red'
            ? 'text-red-400'
            : item.victim === 'You'
            ? 'text-rose-400 font-bold'
            : 'text-slate-400';

          return (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-md border border-slate-800 text-xs font-mono shadow-md animate-in slide-in-from-right-4 duration-200"
            >
              {item.killerTeam && (
                <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                  item.killerTeam === 'blue' ? 'bg-blue-600/30 text-blue-300' : 'bg-red-600/30 text-red-300'
                }`}>
                  {item.killerTeam === 'blue' ? 'BLU' : 'RED'}
                </span>
              )}
              <span className={killerColor}>
                {item.killer}
              </span>
              <span className="text-slate-500 text-[10px]">[{item.weapon}]</span>
              {item.headshot && (
                <span className="px-1 py-0.5 bg-amber-500/30 text-amber-300 rounded text-[9px] font-bold">
                  HEADSHOT
                </span>
              )}
              <span className="text-rose-500">➔</span>
              {item.victimTeam && (
                <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                  item.victimTeam === 'blue' ? 'bg-blue-600/30 text-blue-300' : 'bg-red-600/30 text-red-300'
                }`}>
                  {item.victimTeam === 'blue' ? 'BLU' : 'RED'}
                </span>
              )}
              <span className={victimColor}>
                {item.victim}
              </span>
            </div>
          );
        })}
      </div>

      {/* Center Reticle / Crosshair */}
      {!isAiming && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {/* Custom Crosshair Bars */}
          {/* Top */}
          <div
            className="absolute -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: crosshair.color,
              width: `${crosshair.thickness}px`,
              height: `${crosshair.size}px`,
              bottom: `${gap}px`,
              left: '0px'
            }}
          />
          {/* Bottom */}
          <div
            className="absolute -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: crosshair.color,
              width: `${crosshair.thickness}px`,
              height: `${crosshair.size}px`,
              top: `${gap}px`,
              left: '0px'
            }}
          />
          {/* Left */}
          <div
            className="absolute -translate-y-1/2 rounded-full"
            style={{
              backgroundColor: crosshair.color,
              width: `${crosshair.size}px`,
              height: `${crosshair.thickness}px`,
              right: `${gap}px`,
              top: '0px'
            }}
          />
          {/* Right */}
          <div
            className="absolute -translate-y-1/2 rounded-full"
            style={{
              backgroundColor: crosshair.color,
              width: `${crosshair.size}px`,
              height: `${crosshair.thickness}px`,
              left: `${gap}px`,
              top: '0px'
            }}
          />
          {/* Center Dot */}
          {crosshair.dot && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                backgroundColor: crosshair.color,
                width: `${crosshair.thickness + 2}px`,
                height: `${crosshair.thickness + 2}px`
              }}
            />
          )}

          {/* Hitmarker X Animation */}
          {hitmarkerActive && (
            <div className="absolute -translate-x-1/2 -translate-y-1/2 scale-125 animate-in zoom-in-75 duration-75">
              <div
                className={`w-6 h-6 border-2 transform rotate-45 ${
                  hitmarkerIsHeadshot ? 'border-amber-400 shadow-[0_0_8px_#f59e0b]' : 'border-red-500'
                }`}
                style={{
                  clipPath: 'polygon(0 0, 30% 0, 30% 30%, 70% 30%, 70% 0, 100% 0, 100% 30%, 70% 30%, 70% 70%, 100% 70%, 100% 100%, 70% 100%, 70% 70%, 30% 70%, 30% 100%, 0 100%, 0 70%, 30% 70%, 30% 30%, 0 30%)'
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Sniper ADS Scope Overlay */}
      {isAiming && weapon.id === 'sniper' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/40">
          <div className="w-[500px] h-[500px] max-w-full max-h-full rounded-full border-2 border-emerald-500/70 relative overflow-hidden bg-slate-950/20 backdrop-blur-[1px] shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-400" />
            <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-400" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-emerald-400 rounded-full" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-400">
              RANGE: 120M
            </div>
          </div>
        </div>
      )}

      {/* Parkour Movement Indicators (Center-Bottom) */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {isSliding && (
          <div className="px-3 py-1 bg-amber-500/20 border border-amber-400/70 text-amber-300 font-mono text-xs font-bold rounded-full tracking-wider animate-bounce shadow-lg">
            ⚡ SLIDING [BOOST]
          </div>
        )}
        {isWallRunning && (
          <div className="px-3 py-1 bg-purple-500/20 border border-purple-400/70 text-purple-300 font-mono text-xs font-bold rounded-full tracking-wider animate-pulse shadow-lg">
            🧗 WALL RUN [JUMP TO KICK]
          </div>
        )}
        {speedBoostTimer > 0 && (
          <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/70 text-emerald-300 font-mono text-xs font-bold rounded-full tracking-wider shadow-lg">
            🚀 HYPER SPEED ({speedBoostTimer.toFixed(1)}s)
          </div>
        )}
        {momentumMultiplier > 1.1 && !isSliding && (
          <div className="px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-mono text-[11px] font-semibold rounded-full">
            MOMENTUM x{momentumMultiplier.toFixed(2)}
          </div>
        )}
      </div>

      {/* Bottom Left: Health, Shield & Character Info */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 min-w-[240px]">
        {/* Shield Bar */}
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <div className="flex-1 bg-slate-900/80 rounded-full h-3.5 border border-cyan-950 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-150"
              style={{ width: `${shieldPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 w-8 text-right">{shield}</span>
        </div>

        {/* Health Bar */}
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/40" />
          <div className="flex-1 bg-slate-900/80 rounded-full h-4 border border-rose-950 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                healthPct < 30 ? 'bg-rose-600 animate-pulse' : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${healthPct}%` }}
            />
          </div>
          <span className="text-sm font-mono font-bold text-rose-400 w-8 text-right">{health}</span>
        </div>
      </div>

      {/* Bottom Right: Weapon & Ammo Display */}
      <div className="absolute bottom-6 right-6 flex items-end gap-4 bg-slate-900/85 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/60 shadow-xl">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-bold">
            <span>{weapon.name}</span>
            {weaponSkinName && (
              <span className="text-cyan-400 font-normal lowercase tracking-normal bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/50">
                {weaponSkinName}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-mono font-bold ${ammo <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
              {ammo}
            </span>
            <span className="text-slate-500 font-mono text-lg">/ {weapon.magSize}</span>
          </div>
          {isInspecting ? (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-bold mt-1 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INSPECTING SKIN...</span>
            </div>
          ) : isReloading ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold mt-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>RELOADING... ({Math.floor(reloadProgress * 100)}%)</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
              <span className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">I</span> Inspect Skin
            </div>
          )}
        </div>
      </div>

      {/* Click to Play / Pointer Lock Prompt */}
      {!isLocked && (
        <div
          onClick={onLockClick}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto flex items-center justify-center cursor-pointer transition-all"
        >
          <div className="text-center p-8 bg-slate-900/90 border border-cyan-500/40 rounded-3xl max-w-md shadow-2xl hover:border-cyan-400">
            <Crosshair className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <h2 className="text-2xl font-bold font-heading text-white tracking-wide mb-1">CLICK TO PLAY</h2>
            <p className="text-slate-400 text-sm mb-4">Click anywhere on the screen to lock cursor and aim.</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 text-left bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div><strong className="text-cyan-400">WASD:</strong> Movement</div>
              <div><strong className="text-cyan-400">SPACE:</strong> Jump / Wall-Kick</div>
              <div><strong className="text-cyan-400">C / CTRL:</strong> Slide Boost</div>
              <div><strong className="text-cyan-400">L-CLICK:</strong> Fire Weapon</div>
              <div><strong className="text-cyan-400">R-CLICK:</strong> Aim Down Sights</div>
              <div><strong className="text-cyan-400">R:</strong> Reload Weapon</div>
              <div><strong className="text-cyan-400">I:</strong> Inspect Weapon Skin</div>
              <div><strong className="text-cyan-400">V:</strong> Push-to-Talk Comms</div>
              <div><strong className="text-cyan-400">ESC:</strong> Open Menu</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Touch Controls for Tablets / Phones */}
      <div className="md:hidden pointer-events-auto absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="flex gap-2">
          <button
            onClick={onMobileSlide}
            className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 active:bg-amber-500/50 text-white font-bold text-xs flex items-center justify-center"
          >
            SLIDE
          </button>
          <button
            onClick={onMobileJump}
            className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 active:bg-cyan-500/50 text-white font-bold text-xs flex items-center justify-center"
          >
            JUMP
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onMobileInspect}
            className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 active:bg-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center justify-center"
            title="Inspect Skin"
          >
            INSP
          </button>
          <button
            onClick={onMobileReload}
            className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 active:bg-slate-600 text-white font-bold text-xs flex items-center justify-center"
          >
            REL
          </button>
          <button
            onClick={onMobileAim}
            className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 active:bg-indigo-500/50 text-white font-bold text-xs flex items-center justify-center"
          >
            ADS
          </button>
          <button
            onClick={onMobileFire}
            className="w-16 h-16 rounded-full bg-rose-600/90 border border-rose-400 active:scale-95 text-white font-bold text-sm shadow-lg flex items-center justify-center"
          >
            FIRE
          </button>
        </div>
      </div>
    </div>
  );
};
