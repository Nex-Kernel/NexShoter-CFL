import React, { useState } from 'react';
import { CharacterSkin, WeaponSkin, PlayerStats } from '../types';
import { CHARACTER_SKINS, WEAPON_SKINS } from '../data/constants';
import { ShoppingBag, Coins, Gem, Sparkles, Check, Lock, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShopMenuProps {
  stats: PlayerStats;
  currentSkinId: string;
  currentWeaponSkinId: string;
  onEquipCharacterSkin: (skinId: string) => void;
  onEquipWeaponSkin: (skinId: string) => void;
  onPurchaseSkin: (skin: CharacterSkin | WeaponSkin, type: 'char' | 'weapon') => boolean;
  onClose: () => void;
}

export const ShopMenu: React.FC<ShopMenuProps> = ({
  stats,
  currentSkinId,
  currentWeaponSkinId,
  onEquipCharacterSkin,
  onEquipWeaponSkin,
  onPurchaseSkin,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'weapons'>('characters');
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  const handleBuy = (item: CharacterSkin | WeaponSkin, type: 'char' | 'weapon') => {
    const ok = onPurchaseSkin(item, type);
    if (ok) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setPurchaseSuccessMessage(`Unlocked: ${item.name}!`);
      setTimeout(() => setPurchaseSuccessMessage(null), 2500);
    }
  };

  return (
    <div id="shop-menu" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Top Header with Currencies */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">SUPPLY BLACK MARKET</h1>
            <p className="text-xs text-slate-400">Exclusive operatives, weapon finishes, and combat suits</p>
          </div>
        </div>

        {/* Currency Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/30">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-amber-300 text-sm">{stats.coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-cyan-500/30">
            <Gem className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-bold text-cyan-300 text-sm">{stats.gems}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono font-bold transition ml-2"
          >
            RETURN
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-8 pt-4 flex gap-4 border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('characters')}
          className={`pb-3 text-sm font-bold font-heading tracking-wider transition relative ${
            activeTab === 'characters' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          OPERATIVE SUITS ({CHARACTER_SKINS.length})
        </button>
        <button
          onClick={() => setActiveTab('weapons')}
          className={`pb-3 text-sm font-bold font-heading tracking-wider transition relative ${
            activeTab === 'weapons' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          WEAPON SKINS ({WEAPON_SKINS.length})
        </button>
      </div>

      {purchaseSuccessMessage && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 py-2 text-center text-xs font-mono text-emerald-300 animate-in fade-in duration-150">
          ✨ {purchaseSuccessMessage}
        </div>
      )}

      {/* Shop Grid */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'characters' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {CHARACTER_SKINS.map((skin) => {
                const isUnlocked = stats.unlockedSkins.includes(skin.id);
                const isEquipped = currentSkinId === skin.id;
                const canAfford = skin.currency === 'coins' ? stats.coins >= skin.price : stats.gems >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`rounded-3xl border p-5 flex flex-col justify-between transition relative overflow-hidden group ${
                      isEquipped
                        ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-500/10'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Visual Model Preview Card */}
                    <div
                      className="h-44 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border border-white/5"
                      style={{ background: `linear-gradient(135deg, ${skin.color}22 0%, #090d16 100%)` }}
                    >
                      {/* Character Silhouette Preview */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-10 h-10 rounded-xl shadow-lg border border-white/20"
                          style={{ backgroundColor: skin.color }}
                        />
                        <div
                          className="w-14 h-16 rounded-xl mt-1 shadow-lg"
                          style={{ backgroundColor: skin.accentColor }}
                        />
                      </div>

                      {/* Rarity Pill */}
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-[10px] font-mono uppercase font-bold text-slate-300">
                        {skin.rarity}
                      </div>

                      {isEquipped && (
                        <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-[10px] font-mono uppercase font-bold text-cyan-300">
                          EQUIPPED
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-bold font-heading text-white">{skin.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-4">{skin.description}</p>
                    </div>

                    {/* Action Button */}
                    {isUnlocked ? (
                      <button
                        onClick={() => onEquipCharacterSkin(skin.id)}
                        disabled={isEquipped}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                          isEquipped
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        {isEquipped ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>{isEquipped ? 'ACTIVE' : 'EQUIP SUIT'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(skin, 'char')}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md'
                            : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        {skin.currency === 'coins' ? <Coins className="w-4 h-4" /> : <Gem className="w-4 h-4" />}
                        <span>UNLOCK FOR {skin.price} {skin.currency.toUpperCase()}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {WEAPON_SKINS.map((skin) => {
                const isUnlocked = stats.unlockedWeaponSkins.includes(skin.id);
                const isEquipped = currentWeaponSkinId === skin.id;
                const canAfford = skin.currency === 'coins' ? stats.coins >= skin.price : stats.gems >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`rounded-3xl border p-5 flex flex-col justify-between transition relative overflow-hidden ${
                      isEquipped
                        ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-500/10'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="h-44 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border border-white/5"
                      style={{ background: `linear-gradient(135deg, ${skin.primaryColor}33 0%, #090d16 100%)` }}
                    >
                      <div className="w-32 h-6 rounded-lg shadow-xl" style={{ backgroundColor: skin.primaryColor }} />
                      <div className="w-16 h-4 rounded mt-2 ml-4" style={{ backgroundColor: skin.secondaryColor }} />

                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-[10px] font-mono uppercase font-bold text-slate-300">
                        {skin.rarity}
                      </div>

                      {isEquipped && (
                        <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-[10px] font-mono uppercase font-bold text-cyan-300">
                          EQUIPPED
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-bold font-heading text-white">{skin.name}</h4>
                      <p className="text-xs text-slate-400 uppercase font-mono mt-1 mb-4">Weapon: {skin.weaponId}</p>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => onEquipWeaponSkin(skin.id)}
                        disabled={isEquipped}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                          isEquipped
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        {isEquipped ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        <span>{isEquipped ? 'EQUIPPED' : 'EQUIP FINISH'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(skin, 'weapon')}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md'
                            : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        {skin.currency === 'coins' ? <Coins className="w-4 h-4" /> : <Gem className="w-4 h-4" />}
                        <span>UNLOCK FOR {skin.price} {skin.currency.toUpperCase()}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
