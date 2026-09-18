import { GameMap, MapBlock } from '../types';

export const DEFAULT_MAPS: GameMap[] = [
  {
    id: 'cyber_arena',
    name: 'Cyber Neon Arena',
    author: 'Official',
    weather: 'cyber_fog',
    description: 'Vibrant neon coliseum with multi-tier ramps, high-velocity jump pads, and central control pillar.',
    blocks: [
      // Main arena floor
      { id: 'f1', type: 'floor', x: 0, y: 0, z: 0, w: 90, h: 2, d: 90, color: '#1e293b' },
      
      // Outer boundary walls
      { id: 'w_n', type: 'wall', x: 0, y: 7, z: -45, w: 90, h: 14, d: 2, color: '#0f172a' },
      { id: 'w_s', type: 'wall', x: 0, y: 7, z: 45, w: 90, h: 14, d: 2, color: '#0f172a' },
      { id: 'w_w', type: 'wall', x: -45, y: 7, z: 0, w: 2, h: 14, d: 90, color: '#0f172a' },
      { id: 'w_e', type: 'wall', x: 45, y: 7, z: 0, w: 2, h: 14, d: 90, color: '#0f172a' },

      // Central elevated platform
      { id: 'center_plat', type: 'floor', x: 0, y: 5, z: 0, w: 24, h: 1.5, d: 24, color: '#334155' },
      { id: 'center_cover1', type: 'crate', x: -4, y: 7.5, z: 0, w: 3, h: 3.5, d: 6, color: '#0284c7' },
      { id: 'center_cover2', type: 'crate', x: 4, y: 7.5, z: 0, w: 3, h: 3.5, d: 6, color: '#0284c7' },

      // Ramps to center
      { id: 'ramp_s', type: 'ramp', x: 0, y: 2.5, z: 18, w: 10, h: 5, d: 14, color: '#475569', rotationY: 0 },
      { id: 'ramp_n', type: 'ramp', x: 0, y: 2.5, z: -18, w: 10, h: 5, d: 14, color: '#475569', rotationY: Math.PI },

      // North Tower (Sniper Perch)
      { id: 'tower_n', type: 'floor', x: 0, y: 11, z: -36, w: 18, h: 1.5, d: 12, color: '#2563eb' },
      { id: 'tower_n_wall', type: 'wall', x: 0, y: 13, z: -41, w: 18, h: 3.5, d: 1.5, color: '#1d4ed8' },

      // South Tower
      { id: 'tower_s', type: 'floor', x: 0, y: 11, z: 36, w: 18, h: 1.5, d: 12, color: '#2563eb' },
      { id: 'tower_s_wall', type: 'wall', x: 0, y: 13, z: 41, w: 18, h: 3.5, d: 1.5, color: '#1d4ed8' },

      // Jump Pads launching to towers
      { id: 'jp_n', type: 'jumppad', x: 0, y: 1.2, z: -25, w: 4, h: 0.8, d: 4, color: '#f59e0b' },
      { id: 'jp_s', type: 'jumppad', x: 0, y: 1.2, z: 25, w: 4, h: 0.8, d: 4, color: '#f59e0b' },

      // West & East Parkour Wall-run corridors
      { id: 'wallrun_w', type: 'wall', x: -28, y: 6, z: 0, w: 1.5, h: 10, d: 36, color: '#8b5cf6' },
      { id: 'wallrun_e', type: 'wall', x: 28, y: 6, z: 0, w: 1.5, h: 10, d: 36, color: '#8b5cf6' },

      // High vantage side platforms
      { id: 'side_plat_w', type: 'floor', x: -36, y: 7, z: 0, w: 12, h: 1.5, d: 20, color: '#3b82f6' },
      { id: 'side_plat_e', type: 'floor', x: 36, y: 7, z: 0, w: 12, h: 1.5, d: 20, color: '#3b82f6' },

      // Speed Gates
      { id: 'sg_w', type: 'speedgate', x: -22, y: 2, z: 0, w: 2, h: 4, d: 6, color: '#10b981' },
      { id: 'sg_e', type: 'speedgate', x: 22, y: 2, z: 0, w: 2, h: 4, d: 6, color: '#10b981' },

      // Cover Crates
      { id: 'crate1', type: 'crate', x: -16, y: 2.5, z: -16, w: 4, h: 4, d: 4, color: '#ca8a04' },
      { id: 'crate2', type: 'crate', x: 16, y: 2.5, z: 16, w: 4, h: 4, d: 4, color: '#ca8a04' },
      { id: 'crate3', type: 'crate', x: -16, y: 2.5, z: 16, w: 4, h: 4, d: 4, color: '#ca8a04' },
      { id: 'crate4', type: 'crate', x: 16, y: 2.5, z: -16, w: 4, h: 4, d: 4, color: '#ca8a04' },

      // Health pickups
      { id: 'hp1', type: 'healthpack', x: 0, y: 6.5, z: 0, w: 2, h: 2, d: 2, color: '#22c55e' },
      { id: 'hp2', type: 'healthpack', x: -36, y: 8.5, z: 0, w: 2, h: 2, d: 2, color: '#22c55e' },
      { id: 'hp3', type: 'healthpack', x: 36, y: 8.5, z: 0, w: 2, h: 2, d: 2, color: '#22c55e' },

      // Spawn points
      { id: 'sp1', type: 'spawn', x: -32, y: 2, z: -32, w: 2, h: 0.2, d: 2 },
      { id: 'sp2', type: 'spawn', x: 32, y: 2, z: 32, w: 2, h: 0.2, d: 2 },
      { id: 'sp3', type: 'spawn', x: -32, y: 2, z: 32, w: 2, h: 0.2, d: 2 },
      { id: 'sp4', type: 'spawn', x: 32, y: 2, z: -32, w: 2, h: 0.2, d: 2 }
    ]
  },
  {
    id: 'rooftop_rush',
    name: 'Skyline Rooftops',
    author: 'Official',
    weather: 'storm',
    description: 'High altitude parkour circuit with rooftop bridges, slide drops, and continuous wall-runs.',
    blocks: [
      // Main rooftop 1
      { id: 'r1', type: 'floor', x: -25, y: 0, z: 0, w: 40, h: 2, d: 50, color: '#1e293b' },
      // Main rooftop 2
      { id: 'r2', type: 'floor', x: 25, y: 4, z: 0, w: 40, h: 2, d: 50, color: '#0f172a' },

      // Bridge connecting them
      { id: 'br1', type: 'floor', x: 0, y: 2, z: 0, w: 14, h: 1, d: 10, color: '#334155' },

      // Wall-run billboard in the chasm
      { id: 'billboard', type: 'wall', x: 0, y: 5, z: -15, w: 12, h: 7, d: 1, color: '#ec4899' },
      { id: 'billboard2', type: 'wall', x: 0, y: 5, z: 15, w: 12, h: 7, d: 1, color: '#06b6d4' },

      // Launch pads
      { id: 'jp_r1', type: 'jumppad', x: -10, y: 1.5, z: -15, w: 4, h: 0.8, d: 4, color: '#f59e0b' },
      { id: 'jp_r2', type: 'jumppad', x: 10, y: 5.5, z: 15, w: 4, h: 0.8, d: 4, color: '#f59e0b' },

      // HVAC units & crates
      { id: 'hvac1', type: 'crate', x: -28, y: 2.5, z: -10, w: 5, h: 3.5, d: 8, color: '#64748b' },
      { id: 'hvac2', type: 'crate', x: 28, y: 6.5, z: 10, w: 5, h: 3.5, d: 8, color: '#64748b' },

      // Perimeter barriers
      { id: 'bar1', type: 'wall', x: -45, y: 3, z: 0, w: 1, h: 4, d: 50, color: '#334155' },
      { id: 'bar2', type: 'wall', x: 45, y: 7, z: 0, w: 1, h: 4, d: 50, color: '#334155' },

      // Speed gates
      { id: 'sg_br', type: 'speedgate', x: 0, y: 3.5, z: 0, w: 2, h: 4, d: 8, color: '#10b981' }
    ]
  },
  {
    id: 'canyon_dunes',
    name: 'Desert Canyon Outpost',
    author: 'Official',
    weather: 'sandstorm',
    description: 'Harsh desert ruins battered by high-velocity sandstorms with canyon wall-runs and fortified bunkers.',
    blocks: [
      { id: 'cd_f1', type: 'floor', x: 0, y: 0, z: 0, w: 90, h: 2, d: 90, color: '#78350f' },
      { id: 'cd_w_n', type: 'wall', x: 0, y: 8, z: -45, w: 90, h: 16, d: 2, color: '#451a03' },
      { id: 'cd_w_s', type: 'wall', x: 0, y: 8, z: 45, w: 90, h: 16, d: 2, color: '#451a03' },
      { id: 'cd_w_w', type: 'wall', x: -45, y: 8, z: 0, w: 2, h: 16, d: 90, color: '#451a03' },
      { id: 'cd_w_e', type: 'wall', x: 45, y: 8, z: 0, w: 2, h: 16, d: 90, color: '#451a03' },
      // Central bunker
      { id: 'cd_bunker', type: 'floor', x: 0, y: 4, z: 0, w: 22, h: 1.5, d: 22, color: '#92400e' },
      { id: 'cd_crate1', type: 'crate', x: -5, y: 6.5, z: 0, w: 4, h: 4, d: 4, color: '#d97706' },
      { id: 'cd_crate2', type: 'crate', x: 5, y: 6.5, z: 0, w: 4, h: 4, d: 4, color: '#d97706' },
      // Sand ramps
      { id: 'cd_ramp_s', type: 'ramp', x: 0, y: 2, z: 16, w: 10, h: 4, d: 12, color: '#b45309', rotationY: 0 },
      { id: 'cd_ramp_n', type: 'ramp', x: 0, y: 2, z: -16, w: 10, h: 4, d: 12, color: '#b45309', rotationY: Math.PI },
      // Side canyon walls
      { id: 'cd_canyon_w', type: 'wall', x: -26, y: 6, z: 0, w: 2, h: 10, d: 34, color: '#b45309' },
      { id: 'cd_canyon_e', type: 'wall', x: 26, y: 6, z: 0, w: 2, h: 10, d: 34, color: '#b45309' },
      { id: 'cd_jp1', type: 'jumppad', x: 0, y: 1.2, z: -24, w: 4, h: 0.8, d: 4, color: '#f59e0b' },
      { id: 'cd_jp2', type: 'jumppad', x: 0, y: 1.2, z: 24, w: 4, h: 0.8, d: 4, color: '#f59e0b' },
      { id: 'cd_hp1', type: 'healthpack', x: 0, y: 5.5, z: 0, w: 2, h: 2, d: 2, color: '#22c55e' }
    ]
  },
  {
    id: 'frostbite_summit',
    name: 'Frostbite Summit',
    author: 'Official',
    weather: 'snow',
    description: 'Sub-zero arctic testing facility engulfed in a freezing mountain blizzard with elevated catwalks.',
    blocks: [
      { id: 'fs_f1', type: 'floor', x: 0, y: 0, z: 0, w: 90, h: 2, d: 90, color: '#334155' },
      { id: 'fs_w_n', type: 'wall', x: 0, y: 8, z: -45, w: 90, h: 16, d: 2, color: '#1e293b' },
      { id: 'fs_w_s', type: 'wall', x: 0, y: 8, z: 45, w: 90, h: 16, d: 2, color: '#1e293b' },
      { id: 'fs_w_w', type: 'wall', x: -45, y: 8, z: 0, w: 2, h: 16, d: 90, color: '#1e293b' },
      { id: 'fs_w_e', type: 'wall', x: 45, y: 8, z: 0, w: 2, h: 16, d: 90, color: '#1e293b' },
      // Catwalk
      { id: 'fs_catwalk', type: 'floor', x: 0, y: 6, z: 0, w: 16, h: 1.5, d: 36, color: '#64748b' },
      { id: 'fs_cover1', type: 'crate', x: 0, y: 8, z: -8, w: 4, h: 3, d: 3, color: '#94a3b8' },
      { id: 'fs_cover2', type: 'crate', x: 0, y: 8, z: 8, w: 4, h: 3, d: 3, color: '#94a3b8' },
      { id: 'fs_jp_w', type: 'jumppad', x: -22, y: 1.2, z: 0, w: 4, h: 0.8, d: 4, color: '#38bdf8' },
      { id: 'fs_jp_e', type: 'jumppad', x: 22, y: 1.2, z: 0, w: 4, h: 0.8, d: 4, color: '#38bdf8' },
      { id: 'fs_wallrun1', type: 'wall', x: -28, y: 7, z: 0, w: 1.5, h: 11, d: 32, color: '#cbd5e1' },
      { id: 'fs_wallrun2', type: 'wall', x: 28, y: 7, z: 0, w: 1.5, h: 11, d: 32, color: '#cbd5e1' },
      { id: 'fs_hp1', type: 'healthpack', x: 0, y: 7.5, z: 0, w: 2, h: 2, d: 2, color: '#22c55e' }
    ]
  }
];

export function parseMapJSON(jsonString: string): GameMap | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data.name || !Array.isArray(data.blocks)) return null;
    return {
      id: 'custom_' + Date.now(),
      name: String(data.name).substring(0, 30),
      author: String(data.author || 'Community').substring(0, 20),
      description: String(data.description || 'Custom level created with Map Editor').substring(0, 100),
      blocks: data.blocks,
      isCustom: true
    };
  } catch {
    return null;
  }
}

export function exportMapJSON(map: GameMap): string {
  return JSON.stringify({
    name: map.name,
    author: map.author,
    description: map.description,
    blocks: map.blocks
  }, null, 2);
}
