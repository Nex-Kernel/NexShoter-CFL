import React, { useState } from 'react';
import { PlayerLoadout, WeaponConfig, CrosshairSettings } from '../types';
import { WEAPONS, WEAPON_SKINS } from '../data/constants';
import { Crosshair, Shield, Zap, Sparkles, Sliders, Target, Check } from 'lucide-react';

interface LoadoutMenuProps {
  loadout: PlayerLoadout;
  onSaveLoadout: (loadout: PlayerLoadout) => void;
  onClose: () => void;
}

export const LoadoutMenu: React.FC<LoadoutMenuProps> = ({ loadout, onSaveLoadout, onClose }) => {
  const [currentLoadout, setCurrentLoadout] = useState<PlayerLoadout>(loadout);
  const [activeTab, setActiveTab] = useState<'weapon' | 'crosshair' | 'skin'>('weapon');

  const selectedWeapon = WEAPONS[currentLoadout.primaryWeapon];
  const weaponSkins = WEAPON_SKINS.filter(s => s.weaponId === currentLoadout.primaryWeapon || s.weaponId === 'scar');

  const updateCrosshair = (partial: Partial<CrosshairSettings>) => {
    const updated = {
      ...currentLoadout,
      crosshair: { ...currentLoadout.crosshair, ...partial }
    };
    setCurrentLoadout(updated);
    onSaveLoadout(updated);
  };

  const handleSelectWeapon = (weaponId: WeaponConfig['id']) => {
    const updated = { ...currentLoadout, primaryWeapon: weaponId };
    setCurrentLoadout(updated);
    onSaveLoadout(updated);
  };

  const handleSelectSkin = (skinId: string) => {
    const updated = { ...currentLoadout, weaponSkinId: skinId };
    setCurrentLoadout(updated);
    onSaveLoadout(updated);
  };

  return (
    <div id="loadout-menu" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">WEAPON LOADOUT & RETICLE</h1>
            <p className="text-xs text-slate-400">Configure combat armaments, optics, and custom crosshair</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('weapon')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              activeTab === 'weapon' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ARMORY
          </button>
          <button
            onClick={() => setActiveTab('skin')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              activeTab === 'skin' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            CAMO & SKINS
          </button>
          <button
            onClick={() => setActiveTab('crosshair')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              activeTab === 'crosshair' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            CROSSHAIR DESIGNER
          </button>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono rounded-xl shadow-lg transition"
        >
          CONFIRM & EXIT
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'weapon' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Weapon Selector List */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">SELECT PRIMARY WEAPON</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(WEAPONS).map((w) => {
                  const isSelected = currentLoadout.primaryWeapon === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => handleSelectWeapon(w.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold uppercase">
                            {w.category}
                          </span>
                          <h4 className="text-lg font-bold font-heading text-white mt-1">{w.name}</h4>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{w.description}</p>
                      
                      {/* Compact Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-500 text-[10px]">DMG</span>
                          <div className="font-bold text-slate-200">{w.damage}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">FIRE RATE</span>
                          <div className="font-bold text-slate-200">{w.fireRate}/s</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">MAG</span>
                          <div className="font-bold text-slate-200">{w.magSize}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weapon Details & Attachment Modifiers */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>PERFORMANCE TELEMETRY</span>
                </div>
                <h3 className="text-2xl font-bold font-heading text-white mb-4">{selectedWeapon.name}</h3>

                {/* Progress bars for stats */}
                <div className="space-y-3 font-mono text-xs mb-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">DAMAGE</span>
                      <span className="text-slate-200 font-bold">{selectedWeapon.damage} HP</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, selectedWeapon.damage)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">FIRE RATE</span>
                      <span className="text-slate-200 font-bold">{selectedWeapon.fireRate} rps</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${(selectedWeapon.fireRate / 16) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">RELOAD SPEED</span>
                      <span className="text-slate-200 font-bold">{selectedWeapon.reloadTime}s</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${Math.max(10, 100 - selectedWeapon.reloadTime * 25)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">MOBILITY</span>
                      <span className="text-slate-200 font-bold">{(selectedWeapon.speedMultiplier * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${selectedWeapon.speedMultiplier * 85}%` }} />
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">ATTACHMENTS</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500">OPTIC SIGHT</span>
                    <div className="text-cyan-300 font-bold mt-0.5">Reflex Holographic</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500">BARREL</span>
                    <div className="text-cyan-300 font-bold mt-0.5">Recoil Compensator</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                Equipped in current combat loadout slot 1.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skin' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">WEAPON CAMOS & SKINS</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {WEAPON_SKINS.map((s) => {
                const isSelected = currentLoadout.weaponSkinId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSkin(s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition relative overflow-hidden ${
                      isSelected ? 'bg-slate-900 border-cyan-400 shadow-lg' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="h-24 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden" style={{ backgroundColor: s.primaryColor }}>
                      <div className="w-16 h-4 rounded" style={{ backgroundColor: s.secondaryColor }} />
                      {s.glow && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{s.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{s.rarity}</span>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-cyan-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'crosshair' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Controls */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">CROSSHAIR ATTRIBUTES</h3>

              {/* Color Preset Palette */}
              <div>
                <label className="text-xs font-mono text-slate-400 mb-2 block">RETICLE COLOR</label>
                <div className="flex gap-2">
                  {['#00ffcc', '#22c55e', '#ef4444', '#f59e0b', '#a855f7', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateCrosshair({ color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        currentLoadout.crosshair.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">BAR LENGTH (SIZE)</span>
                    <span className="text-cyan-400 font-bold">{currentLoadout.crosshair.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="24"
                    value={currentLoadout.crosshair.size}
                    onChange={(e) => updateCrosshair({ size: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">BAR THICKNESS</span>
                    <span className="text-cyan-400 font-bold">{currentLoadout.crosshair.thickness}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={currentLoadout.crosshair.thickness}
                    onChange={(e) => updateCrosshair({ thickness: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">CENTER GAP</span>
                    <span className="text-cyan-400 font-bold">{currentLoadout.crosshair.gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="18"
                    value={currentLoadout.crosshair.gap}
                    onChange={(e) => updateCrosshair({ gap: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-mono text-slate-300">CENTER DOT</span>
                  <input
                    type="checkbox"
                    checked={currentLoadout.crosshair.dot}
                    onChange={(e) => updateCrosshair({ dot: e.target.checked })}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-mono text-slate-300">DYNAMIC RECOIL SPREAD</span>
                  <input
                    type="checkbox"
                    checked={currentLoadout.crosshair.dynamicSpread}
                    onChange={(e) => updateCrosshair({ dynamicSpread: e.target.checked })}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </label>
              </div>
            </div>

            {/* Live Interactive Preview Screen */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[350px]">
              <div className="text-xs font-mono text-slate-500 absolute top-4 left-4">LIVE RETICLE PREVIEW</div>

              <div className="w-64 h-64 rounded-2xl bg-slate-950 border border-slate-800/80 relative flex items-center justify-center overflow-hidden shadow-inner">
                {/* Crosshair Mock in Preview */}
                {/* Top */}
                <div
                  className="absolute -translate-x-1/2 rounded-full"
                  style={{
                    backgroundColor: currentLoadout.crosshair.color,
                    width: `${currentLoadout.crosshair.thickness}px`,
                    height: `${currentLoadout.crosshair.size}px`,
                    bottom: `calc(50% + ${currentLoadout.crosshair.gap}px)`,
                    left: '50%'
                  }}
                />
                {/* Bottom */}
                <div
                  className="absolute -translate-x-1/2 rounded-full"
                  style={{
                    backgroundColor: currentLoadout.crosshair.color,
                    width: `${currentLoadout.crosshair.thickness}px`,
                    height: `${currentLoadout.crosshair.size}px`,
                    top: `calc(50% + ${currentLoadout.crosshair.gap}px)`,
                    left: '50%'
                  }}
                />
                {/* Left */}
                <div
                  className="absolute -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: currentLoadout.crosshair.color,
                    width: `${currentLoadout.crosshair.size}px`,
                    height: `${currentLoadout.crosshair.thickness}px`,
                    right: `calc(50% + ${currentLoadout.crosshair.gap}px)`,
                    top: '50%'
                  }}
                />
                {/* Right */}
                <div
                  className="absolute -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: currentLoadout.crosshair.color,
                    width: `${currentLoadout.crosshair.size}px`,
                    height: `${currentLoadout.crosshair.thickness}px`,
                    left: `calc(50% + ${currentLoadout.crosshair.gap}px)`,
                    top: '50%'
                  }}
                />
                {/* Center Dot */}
                {currentLoadout.crosshair.dot && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      backgroundColor: currentLoadout.crosshair.color,
                      width: `${currentLoadout.crosshair.thickness + 2}px`,
                      height: `${currentLoadout.crosshair.thickness + 2}px`,
                      left: '50%',
                      top: '50%'
                    }}
                  />
                )}
              </div>

              <span className="text-[11px] text-slate-500 font-mono mt-4">
                Rendered with 1:1 in-game weapon alignment
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
