/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameMap, GameMode, PlayerTeam, PlayerLoadout, GameSettings, PlayerStats, DailyChallenge, Achievement, WeaponConfig, WeatherType, WeatherInfo, MatchHighlight } from './types';
import { DEFAULT_MAPS } from './game/maps';
import { DEFAULT_LOADOUT, DEFAULT_SETTINGS, DEFAULT_STATS, INITIAL_CHALLENGES, INITIAL_ACHIEVEMENTS, WEAPONS, WEAPON_SKINS } from './data/constants';
import { FPSGameEngine } from './game/engine';
import { sound } from './game/audio';

import { GameHUD } from './components/GameHUD';
import { LoadoutMenu } from './components/LoadoutMenu';
import { ShopMenu } from './components/ShopMenu';
import { LeaderboardMenu } from './components/LeaderboardMenu';
import { DailyChallengesMenu } from './components/DailyChallengesMenu';
import { VoiceChatModal } from './components/VoiceChatModal';
import { ProfileModal } from './components/ProfileModal';
import { MapEditor } from './components/MapEditor';
import { MatchmakingModal } from './components/MatchmakingModal';
import { GameOverModal } from './components/GameOverModal';
import { AuthModal } from './components/AuthModal';

import { auth, onAuthStateChanged, syncUserDataToCloud, loadUserDataFromCloud, FirebaseUser } from './firebase';

import { Swords, Target, ShoppingBag, Box, Calendar, Trophy, Radio, User, Play, Wifi, WifiOff, Volume2, Moon, Sun, Flame, Zap, Shield, Sparkles, LogIn, Cloud } from 'lucide-react';

export default function App() {
  // Persistence Loading
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem('vengestrike_stats');
      return saved ? JSON.parse(saved) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const [loadout, setLoadout] = useState<PlayerLoadout>(() => {
    try {
      const saved = localStorage.getItem('vengestrike_loadout');
      return saved ? JSON.parse(saved) : DEFAULT_LOADOUT;
    } catch {
      return DEFAULT_LOADOUT;
    }
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('vengestrike_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [challenges, setChallenges] = useState<DailyChallenge[]>(() => {
    try {
      const saved = localStorage.getItem('vengestrike_challenges');
      return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
    } catch {
      return INITIAL_CHALLENGES;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem('vengestrike_achievements');
      return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  });

  const [customMaps, setCustomMaps] = useState<GameMap[]>(() => {
    try {
      const saved = localStorage.getItem('vengestrike_custom_maps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation / Modal States
  type ActiveModal = 'none' | 'auth' | 'matchmaking' | 'loadout' | 'shop' | 'leaderboards' | 'challenges' | 'voice' | 'profile' | 'map_editor';
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [gameState, setGameState] = useState<'lobby' | 'in_game'>('lobby');

  // Firebase Auth & Cloud Account State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Match State
  const [currentMap, setCurrentMap] = useState<GameMap>(DEFAULT_MAPS[0]);
  const [currentMode, setCurrentMode] = useState<GameMode>('ffa');
  const [currentTeam, setCurrentTeam] = useState<PlayerTeam>('blue');
  const [isMatchOver, setIsMatchOver] = useState(false);
  const [matchWinner, setMatchWinner] = useState('You');
  const [matchHighlights, setMatchHighlights] = useState<MatchHighlight[]>([]);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [showInGamePause, setShowInGamePause] = useState(false);

  // HUD Real-time Values
  const [hudData, setHudData] = useState({
    health: 100,
    maxHealth: 100,
    shield: 50,
    maxShield: 50,
    ammo: 30,
    isReloading: false,
    reloadProgress: 0,
    isAiming: false,
    isSliding: false,
    isWallRunning: false,
    speedBoostTimer: 0,
    momentumMultiplier: 1.0,
    hitmarkerActive: false,
    hitmarkerIsHeadshot: false,
    damageVignette: 0,
    damageDirectionAngle: null as number | null,
    kills: 0,
    deaths: 0,
    killstreak: 0,
    matchTimer: 300,
    killFeed: [] as any[],
    teamScores: { red: 0, blue: 0 },
    weather: undefined as WeatherInfo | undefined,
    isInspecting: false
  });

  const [isPttPressed, setIsPttPressed] = useState(false);

  // 3D Canvas & Engine references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FPSGameEngine | null>(null);

  // Save to localStorage when state changes and sync to cloud if logged in
  useEffect(() => {
    localStorage.setItem('vengestrike_stats', JSON.stringify(stats));
    if (currentUser) {
      const timer = setTimeout(() => {
        syncUserDataToCloud(currentUser, stats, loadout).catch((err) => {
          console.error('Cloud auto-sync failed:', err);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stats, currentUser]);

  useEffect(() => {
    localStorage.setItem('vengestrike_loadout', JSON.stringify(loadout));
    if (currentUser) {
      const timer = setTimeout(() => {
        syncUserDataToCloud(currentUser, stats, loadout).catch((err) => {
          console.error('Cloud auto-sync failed:', err);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loadout, currentUser]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudData = await loadUserDataFromCloud(user.uid);
          if (cloudData && cloudData.stats) {
            setStats(cloudData.stats);
            if (cloudData.loadout) {
              setLoadout(cloudData.loadout);
            }
          } else {
            // First time auth detected without existing profile, sync current local state to cloud
            const syncedStats = {
              ...stats,
              username: user.displayName || stats.username
            };
            setStats(syncedStats);
            await syncUserDataToCloud(user, syncedStats, loadout);
          }
        } catch (err) {
          console.error('Failed to load cloud profile:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('vengestrike_settings', JSON.stringify(settings));
    sound.setVolumes(settings.masterVolume, settings.sfxVolume);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('vengestrike_challenges', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('vengestrike_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('vengestrike_custom_maps', JSON.stringify(customMaps));
  }, [customMaps]);

  // Voice Chat Push-to-Talk key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyV' && !isPttPressed && settings.voiceChatEnabled) {
        setIsPttPressed(true);
        sound.playRadioClick(true);
      }
      if (e.code === 'Escape' && gameState === 'in_game') {
        setShowInGamePause((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyV' && isPttPressed) {
        setIsPttPressed(false);
        sound.playRadioClick(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPttPressed, settings.voiceChatEnabled, gameState]);

  // Pointerlock tracking
  useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === canvasRef.current);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  // Initialize Game Engine when entering match
  const startMatch = (
    map: GameMap,
    mode: GameMode = 'ffa',
    isOffline: boolean = false,
    team: PlayerTeam = 'blue',
    weather?: WeatherType | 'random'
  ) => {
    setCurrentMap(map);
    setCurrentMode(mode);
    setCurrentTeam(team);
    setIsMatchOver(false);
    setMatchHighlights([]);
    setShowInGamePause(false);
    setActiveModal('none');
    setGameState('in_game');

    // Canvas will be mounted in DOM
    setTimeout(() => {
      if (!canvasRef.current) return;
      if (engineRef.current) {
        engineRef.current.stop();
      }

      const engine = new FPSGameEngine(canvasRef.current, map, loadout, settings, mode, team, weather);
      engineRef.current = engine;

      engine.onStateUpdate = () => {
        setHudData({
          health: engine.playerHealth,
          maxHealth: engine.maxPlayerHealth,
          shield: engine.playerShield,
          maxShield: engine.maxPlayerShield,
          ammo: engine.currentAmmo,
          isReloading: engine.isReloading,
          reloadProgress: engine.reloadProgress,
          isAiming: engine.isAiming,
          isSliding: engine.isSliding,
          isWallRunning: engine.isWallRunning,
          speedBoostTimer: engine.speedBoostTimer,
          momentumMultiplier: engine.momentumMultiplier,
          hitmarkerActive: engine.hitmarkerActive,
          hitmarkerIsHeadshot: engine.hitmarkerIsHeadshot,
          damageVignette: engine.damageVignetteTimer,
          damageDirectionAngle: engine.damageDirectionAngle,
          kills: engine.playerKills,
          deaths: engine.playerDeaths,
          killstreak: engine.killstreak,
          matchTimer: engine.matchTimer,
          killFeed: [...engine.killFeed],
          teamScores: { ...engine.teamScores },
          weather: engine.weather,
          isInspecting: engine.isInspecting
        });
      };

      engine.onKill = (victim, isHeadshot, weapon) => {
        // Update stats
        setStats((prev) => {
          const newKills = prev.kills + 1;
          const newHeadshots = isHeadshot ? prev.headshots + 1 : prev.headshots;
          const newSlideKills = engine.isSliding ? prev.slideKills + 1 : prev.slideKills;
          const newStreak = Math.max(prev.bestStreak, engine.killstreak);
          const newCoins = prev.coins + (isHeadshot ? 35 : 20);
          const newXp = prev.xp + 100;
          const newLevel = Math.floor(newXp / 1000) + 1;

          return {
            ...prev,
            kills: newKills,
            headshots: newHeadshots,
            slideKills: newSlideKills,
            bestStreak: newStreak,
            coins: newCoins,
            xp: newXp,
            level: newLevel
          };
        });

        // Update Daily Challenges progress
        setChallenges((prev) =>
          prev.map((ch) => {
            if (ch.id === 'ch_headshots' && isHeadshot) {
              return { ...ch, progress: Math.min(ch.target, ch.progress + 1) };
            }
            if (ch.id === 'ch_slide_kills' && engine.isSliding) {
              return { ...ch, progress: Math.min(ch.target, ch.progress + 1) };
            }
            return ch;
          })
        );
      };

      engine.onPlayerDeath = (killer) => {
        setStats((prev) => ({
          ...prev,
          deaths: prev.deaths + 1
        }));
      };

      // Anti-cheat telemetry listener: captures velocity & snap-aim anomalies into stats for moderation
      engine.onAntiCheatAnomaly = (anomaly) => {
        setStats((prev) => {
          const prevAnomalies = prev.antiCheatAnomalies || [];
          const updatedAnomalies = [anomaly, ...prevAnomalies].slice(0, 50);

          const isVelocity =
            anomaly.type === 'suspicious_velocity' ||
            anomaly.type === 'speed_hack' ||
            anomaly.type === 'teleportation';
          const isSnapAim = anomaly.type === 'snap_aim_anomaly';

          const prevSummary = prev.antiCheatSummary || {
            trustScore: 100,
            totalAnomalies: 0,
            velocityFlags: 0,
            snapAimFlags: 0,
            lastFlaggedTimestamp: null,
            status: 'clean'
          };

          const totalAnomalies = (prevSummary.totalAnomalies || 0) + 1;
          const velocityFlags = (prevSummary.velocityFlags || 0) + (isVelocity ? 1 : 0);
          const snapAimFlags = (prevSummary.snapAimFlags || 0) + (isSnapAim ? 1 : 0);

          const penalty = anomaly.severity === 'critical' ? 25 : anomaly.severity === 'suspicious' ? 12 : 5;
          const trustScore = Math.max(0, Math.min(100, (prevSummary.trustScore ?? 100) - penalty));

          let status: 'clean' | 'flagged_for_review' | 'suspicious' | 'under_investigation' = 'clean';
          if (trustScore < 40 || totalAnomalies >= 6) {
            status = 'under_investigation';
          } else if (trustScore < 70 || totalAnomalies >= 3) {
            status = 'suspicious';
          } else if (totalAnomalies >= 1) {
            status = 'flagged_for_review';
          }

          return {
            ...prev,
            antiCheatAnomalies: updatedAnomalies,
            antiCheatSummary: {
              trustScore,
              totalAnomalies,
              velocityFlags,
              snapAimFlags,
              lastFlaggedTimestamp: anomaly.timestamp,
              status
            }
          };
        });
      };

      engine.onMatchEnd = (winner, highlights) => {
        setMatchWinner(winner);
        const resolvedHighlights = highlights && highlights.length > 0 ? highlights : (engine.getMatchHighlights?.() || []);
        setMatchHighlights(resolvedHighlights);
        setIsMatchOver(true);
        const didWin = mode === 'tdm'
          ? (winner === 'Blue Team' && team === 'blue') || (winner === 'Red Team' && team === 'red')
          : winner === 'You';

        setStats((prev) => ({
          ...prev,
          matchesPlayed: prev.matchesPlayed + 1,
          wins: didWin ? prev.wins + 1 : prev.wins,
          wallRunMeters: prev.wallRunMeters + engine.parkourDistanceMeters
        }));
      };
    }, 50);
  };

  const handleReturnToLobby = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setGameState('lobby');
    setIsMatchOver(false);
    setShowInGamePause(false);
  };

  const handleClaimChallenge = (id: string) => {
    const ch = challenges.find((c) => c.id === id);
    if (!ch) return;

    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, claimed: true } : c))
    );
    setStats((prev) => ({
      ...prev,
      coins: prev.coins + ch.rewardCoins,
      xp: prev.xp + ch.rewardXp,
      level: Math.floor((prev.xp + ch.rewardXp) / 1000) + 1
    }));
  };

  const handlePurchaseSkin = (skin: any, type: 'char' | 'weapon') => {
    if (skin.currency === 'coins') {
      if (stats.coins < skin.price) return false;
      setStats((prev) => ({
        ...prev,
        coins: prev.coins - skin.price,
        unlockedSkins: type === 'char' ? [...prev.unlockedSkins, skin.id] : prev.unlockedSkins,
        unlockedWeaponSkins: type === 'weapon' ? [...prev.unlockedWeaponSkins, skin.id] : prev.unlockedWeaponSkins
      }));
      return true;
    } else {
      if (stats.gems < skin.price) return false;
      setStats((prev) => ({
        ...prev,
        gems: prev.gems - skin.price,
        unlockedSkins: type === 'char' ? [...prev.unlockedSkins, skin.id] : prev.unlockedSkins,
        unlockedWeaponSkins: type === 'weapon' ? [...prev.unlockedWeaponSkins, skin.id] : prev.unlockedWeaponSkins
      }));
      return true;
    }
  };

  // Unclaimed challenges count
  const readyChallengesCount = challenges.filter(c => c.progress >= c.target && !c.claimed).length;

  return (
    <div id="vengestrike-app" className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 text-slate-100 font-rajdhani">
      {/* 1. LOBBY VIEW */}
      {gameState === 'lobby' && (
        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xl font-heading shadow-lg shadow-cyan-500/20 text-slate-950">
                VS
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                  VENGESTRIKE 3D
                </h1>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PARKOUR FPS COMBAT ARENA</span>
                  <span>•</span>
                  <span>v1.0 ONLINE</span>
                </div>
              </div>
            </div>

            {/* Profile Bar, Cloud Account, & Currencies */}
            <div className="flex items-center gap-3">
              {/* Currency */}
              <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-2xl border border-slate-800">
                <span className="text-amber-400 font-bold text-xs font-mono">🪙 {stats.coins.toLocaleString()}</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400 font-bold text-xs font-mono">💎 {stats.gems}</span>
              </div>

              {/* Account Sign In / Cloud Status Button */}
              {currentUser ? (
                <button
                  id="account-status-btn"
                  onClick={() => setActiveModal('auth')}
                  className="flex items-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 rounded-2xl transition text-xs font-mono shadow-sm"
                  title={`Signed in as ${currentUser.displayName || currentUser.email}. Click to manage account.`}
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold hidden sm:inline">{currentUser.displayName || 'SYNCED'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              ) : (
                <button
                  id="account-signin-btn"
                  onClick={() => setActiveModal('auth')}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-2xl transition text-xs font-mono shadow-lg shadow-cyan-500/20 active:scale-95"
                  title="Sign in or create an operative account to save your career to the cloud"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>SIGN IN / UP</span>
                </button>
              )}

              {/* Player level & avatar */}
              <button
                onClick={() => setActiveModal('profile')}
                className="flex items-center gap-2.5 bg-slate-900/80 hover:bg-slate-800 px-3.5 py-1.5 rounded-2xl border border-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-xs font-mono text-cyan-300">
                  {stats.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">{stats.username}</div>
                  <div className="text-[10px] font-mono text-cyan-400">LVL {stats.level}</div>
                </div>
              </button>

              {/* Offline / Online indicator */}
              <button
                onClick={() => setSettings({ ...settings, offlineMode: !settings.offlineMode })}
                className={`p-2.5 rounded-xl border text-xs font-mono transition ${
                  settings.offlineMode
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Toggle Offline Bot Mode"
              >
                {settings.offlineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Centerpiece Hero Action: DEPLOY TO BATTLE */}
          <div className="flex flex-col items-center justify-center my-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>WALL-RUN • SLIDE BOOST • SNIPER HEADSHOTS</span>
            </div>

            <h2 className="text-5xl sm:text-7xl font-bold font-heading tracking-wider mb-2 text-white drop-shadow-2xl">
              FAST-PACED PARKOUR FPS
            </h2>
            <p className="text-slate-400 max-w-xl text-sm sm:text-base mb-8">
              Experience seamless browser combat with momentum bunny-hopping, custom loadouts, and community level design.
            </p>

            <button
              onClick={() => startMatch(currentMap, 'ffa', settings.offlineMode)}
              className="group relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold font-mono text-lg rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.35)] transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>PLAY MATCH NOW</span>
            </button>
          </div>

          {/* Bottom Dock: Core Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 max-w-6xl mx-auto w-full">
            <button
              onClick={() => setActiveModal('matchmaking')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <Swords className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono font-bold">MATCHMAKING</span>
            </button>

            <button
              onClick={() => setActiveModal('loadout')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <Target className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-mono font-bold">LOADOUT</span>
            </button>

            <button
              onClick={() => setActiveModal('shop')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-mono font-bold">SHOP</span>
            </button>

            <button
              onClick={() => setActiveModal('map_editor')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <Box className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-mono font-bold">MAP EDITOR</span>
            </button>

            <button
              onClick={() => setActiveModal('challenges')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition relative"
            >
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono font-bold">CHALLENGES</span>
              {readyChallengesCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveModal('leaderboards')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-mono font-bold">RANKINGS</span>
            </button>

            <button
              onClick={() => setActiveModal('voice')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <Radio className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-mono font-bold">VOICE COMMS</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. IN-GAME 3D CANVAS & HUD */}
      {gameState === 'in_game' && (
        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair"
            onClick={() => {
              if (canvasRef.current && !isPointerLocked) {
                canvasRef.current.requestPointerLock();
              }
            }}
          />

          <GameHUD
            health={hudData.health}
            maxHealth={hudData.maxHealth}
            shield={hudData.shield}
            maxShield={hudData.maxShield}
            weapon={WEAPONS[loadout.primaryWeapon] || WEAPONS.scar}
            ammo={hudData.ammo}
            isReloading={hudData.isReloading}
            reloadProgress={hudData.reloadProgress}
            isAiming={hudData.isAiming}
            isSliding={hudData.isSliding}
            isWallRunning={hudData.isWallRunning}
            speedBoostTimer={hudData.speedBoostTimer}
            momentumMultiplier={hudData.momentumMultiplier}
            hitmarkerActive={hudData.hitmarkerActive}
            hitmarkerIsHeadshot={hudData.hitmarkerIsHeadshot}
            damageVignette={hudData.damageVignette}
            damageDirectionAngle={hudData.damageDirectionAngle}
            kills={hudData.kills}
            deaths={hudData.deaths}
            killstreak={hudData.killstreak}
            matchTimer={hudData.matchTimer}
            killFeed={hudData.killFeed}
            crosshair={loadout.crosshair}
            isVoiceActive={settings.voiceChatEnabled}
            isPttPressed={isPttPressed}
            voiceSpeakers={isPttPressed ? ['You (Tactical Comms)'] : []}
            isLocked={isPointerLocked}
            gameMode={currentMode}
            playerTeam={currentTeam}
            teamScores={hudData.teamScores}
            teamTargetScore={engineRef.current?.teamTargetScore || 25}
            weather={hudData.weather}
            isInspecting={hudData.isInspecting}
            weaponSkinName={WEAPON_SKINS.find(s => s.id === loadout.weaponSkinId)?.name}
            onLockClick={() => {
              if (canvasRef.current) canvasRef.current.requestPointerLock();
            }}
            onMobileFire={() => {
              if (engineRef.current) {
                (engineRef.current as any).isMouseDown = true;
                setTimeout(() => {
                  if (engineRef.current) (engineRef.current as any).isMouseDown = false;
                }, 100);
              }
            }}
            onMobileJump={() => engineRef.current?.triggerJump()}
            onMobileSlide={() => engineRef.current?.triggerSlide()}
            onMobileReload={() => engineRef.current?.startReload()}
            onMobileAim={() => {
              if (engineRef.current) {
                engineRef.current.isAiming = !engineRef.current.isAiming;
              }
            }}
            onMobileInspect={() => engineRef.current?.triggerInspect()}
          />

          {/* In-Game Pause Menu (ESC) */}
          {showInGamePause && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
                <h3 className="text-xl font-bold font-heading text-white">MATCH PAUSED</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowInGamePause(false);
                      if (canvasRef.current) canvasRef.current.requestPointerLock();
                    }}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-xl"
                  >
                    RESUME COMBAT
                  </button>
                  <button
                    onClick={() => engineRef.current?.respawnPlayer()}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-mono text-xs rounded-xl"
                  >
                    FORCE RESPAWN
                  </button>
                  <button
                    onClick={handleReturnToLobby}
                    className="w-full py-2.5 bg-rose-600/80 hover:bg-rose-500 text-white font-bold font-mono text-xs rounded-xl"
                  >
                    EXIT TO LOBBY
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Match Victory / Defeat Modal */}
          {isMatchOver && (
            <GameOverModal
              winner={matchWinner}
              kills={hudData.kills}
              deaths={hudData.deaths}
              headshots={hudData.kills > 0 ? Math.floor(hudData.kills * 0.4) : 0}
              bestStreak={hudData.killstreak}
              highlights={matchHighlights}
              gameMode={currentMode}
              playerTeam={currentTeam}
              teamScores={hudData.teamScores}
              weather={hudData.weather}
              onPlayAgain={() => startMatch(currentMap, currentMode, settings.offlineMode, currentTeam, hudData.weather?.type)}
              onReturnToLobby={handleReturnToLobby}
            />
          )}
        </div>
      )}

      {/* 3. MODALS */}
      {activeModal === 'loadout' && (
        <LoadoutMenu
          loadout={loadout}
          onSaveLoadout={(updated) => {
            setLoadout(updated);
            if (engineRef.current) engineRef.current.updateLoadout(updated);
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'shop' && (
        <ShopMenu
          stats={stats}
          currentSkinId={loadout.characterSkinId}
          currentWeaponSkinId={loadout.weaponSkinId}
          onEquipCharacterSkin={(skinId) => setLoadout({ ...loadout, characterSkinId: skinId })}
          onEquipWeaponSkin={(skinId) => {
            const updated = { ...loadout, weaponSkinId: skinId };
            setLoadout(updated);
            if (engineRef.current) engineRef.current.updateLoadout(updated);
          }}
          onPurchaseSkin={handlePurchaseSkin}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'leaderboards' && (
        <LeaderboardMenu stats={stats} onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'challenges' && (
        <DailyChallengesMenu
          challenges={challenges}
          stats={stats}
          onClaimReward={handleClaimChallenge}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'voice' && (
        <VoiceChatModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'profile' && (
        <ProfileModal
          stats={stats}
          achievements={achievements}
          settings={settings}
          currentUser={currentUser}
          onOpenAuthModal={() => setActiveModal('auth')}
          onManualCloudSync={async () => {
            if (currentUser) {
              await syncUserDataToCloud(currentUser, stats, loadout);
            }
          }}
          onUpdateStats={setStats}
          onUpdateSettings={setSettings}
          onClaimAchievement={(achId) => {
            setAchievements((prev) =>
              prev.map((a) => (a.id === achId ? { ...a, completed: true } : a))
            );
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'auth' && (
        <AuthModal
          currentUser={currentUser}
          stats={stats}
          loadout={loadout}
          onUserChange={(user) => setCurrentUser(user)}
          onStatsUpdate={(newStats) => setStats(newStats)}
          onLoadoutUpdate={(newLoadout) => setLoadout(newLoadout)}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'map_editor' && (
        <MapEditor
          onTestPlay={(map) => {
            // Save as custom map if not present
            if (!customMaps.find((m) => m.id === map.id)) {
              setCustomMaps([...customMaps, map]);
            }
            startMatch(map, 'ffa', settings.offlineMode);
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'matchmaking' && (
        <MatchmakingModal
          settings={settings}
          customMaps={customMaps}
          onStartMatch={(map, mode, isOff, team, weather) => startMatch(map, mode, isOff, team, weather)}
          onUpdateSettings={setSettings}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
