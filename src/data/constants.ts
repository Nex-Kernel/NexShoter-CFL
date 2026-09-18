import { WeaponConfig, CharacterSkin, WeaponSkin, DailyChallenge, Achievement, LeaderboardPlayer, GameSettings, PlayerStats, PlayerLoadout } from '../types';

export const WEAPONS: Record<string, WeaponConfig> = {
  scar: {
    id: 'scar',
    name: 'SCAR-H Strike',
    category: 'Rifle',
    damage: 32,
    headshotMultiplier: 1.8,
    fireRate: 9.5, // 9.5 rps
    magSize: 30,
    reloadTime: 1.8,
    spread: 0.015,
    range: 150,
    speedMultiplier: 1.0,
    automatic: true,
    color: '#3b82f6',
    description: 'Versatile assault rifle with exceptional mid-range balance and controllable recoil.'
  },
  sniper: {
    id: 'sniper',
    name: 'Phantom AWP',
    category: 'Sniper',
    damage: 95,
    headshotMultiplier: 2.5,
    fireRate: 1.1,
    magSize: 5,
    reloadTime: 2.8,
    spread: 0.002,
    range: 300,
    speedMultiplier: 0.88,
    automatic: false,
    color: '#8b5cf6',
    description: 'High-caliber bolt-action rifle delivering lethal one-shot headshots across long distances.'
  },
  shotgun: {
    id: 'shotgun',
    name: 'SPAS-12 Breaker',
    category: 'Shotgun',
    damage: 16, // per pellet
    headshotMultiplier: 1.5,
    fireRate: 1.5,
    magSize: 8,
    reloadTime: 2.4,
    spread: 0.075,
    range: 40,
    speedMultiplier: 0.95,
    automatic: false,
    pellets: 8,
    color: '#ef4444',
    description: 'Devastating close-quarters pump shotgun firing an 8-pellet buckshot spread.'
  },
  vector: {
    id: 'vector',
    name: 'Vector-9 Shredder',
    category: 'SMG',
    damage: 19,
    headshotMultiplier: 1.6,
    fireRate: 15.0,
    magSize: 35,
    reloadTime: 1.5,
    spread: 0.028,
    range: 70,
    speedMultiplier: 1.12,
    automatic: true,
    color: '#10b981',
    description: 'Ultra-high cyclic rate submachine gun built for aggressive parkour sliding.'
  },
  revolver: {
    id: 'revolver',
    name: 'Omen .44 Magnum',
    category: 'Pistol',
    damage: 55,
    headshotMultiplier: 2.0,
    fireRate: 2.5,
    magSize: 6,
    reloadTime: 2.0,
    spread: 0.012,
    range: 90,
    speedMultiplier: 1.05,
    automatic: false,
    color: '#f59e0b',
    description: 'Hard-hitting heavy sidearm with rapid draw speed and pinpoint first-shot accuracy.'
  }
};

export const CHARACTER_SKINS: CharacterSkin[] = [
  {
    id: 'cyber_ronin',
    name: 'Cyber Ronin',
    rarity: 'Common',
    price: 0,
    currency: 'coins',
    color: '#0284c7',
    accentColor: '#38bdf8',
    visorColor: '#67e8f9',
    description: 'Standard issue urban cyber operative outfit.'
  },
  {
    id: 'neon_phantom',
    name: 'Neon Phantom',
    rarity: 'Rare',
    price: 800,
    currency: 'coins',
    color: '#9333ea',
    accentColor: '#ec4899',
    visorColor: '#f43f5e',
    description: 'Glow-accented infiltration armor tuned for high-velocity parkour.'
  },
  {
    id: 'desert_specops',
    name: 'Desert SpecOps',
    rarity: 'Rare',
    price: 1200,
    currency: 'coins',
    color: '#d97706',
    accentColor: '#fbbf24',
    visorColor: '#fef08a',
    description: 'Tactical arid-camo protective plating with sand goggles.'
  },
  {
    id: 'void_walker',
    name: 'Void Walker',
    rarity: 'Epic',
    price: 2500,
    currency: 'coins',
    color: '#1e1b4b',
    accentColor: '#6366f1',
    visorColor: '#a855f7',
    description: 'Quantum-dampened combat suit forged from dark matter alloys.'
  },
  {
    id: 'golden_vanguard',
    name: 'Golden Vanguard',
    rarity: 'Legendary',
    price: 150,
    currency: 'gems',
    color: '#eab308',
    accentColor: '#fef08a',
    visorColor: '#ffffff',
    description: 'Champion gold prestige plating awarded to supreme arena gladiators.'
  },
  {
    id: 'glitch_punk',
    name: 'Glitch Punk',
    rarity: 'Epic',
    price: 100,
    currency: 'gems',
    color: '#10b981',
    accentColor: '#06b6d4',
    visorColor: '#a7f3d0',
    description: 'Hacked augmented reality chassis with holographic chromatic shifts.'
  }
];

export const WEAPON_SKINS: WeaponSkin[] = [
  {
    id: 'skin_default',
    name: 'Matte Graphite',
    weaponId: 'scar',
    rarity: 'Common',
    price: 0,
    currency: 'coins',
    primaryColor: '#334155',
    secondaryColor: '#64748b',
    glow: false
  },
  {
    id: 'skin_acid_neon',
    name: 'Acid Neon',
    weaponId: 'scar',
    rarity: 'Rare',
    price: 600,
    currency: 'coins',
    primaryColor: '#15803d',
    secondaryColor: '#4ade80',
    glow: true
  },
  {
    id: 'skin_hyper_pink',
    name: 'Hyper Cyber',
    weaponId: 'vector',
    rarity: 'Epic',
    price: 1500,
    currency: 'coins',
    primaryColor: '#db2777',
    secondaryColor: '#38bdf8',
    glow: true
  },
  {
    id: 'skin_dragon_sniper',
    name: 'Obsidian Dragon',
    weaponId: 'sniper',
    rarity: 'Legendary',
    price: 120,
    currency: 'gems',
    primaryColor: '#7f1d1d',
    secondaryColor: '#f59e0b',
    glow: true
  },
  {
    id: 'skin_gold_spas',
    name: 'Gilded Glory',
    weaponId: 'shotgun',
    rarity: 'Epic',
    price: 1800,
    currency: 'coins',
    primaryColor: '#ca8a04',
    secondaryColor: '#fef08a',
    glow: false
  },
  {
    id: 'skin_plasma_revolver',
    name: 'Plasma Arc',
    weaponId: 'revolver',
    rarity: 'Rare',
    price: 900,
    currency: 'coins',
    primaryColor: '#0369a1',
    secondaryColor: '#38bdf8',
    glow: true
  }
];

export const INITIAL_CHALLENGES: DailyChallenge[] = [
  {
    id: 'ch_slide_kills',
    title: 'Slide Master',
    description: 'Eliminate 3 opponents while sliding or bunny-hopping',
    progress: 0,
    target: 3,
    rewardCoins: 250,
    rewardXp: 400,
    claimed: false
  },
  {
    id: 'ch_headshots',
    title: 'Precision Striker',
    description: 'Land 5 headshots with any weapon',
    progress: 0,
    target: 5,
    rewardCoins: 300,
    rewardXp: 500,
    claimed: false
  },
  {
    id: 'ch_match_wins',
    title: 'Arena Victor',
    description: 'Win 2 matches in any game mode',
    progress: 0,
    target: 2,
    rewardCoins: 500,
    rewardXp: 750,
    claimed: false
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_blood',
    title: 'First Blood',
    description: 'Score your first elimination in an arena match',
    rewardGems: 10,
    progress: 0,
    target: 1,
    completed: false,
    category: 'combat'
  },
  {
    id: 'ach_parkour_speedster',
    title: 'Apex Runner',
    description: 'Accumulate 100 meters of wall running',
    rewardGems: 25,
    progress: 0,
    target: 100,
    completed: false,
    category: 'parkour'
  },
  {
    id: 'ach_rampage',
    title: 'Rampage',
    description: 'Achieve a 5-kill streak without dying',
    rewardGems: 30,
    progress: 0,
    target: 5,
    completed: false,
    category: 'combat'
  },
  {
    id: 'ach_sniper_elite',
    title: 'Marksman Elite',
    description: 'Eliminate 10 enemies with the Phantom AWP sniper',
    rewardGems: 35,
    progress: 0,
    target: 10,
    completed: false,
    category: 'mastery'
  },
  {
    id: 'ach_architect',
    title: 'Arena Architect',
    description: 'Create and test play a community level in the Map Editor',
    rewardGems: 20,
    progress: 0,
    target: 1,
    completed: false,
    category: 'mastery'
  }
];

export const INITIAL_LEADERBOARD: LeaderboardPlayer[] = [
  { rank: 1, username: 'ViperX', score: 14250, kills: 842, deaths: 189, kd: 4.45, wins: 94, skinColor: '#eab308', badge: 'Diamond' },
  { rank: 2, username: 'Ghost_Run', score: 12890, kills: 730, deaths: 210, kd: 3.47, wins: 81, skinColor: '#9333ea', badge: 'Diamond' },
  { rank: 3, username: 'Kestrel99', score: 11400, kills: 685, deaths: 240, kd: 2.85, wins: 72, skinColor: '#3b82f6', badge: 'Platinum' },
  { rank: 4, username: 'CyberBlade', score: 9850, kills: 560, deaths: 220, kd: 2.54, wins: 59, skinColor: '#10b981', badge: 'Platinum' },
  { rank: 5, username: 'PixelSamurai', score: 8720, kills: 510, deaths: 230, kd: 2.21, wins: 48, skinColor: '#f97316', badge: 'Gold' },
  { rank: 6, username: 'SlideNinja', score: 7900, kills: 480, deaths: 250, kd: 1.92, wins: 42, skinColor: '#06b6d4', badge: 'Gold' },
  { rank: 7, username: 'WallRunner', score: 6800, kills: 390, deaths: 230, kd: 1.69, wins: 35, skinColor: '#ec4899', badge: 'Silver' },
  { rank: 8, username: 'You', score: 1250, kills: 42, deaths: 28, kd: 1.50, wins: 4, skinColor: '#38bdf8', badge: 'Bronze', isUser: true }
];

export const DEFAULT_LOADOUT: PlayerLoadout = {
  primaryWeapon: 'scar',
  sight: 'Red Dot',
  barrel: 'Compensator',
  magazine: 'Extended (+5)',
  characterSkinId: 'cyber_ronin',
  weaponSkinId: 'skin_default',
  crosshair: {
    color: '#00ffcc',
    size: 10,
    thickness: 2,
    gap: 5,
    dot: true,
    dynamicSpread: true
  }
};

export const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 1.8,
  fov: 85,
  masterVolume: 80,
  sfxVolume: 85,
  voiceChatVolume: 75,
  crosshairDynamic: true,
  pushToTalkKey: 'V',
  voiceChatEnabled: true,
  darkMode: true,
  highContrast: false,
  graphicsQuality: 'high',
  showFps: true,
  offlineMode: false
};

export const DEFAULT_STATS: PlayerStats = {
  username: 'Operative_' + Math.floor(1000 + Math.random() * 9000),
  level: 1,
  xp: 0,
  coins: 500,
  gems: 25,
  matchesPlayed: 0,
  wins: 0,
  kills: 0,
  deaths: 0,
  headshots: 0,
  shotsFired: 0,
  shotsHit: 0,
  slideKills: 0,
  wallRunMeters: 0,
  parkourJumps: 0,
  bestStreak: 0,
  unlockedSkins: ['cyber_ronin'],
  unlockedWeaponSkins: ['skin_default'],
  claimedChallenges: [],
  unlockedAchievements: [],
  lastDailyReset: new Date().toDateString(),
  antiCheatAnomalies: [],
  antiCheatSummary: {
    trustScore: 100,
    totalAnomalies: 0,
    velocityFlags: 0,
    snapAimFlags: 0,
    lastFlaggedTimestamp: null,
    status: 'clean'
  }
};
