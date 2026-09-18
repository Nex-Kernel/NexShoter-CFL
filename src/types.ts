export type GameMode = 'ffa' | 'tdm' | 'parkour' | 'gungame';

export type PlayerTeam = 'red' | 'blue';

export type WeatherType = 'clear' | 'storm' | 'sandstorm' | 'snow' | 'cyber_fog';

export interface WeatherInfo {
  type: WeatherType;
  name: string;
  condition: string;
  description: string;
  skyColor: number;
  skyColorDark: number;
  fogColor: number;
  fogColorDark: number;
  fogDensity: number;
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
  particleColor: number;
  particleCount: number;
  particleSize: number;
  particleSpeedY: number;
  particleSpeedX: number;
  particleSpeedZ: number;
  hasLightning?: boolean;
  pulseNeon?: boolean;
}

export interface TeamScores {
  red: number;
  blue: number;
}

export type WeaponId = 'scar' | 'sniper' | 'shotgun' | 'vector' | 'revolver';

export interface WeaponAttachment {
  id: string;
  name: string;
  type: 'sight' | 'barrel' | 'magazine';
  bonus: string;
}

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  category: 'Rifle' | 'Sniper' | 'Shotgun' | 'SMG' | 'Pistol';
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // rounds per second
  magSize: number;
  reloadTime: number; // seconds
  spread: number;
  range: number;
  speedMultiplier: number;
  automatic: boolean;
  pellets?: number; // for shotgun
  color: string;
  description: string;
}

export interface CrosshairSettings {
  color: string;
  size: number;
  thickness: number;
  gap: number;
  dot: boolean;
  dynamicSpread: boolean;
}

export interface CharacterSkin {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  price: number;
  currency: 'coins' | 'gems';
  color: string;
  accentColor: string;
  visorColor: string;
  description: string;
}

export interface WeaponSkin {
  id: string;
  name: string;
  weaponId: WeaponId;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  price: number;
  currency: 'coins' | 'gems';
  primaryColor: string;
  secondaryColor: string;
  glow: boolean;
}

export interface PlayerLoadout {
  primaryWeapon: WeaponId;
  sight: string;
  barrel: string;
  magazine: string;
  characterSkinId: string;
  weaponSkinId: string;
  crosshair: CrosshairSettings;
}

export type AnomalyType = 'suspicious_velocity' | 'snap_aim_anomaly' | 'teleportation' | 'speed_hack';
export type AnomalySeverity = 'info' | 'warning' | 'suspicious' | 'critical';

export interface AntiCheatAnomaly {
  id: string;
  timestamp: number;
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  recordedValue: number;
  threshold: number;
  description: string;
  matchTimeSec: number;
  playerPosition: [number, number, number];
  metadata?: {
    targetId?: string;
    targetName?: string;
    isHeadshot?: boolean;
    angularSpeedDegPerSec?: number;
    velocityMagnitude?: number;
    weaponId?: string;
  };
}

export interface AntiCheatTelemetrySummary {
  trustScore: number;
  totalAnomalies: number;
  velocityFlags: number;
  snapAimFlags: number;
  lastFlaggedTimestamp: number | null;
  status: 'clean' | 'flagged_for_review' | 'suspicious' | 'under_investigation';
}

export interface PlayerStats {
  username: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  matchesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
  slideKills: number;
  wallRunMeters: number;
  parkourJumps: number;
  bestStreak: number;
  unlockedSkins: string[];
  unlockedWeaponSkins: string[];
  claimedChallenges: string[];
  unlockedAchievements: string[];
  lastDailyReset: string;
  antiCheatAnomalies?: AntiCheatAnomaly[];
  antiCheatSummary?: AntiCheatTelemetrySummary;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardGems: number;
  rewardTitle?: string;
  progress: number;
  target: number;
  completed: boolean;
  category: 'combat' | 'parkour' | 'mastery';
}

export interface LeaderboardPlayer {
  rank: number;
  username: string;
  score: number;
  kills: number;
  deaths: number;
  kd: number;
  wins: number;
  skinColor: string;
  badge: string;
  isUser?: boolean;
}

export interface MapBlock {
  id: string;
  type: 'floor' | 'wall' | 'ramp' | 'crate' | 'jumppad' | 'speedgate' | 'healthpack' | 'spawn';
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color?: string;
  rotationY?: number;
}

export interface GameMap {
  id: string;
  name: string;
  author: string;
  description: string;
  blocks: MapBlock[];
  isCustom?: boolean;
  weather?: WeatherType;
}

export interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  headshot: boolean;
  timestamp: number;
  killerTeam?: PlayerTeam;
  victimTeam?: PlayerTeam;
}

export interface GameSettings {
  mouseSensitivity: number;
  fov: number;
  masterVolume: number;
  sfxVolume: number;
  voiceChatVolume: number;
  crosshairDynamic: boolean;
  pushToTalkKey: string;
  voiceChatEnabled: boolean;
  darkMode: boolean;
  highContrast: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  showFps: boolean;
  offlineMode: boolean;
}

export interface PlayerCombatEvent {
  id: string;
  timeSec: number;
  matchElapsedSec: number;
  type: 'hit' | 'kill';
  damage: number;
  victim: string;
  isHeadshot: boolean;
  weapon: string;
  weaponId?: WeaponId;
  streak: number;
  isSliding: boolean;
  isWallRunning: boolean;
}

export interface PlayTimelineStep {
  offsetSec: number;
  type: 'hit' | 'kill' | 'headshot_kill' | 'streak_chime' | 'slide_action';
  description: string;
  damage?: number;
  target?: string;
  weapon?: string;
  badge?: string;
}

export interface MatchHighlight {
  id: string;
  rank: 1 | 2 | 3;
  title: string;
  category: 'multi_kill' | 'high_damage' | 'killstreak' | 'headshot_spree' | 'clutch_play';
  badge: string;
  badgeColor: string;
  score: number;
  grade: 'S+' | 'S' | 'A+' | 'A';
  killsCount: number;
  damageDealt: number;
  headshotsCount: number;
  weaponName: string;
  weaponId?: WeaponId;
  streakCount: number;
  matchTimeFormatted: string;
  matchTimeSec: number;
  durationSec: number;
  victims: string[];
  description: string;
  timeline: PlayTimelineStep[];
}
