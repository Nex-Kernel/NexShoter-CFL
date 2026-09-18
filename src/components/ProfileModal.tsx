import React, { useState } from 'react';
import { PlayerStats, Achievement, GameSettings, AntiCheatAnomaly } from '../types';
import { User, Award, Cloud, Share2, Moon, Sun, Eye, Copy, Check, RefreshCw, Trophy, Target, Zap, Shield, LogIn, LogOut, CheckCircle2, AlertTriangle, ShieldAlert, ShieldCheck, Activity, Download, RotateCcw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FirebaseUser } from '../firebase';

interface ProfileModalProps {
  stats: PlayerStats;
  achievements: Achievement[];
  settings: GameSettings;
  currentUser?: FirebaseUser | null;
  onOpenAuthModal?: () => void;
  onManualCloudSync?: () => Promise<void>;
  onUpdateStats: (newStats: PlayerStats) => void;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClaimAchievement: (achId: string) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  stats,
  achievements,
  settings,
  currentUser,
  onOpenAuthModal,
  onManualCloudSync,
  onUpdateStats,
  onUpdateSettings,
  onClaimAchievement,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'moderation' | 'cloud' | 'settings'>('stats');
  const [copiedSync, setCopiedSync] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [auditActionFeedback, setAuditActionFeedback] = useState<string | null>(null);
  const [importToken, setImportToken] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncFeedback, setCloudSyncFeedback] = useState<string | null>(null);

  const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toString();
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  const headshotPct = stats.kills > 0 ? Math.round((stats.headshots / stats.kills) * 100) : 0;

  // Cloud Save String Export
  const exportCloudSave = () => {
    const data = JSON.stringify({ stats, savedAt: Date.now() });
    const b64 = btoa(unescape(encodeURIComponent(data)));
    navigator.clipboard.writeText(b64);
    setCopiedSync(true);
    setTimeout(() => setCopiedSync(false), 2500);
  };

  // Cloud Save Import
  const handleImportSave = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(importToken.trim())));
      const parsed = JSON.parse(decoded);
      if (parsed.stats && typeof parsed.stats.level === 'number') {
        onUpdateStats(parsed.stats);
        setImportMessage('Progress restored successfully from cloud token!');
        setImportToken('');
        confetti({ particleCount: 50, spread: 60 });
        setTimeout(() => setImportMessage(null), 3000);
      } else {
        setImportMessage('Invalid save token format.');
      }
    } catch {
      setImportMessage('Failed to decode cloud save token.');
    }
  };

  // Social Share Intent
  const handleShareTwitter = () => {
    const text = `I just reached Level ${stats.level} in VengeStrike 3D with a ${kd} K/D ratio and ${stats.wins} wins! Jump into the parkour arena:`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCopyShareCard = () => {
    const text = `🎮 VengeStrike 3D Combat Record 🎮\nOperative: ${stats.username}\nLevel: ${stats.level} | Wins: ${stats.wins}\nK/D: ${kd} | Headshot %: ${headshotPct}%\nParkour Traversed: ${Math.round(stats.wallRunMeters)}m\nPlay now at: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Moderation Audit JSON Export
  const handleExportAudit = () => {
    const payload = JSON.stringify({
      operative: stats.username,
      trustScore: stats.antiCheatSummary?.trustScore ?? 100,
      status: stats.antiCheatSummary?.status ?? 'clean',
      totalAnomalies: stats.antiCheatSummary?.totalAnomalies ?? 0,
      velocityFlags: stats.antiCheatSummary?.velocityFlags ?? 0,
      snapAimFlags: stats.antiCheatSummary?.snapAimFlags ?? 0,
      anomalies: stats.antiCheatAnomalies || [],
      exportedAt: new Date().toISOString()
    }, null, 2);

    navigator.clipboard.writeText(payload);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2500);
  };

  // Simulate test anomalies for moderation testing
  const handleSimulateVelocityAnomaly = () => {
    const fakeAnomaly: AntiCheatAnomaly = {
      id: 'ac_test_vel_' + Math.random().toString(36).substring(2, 8),
      timestamp: Date.now(),
      type: 'suspicious_velocity',
      severity: 'suspicious',
      metric: 'Velocity: 46.2 m/s (Threshold: 28.0 m/s)',
      recordedValue: 46.2,
      threshold: 28.0,
      description: 'Simulated anomalous player velocity spike without valid kinetic booster.',
      matchTimeSec: 245,
      playerPosition: [14.5, 2.0, -8.4],
      metadata: {
        velocityMagnitude: 47.1
      }
    };

    const prevAnomalies = stats.antiCheatAnomalies || [];
    const updatedAnomalies = [fakeAnomaly, ...prevAnomalies].slice(0, 50);
    const prevSummary = stats.antiCheatSummary || {
      trustScore: 100,
      totalAnomalies: 0,
      velocityFlags: 0,
      snapAimFlags: 0,
      lastFlaggedTimestamp: null,
      status: 'clean'
    };

    const totalAnomalies = (prevSummary.totalAnomalies || 0) + 1;
    const velocityFlags = (prevSummary.velocityFlags || 0) + 1;
    const trustScore = Math.max(0, (prevSummary.trustScore ?? 100) - 12);
    const status = trustScore < 40 ? 'under_investigation' : trustScore < 70 ? 'suspicious' : 'flagged_for_review';

    onUpdateStats({
      ...stats,
      antiCheatAnomalies: updatedAnomalies,
      antiCheatSummary: {
        ...prevSummary,
        trustScore,
        totalAnomalies,
        velocityFlags,
        lastFlaggedTimestamp: fakeAnomaly.timestamp,
        status
      }
    });

    setAuditActionFeedback('Simulated velocity anomaly logged to player stats!');
    setTimeout(() => setAuditActionFeedback(null), 3000);
  };

  const handleSimulateSnapAimAnomaly = () => {
    const fakeAnomaly: AntiCheatAnomaly = {
      id: 'ac_test_aim_' + Math.random().toString(36).substring(2, 8),
      timestamp: Date.now(),
      type: 'snap_aim_anomaly',
      severity: 'critical',
      metric: 'Snap Angular Velocity: 3640°/s (Delta: 48.2°)',
      recordedValue: 3640,
      threshold: 2200,
      description: 'Simulated superhuman snap-aim lock terminating instantaneously onto target headbox.',
      matchTimeSec: 180,
      playerPosition: [-6.2, 1.8, 11.3],
      metadata: {
        targetName: 'Phantom_Bot',
        isHeadshot: true,
        angularSpeedDegPerSec: 3640,
        weaponId: 'sniper'
      }
    };

    const prevAnomalies = stats.antiCheatAnomalies || [];
    const updatedAnomalies = [fakeAnomaly, ...prevAnomalies].slice(0, 50);
    const prevSummary = stats.antiCheatSummary || {
      trustScore: 100,
      totalAnomalies: 0,
      velocityFlags: 0,
      snapAimFlags: 0,
      lastFlaggedTimestamp: null,
      status: 'clean'
    };

    const totalAnomalies = (prevSummary.totalAnomalies || 0) + 1;
    const snapAimFlags = (prevSummary.snapAimFlags || 0) + 1;
    const trustScore = Math.max(0, (prevSummary.trustScore ?? 100) - 25);
    const status = trustScore < 40 ? 'under_investigation' : trustScore < 70 ? 'suspicious' : 'flagged_for_review';

    onUpdateStats({
      ...stats,
      antiCheatAnomalies: updatedAnomalies,
      antiCheatSummary: {
        ...prevSummary,
        trustScore,
        totalAnomalies,
        snapAimFlags,
        lastFlaggedTimestamp: fakeAnomaly.timestamp,
        status
      }
    });

    setAuditActionFeedback('Simulated snap-aim anomaly logged to player stats!');
    setTimeout(() => setAuditActionFeedback(null), 3000);
  };

  const handleClearAuditFlags = () => {
    onUpdateStats({
      ...stats,
      antiCheatAnomalies: [],
      antiCheatSummary: {
        trustScore: 100,
        totalAnomalies: 0,
        velocityFlags: 0,
        snapAimFlags: 0,
        lastFlaggedTimestamp: null,
        status: 'clean'
      }
    });
    setAuditActionFeedback('Audit telemetry cleared and trust score restored to 100%!');
    setTimeout(() => setAuditActionFeedback(null), 3000);
  };

  const totalAnomaliesCount = stats.antiCheatSummary?.totalAnomalies ?? stats.antiCheatAnomalies?.length ?? 0;

  return (
    <div id="profile-modal" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">OPERATIVE PROFILE & STATS</h1>
            <p className="text-xs text-slate-400">Career progression, lifetime combat telemetry, and cloud backup</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            CAREER STATS
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              activeTab === 'achievements' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ACHIEVEMENTS
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeTab === 'moderation' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>MODERATION</span>
            {totalAnomaliesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                {totalAnomaliesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              activeTab === 'cloud' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            CLOUD SYNC
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            SETTINGS
          </button>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono font-bold transition"
        >
          RETURN
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Identity Card */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-2xl font-mono text-white shadow-lg">
                  {stats.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={stats.username}
                      onChange={(e) => onUpdateStats({ ...stats, username: e.target.value })}
                      className="text-xl font-bold font-heading text-white bg-transparent border-b border-slate-700 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      LVL {stats.level}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Combat XP: {stats.xp} / {stats.level * 1000}
                  </div>
                  <div className="w-48 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${Math.min(100, (stats.xp / (stats.level * 1000)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareTwitter}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-mono border border-slate-700 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>SHARE ON X</span>
                </button>
                <button
                  onClick={handleCopyShareCard}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono border border-slate-700 transition"
                >
                  {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedShare ? 'COPIED CARD' : 'COPY RECAP'}</span>
                </button>
              </div>
            </div>

            {/* Metrics Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">K/D RATIO</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{kd}</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">TOTAL KILLS</span>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{stats.kills}</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">ARENA WINS</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{stats.wins}</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">HEADSHOT %</span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{headshotPct}%</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">SLIDE KILLS</span>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{stats.slideKills}</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">WALL-RUN METERS</span>
                <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{Math.round(stats.wallRunMeters)}m</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">BEST STREAK</span>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{stats.bestStreak}x</div>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">MATCHES PLAYED</span>
                <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{stats.matchesPlayed}</div>
              </div>
              <div 
                onClick={() => setActiveTab('moderation')}
                className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">FAIR PLAY TRUST</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${
                  (stats.antiCheatSummary?.trustScore ?? 100) >= 80 ? 'text-emerald-400' :
                  (stats.antiCheatSummary?.trustScore ?? 100) >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {stats.antiCheatSummary?.trustScore ?? 100}%
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase flex items-center justify-between">
                  <span>{stats.antiCheatSummary?.status?.replace(/_/g, ' ') || 'CLEAN'}</span>
                  <span>{stats.antiCheatSummary?.totalAnomalies || 0} Flags</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">HONORS & MILESTONES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach) => {
                const isCompleted = ach.progress >= ach.target;
                return (
                  <div
                    key={ach.id}
                    className={`p-5 rounded-2xl border transition ${
                      isCompleted ? 'bg-slate-900/90 border-amber-500/40' : 'bg-slate-900/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold font-heading text-white">{ach.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                      </div>
                      <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded font-mono text-xs font-bold">
                        +{ach.rewardGems} Gems
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Progress: {ach.progress} / {ach.target}</span>
                      {isCompleted && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> UNLOCKED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header & Status Banner */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${
                    (stats.antiCheatSummary?.trustScore ?? 100) >= 80
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : (stats.antiCheatSummary?.trustScore ?? 100) >= 50
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}>
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold font-heading text-white tracking-wide">
                        OPERATIVE ANTI-CHEAT TELEMETRY AUDIT
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${
                        stats.antiCheatSummary?.status === 'under_investigation'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : stats.antiCheatSummary?.status === 'suspicious'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : stats.antiCheatSummary?.status === 'flagged_for_review'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      }`}>
                        {stats.antiCheatSummary?.status?.replace(/_/g, ' ') || 'CLEAN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Client-side kinematic listener monitoring anomalous velocity, teleportation, and superhuman snap-aim targeting
                    </p>
                  </div>
                </div>

                {/* Export / Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportAudit}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition"
                  >
                    {copiedAudit ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedAudit ? 'COPIED AUDIT JSON' : 'EXPORT AUDIT JSON'}</span>
                  </button>
                  <button
                    onClick={handleClearAuditFlags}
                    className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-mono font-bold transition"
                    title="Clear flags and restore trust score to 100%"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>RESET FLAGS</span>
                  </button>
                </div>
              </div>

              {auditActionFeedback && (
                <div className="mb-4 p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-xs font-mono text-indigo-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>{auditActionFeedback}</span>
                </div>
              )}

              {/* 4 Metrics Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">FAIR PLAY TRUST SCORE</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className={`text-3xl font-bold font-mono mt-1 ${
                    (stats.antiCheatSummary?.trustScore ?? 100) >= 80 ? 'text-emerald-400' :
                    (stats.antiCheatSummary?.trustScore ?? 100) >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {stats.antiCheatSummary?.trustScore ?? 100}%
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (stats.antiCheatSummary?.trustScore ?? 100) >= 80 ? 'bg-emerald-400' :
                        (stats.antiCheatSummary?.trustScore ?? 100) >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${stats.antiCheatSummary?.trustScore ?? 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">TOTAL ANOMALIES</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-slate-100 mt-1">
                    {stats.antiCheatSummary?.totalAnomalies ?? 0}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    {stats.antiCheatSummary?.lastFlaggedTimestamp
                      ? `Last: ${new Date(stats.antiCheatSummary.lastFlaggedTimestamp).toLocaleTimeString()}`
                      : 'No infractions on record'}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">VELOCITY FLAGS</span>
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-cyan-300 mt-1">
                    {stats.antiCheatSummary?.velocityFlags ?? 0}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    Ceiling: 28.0 m/s (38.0 boosted)
                  </span>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">SNAP-AIM FLAGS</span>
                    <Target className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold font-mono text-purple-300 mt-1">
                    {stats.antiCheatSummary?.snapAimFlags ?? 0}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                    Ceiling: 2,200°/s angular lock
                  </span>
                </div>
              </div>

              {/* Dev Simulation Bar */}
              <div className="mt-5 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono text-slate-300 font-bold">TELEMETRY SIMULATOR:</span>
                  <span className="text-xs text-slate-500">Inject test telemetry spikes to test listener moderation pipeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateVelocityAnomaly}
                    className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-bold transition"
                  >
                    + TEST VELOCITY SPIKE
                  </button>
                  <button
                    onClick={handleSimulateSnapAimAnomaly}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-mono font-bold transition"
                  >
                    + TEST SNAP-AIM LOCK
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  TELEMETRY INCIDENT LOG ({stats.antiCheatAnomalies?.length || 0})
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  Engine Observer Pattern • In-Memory & Cloud Persisted
                </span>
              </div>

              {(!stats.antiCheatAnomalies || stats.antiCheatAnomalies.length === 0) ? (
                <div className="py-12 px-4 text-center bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h5 className="text-sm font-bold text-slate-200">No Telemetry Anomalies Detected</h5>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Operative movement velocity and aim kinematics comply strictly with arena fair-play parameters.
                    No speed hacks, teleportation, or aim-bot anomalies recorded.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.antiCheatAnomalies.map((anomaly) => {
                    const isCrit = anomaly.severity === 'critical';
                    const isSusp = anomaly.severity === 'suspicious';

                    return (
                      <div
                        key={anomaly.id}
                        className={`p-4 rounded-2xl border transition ${
                          isCrit
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : isSusp
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border ${
                              isCrit
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isSusp
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                            }`}>
                              {anomaly.severity}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                              {anomaly.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              #{anomaly.id.slice(-6)}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(anomaly.timestamp).toLocaleTimeString()} • Match t+{anomaly.matchTimeSec}s
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mb-2.5">
                          {anomaly.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-slate-400">
                          <div>
                            <span className="text-slate-500">METRIC: </span>
                            <span className="text-amber-300 font-bold">{anomaly.metric}</span>
                          </div>
                          {anomaly.playerPosition && (
                            <div>
                              <span className="text-slate-500">COORDS: </span>
                              <span className="text-cyan-400">
                                [{anomaly.playerPosition.join(', ')}]
                              </span>
                            </div>
                          )}
                          {anomaly.metadata?.targetName && (
                            <div>
                              <span className="text-slate-500">TARGET: </span>
                              <span className="text-purple-300 font-bold">
                                {String(anomaly.metadata.targetName)}
                                {anomaly.metadata.isHeadshot ? ' (HEADSHOT)' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cloud' && (
          <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-xl">
                <Cloud className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-white">CROSS-DEVICE CLOUD TELEMETRY & ACCOUNT</h3>
                <p className="text-xs text-slate-400">Persistent online profile, cross-device sync, and career preservation</p>
              </div>
            </div>

            {/* Operative Account Status Card */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base font-mono ${
                    currentUser ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {currentUser ? (currentUser.displayName || currentUser.email || 'OP').substring(0, 2).toUpperCase() : <Shield className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {currentUser ? (currentUser.displayName || 'Authenticated Operative') : 'GUEST OPERATIVE'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        currentUser
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {currentUser ? 'CLOUD SYNC ACTIVE' : 'LOCAL SAVE ONLY'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {currentUser ? currentUser.email : 'Sign in or enlist to keep your career progress safe'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser ? (
                    <>
                      <button
                        onClick={async () => {
                          if (onManualCloudSync) {
                            setIsCloudSyncing(true);
                            try {
                              await onManualCloudSync();
                              setCloudSyncFeedback('Cloud sync successful!');
                              setTimeout(() => setCloudSyncFeedback(null), 2500);
                            } catch (e: any) {
                              setCloudSyncFeedback('Sync error: ' + (e.message || 'Failed'));
                            } finally {
                              setIsCloudSyncing(false);
                            }
                          }
                        }}
                        disabled={isCloudSyncing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-mono font-bold transition border border-slate-700"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                        <span>{isCloudSyncing ? 'SYNCING...' : 'SYNC CLOUD'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenAuthModal) onOpenAuthModal();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 rounded-xl text-xs font-mono font-bold transition border border-rose-800/60"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>MANAGE / LOG OUT</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenAuthModal) onOpenAuthModal();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-mono font-bold transition shadow-lg shadow-cyan-500/20"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>SIGN IN / ENLIST</span>
                    </button>
                  )}
                </div>
              </div>

              {cloudSyncFeedback && (
                <div className="text-xs font-mono text-emerald-400 mt-2 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/50">
                  {cloudSyncFeedback}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono text-slate-300 block">MANUAL EXPORT TOKEN (OFFLINE BACKUP)</span>
              <p className="text-xs text-slate-500">
                Copy an encrypted progress string to manually back up or transfer your offline telemetry without logging in.
              </p>
              <button
                onClick={exportCloudSave}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold transition border border-slate-700"
              >
                {copiedSync ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSync ? 'COPIED TO CLIPBOARD' : 'COPY BACKUP TOKEN'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono text-slate-300 block">RESTORE FROM TOKEN</span>
              <input
                type="text"
                value={importToken}
                onChange={(e) => setImportToken(e.target.value)}
                placeholder="Paste your base64 save token here..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleImportSave}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold transition"
              >
                RESTORE SAVE
              </button>
              {importMessage && (
                <div className="text-xs font-mono text-emerald-400 mt-1">{importMessage}</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold font-heading text-white">VISUAL & ACCESSIBILITY PREFERENCES</h3>

            <div className="space-y-4 font-mono text-xs">
              <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-slate-200 font-bold">DARK MODE THEME</div>
                    <div className="text-[10px] text-slate-500">Optimizes contrast and reduces eye fatigue</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => onUpdateSettings({ ...settings, darkMode: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-slate-200 font-bold">HIGH CONTRAST ENEMY OUTLINES</div>
                    <div className="text-[10px] text-slate-500">Enhances visibility for color-blind operatives</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => onUpdateSettings({ ...settings, highContrast: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              {/* FOV slider */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">FIELD OF VIEW (FOV)</span>
                  <span className="text-cyan-400 font-bold">{settings.fov}°</span>
                </div>
                <input
                  type="range"
                  min="65"
                  max="110"
                  value={settings.fov}
                  onChange={(e) => onUpdateSettings({ ...settings, fov: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Sensitivity slider */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">MOUSE SENSITIVITY</span>
                  <span className="text-cyan-400 font-bold">{settings.mouseSensitivity}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={settings.mouseSensitivity}
                  onChange={(e) => onUpdateSettings({ ...settings, mouseSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
