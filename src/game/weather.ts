/**
 * Dynamic Weather Presets & Environment Configuration
 */

import { WeatherInfo, WeatherType } from '../types';

export const WEATHER_PRESETS: Record<WeatherType, WeatherInfo> = {
  clear: {
    type: 'clear',
    name: 'Clear Skies',
    condition: 'Optimal Tactical Visibility',
    description: 'Crisp sunlight, clear horizon, and golden dust motes.',
    skyColor: 0x38bdf8,
    skyColorDark: 0x0c1322,
    fogColor: 0xbae6fd,
    fogColorDark: 0x0f172a,
    fogDensity: 0.007,
    ambientColor: 0xdbeafe,
    ambientIntensity: 0.8,
    sunColor: 0xfffaed,
    sunIntensity: 1.3,
    sunPosition: [40, 80, 40],
    particleColor: 0xfef08a,
    particleCount: 220,
    particleSize: 0.12,
    particleSpeedY: -0.7,
    particleSpeedX: 0.4,
    particleSpeedZ: 0.2,
    hasLightning: false,
    pulseNeon: false
  },
  storm: {
    type: 'storm',
    name: 'Tempest Storm',
    condition: 'Heavy Rain & Thunder',
    description: 'Torrential downpour with dramatic overcast lighting and dynamic thunder flashes.',
    skyColor: 0x0a0f1d,
    skyColorDark: 0x04060b,
    fogColor: 0x1e293b,
    fogColorDark: 0x090e17,
    fogDensity: 0.022,
    ambientColor: 0x3b4c63,
    ambientIntensity: 0.45,
    sunColor: 0x64748b,
    sunIntensity: 0.5,
    sunPosition: [20, 60, 20],
    particleColor: 0x93c5fd,
    particleCount: 1600,
    particleSize: 0.2,
    particleSpeedY: -54.0,
    particleSpeedX: 5.0,
    particleSpeedZ: -2.5,
    hasLightning: true,
    pulseNeon: false
  },
  sandstorm: {
    type: 'sandstorm',
    name: 'Desert Tempest',
    condition: 'High-Velocity Sandstorm',
    description: 'Dense orange haze with fast-blowing dust cutting across the combat zone.',
    skyColor: 0x78350f,
    skyColorDark: 0x451a03,
    fogColor: 0xb45309,
    fogColorDark: 0x78350f,
    fogDensity: 0.025,
    ambientColor: 0xd97706,
    ambientIntensity: 0.65,
    sunColor: 0xf59e0b,
    sunIntensity: 0.85,
    sunPosition: [50, 40, 30],
    particleColor: 0xfde68a,
    particleCount: 1300,
    particleSize: 0.18,
    particleSpeedY: -3.8,
    particleSpeedX: 28.0,
    particleSpeedZ: 7.0,
    hasLightning: false,
    pulseNeon: false
  },
  snow: {
    type: 'snow',
    name: 'Glacial Blizzard',
    condition: 'Sub-Zero Snowstorm',
    description: 'Cold winter atmosphere with fluttering snowflakes and frosted mist.',
    skyColor: 0x1e293b,
    skyColorDark: 0x0f172a,
    fogColor: 0x94a3b8,
    fogColorDark: 0x334155,
    fogDensity: 0.019,
    ambientColor: 0xe2e8f0,
    ambientIntensity: 0.7,
    sunColor: 0xf8fafc,
    sunIntensity: 1.1,
    sunPosition: [30, 70, 30],
    particleColor: 0xffffff,
    particleCount: 950,
    particleSize: 0.24,
    particleSpeedY: -6.8,
    particleSpeedX: 2.2,
    particleSpeedZ: 2.0,
    hasLightning: false,
    pulseNeon: false
  },
  cyber_fog: {
    type: 'cyber_fog',
    name: 'Neon Smog',
    condition: 'Synthwave Twilight',
    description: 'Deep violet smog with hyper-vibrant pulsing neon lights and drifting embers.',
    skyColor: 0x050510,
    skyColorDark: 0x020208,
    fogColor: 0x0e0e24,
    fogColorDark: 0x090916,
    fogDensity: 0.018,
    ambientColor: 0x4c1d95,
    ambientIntensity: 0.55,
    sunColor: 0xd946ef,
    sunIntensity: 0.85,
    sunPosition: [15, 60, 40],
    particleColor: 0x06b6d4,
    particleCount: 650,
    particleSize: 0.16,
    particleSpeedY: 3.2,
    particleSpeedX: 1.4,
    particleSpeedZ: 1.2,
    hasLightning: false,
    pulseNeon: true
  }
};

export const ALL_WEATHER_TYPES: WeatherType[] = ['clear', 'storm', 'sandstorm', 'snow', 'cyber_fog'];

export function getRandomWeather(): WeatherType {
  const idx = Math.floor(Math.random() * ALL_WEATHER_TYPES.length);
  return ALL_WEATHER_TYPES[idx];
}

export function getWeatherConfig(type?: WeatherType | 'random'): WeatherInfo {
  if (!type || type === ('random' as any)) {
    return WEATHER_PRESETS[getRandomWeather()];
  }
  return WEATHER_PRESETS[type] || WEATHER_PRESETS.clear;
}
