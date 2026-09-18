import React, { useState, useEffect, useRef } from 'react';
import { MatchHighlight, PlayTimelineStep } from '../types';
import { Flame, Sparkles, Play, Pause, RotateCcw, Target, Crosshair, Clock, Award, Shield, ChevronRight, ChevronLeft, Copy, Check, Share2, Zap, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../game/audio';

interface MatchHighlightsViewProps {
  highlights: MatchHighlight[];
  onPlayAgain?: () => void;
}

export const MatchHighlightsView: React.FC<MatchHighlightsViewProps> = ({
  highlights,
}) => {
  const [selectedPlay, setSelectedPlay] = useState<MatchHighlight | null>(highlights[0] || null);
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0); // 0 to 1
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [copiedPlayId, setCopiedPlayId] = useState<string | null>(null);

  const replayTimerRef = useRef<number | null>(null);
  const replayStartTimeRef = useRef<number>(0);
  const triggeredStepsRef = useRef<Set<number>>(new Set());

  // Reset replay when selected play changes
  useEffect(() => {
    stopReplay();
    setReplayProgress(0);
    setActiveStepIndex(-1);
    triggeredStepsRef.current.clear();
  }, [selectedPlay?.id]);

  const stopReplay = () => {
    if (replayTimerRef.current !== null) {
      cancelAnimationFrame(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    setIsPlayingReplay(false);
  };

  const startReplay = () => {
    if (!selectedPlay) return;
    setIsPlayingReplay(true);
    setReplayProgress(0);
    setActiveStepIndex(-1);
    triggeredStepsRef.current.clear();
    replayStartTimeRef.current = performance.now();

    const replayDurationMs = Math.max(3000, selectedPlay.durationSec * 1000);

    const stepSimulation = (now: number) => {
      const elapsed = now - replayStartTimeRef.current;
      const progress = Math.min(1, elapsed / replayDurationMs);
      setReplayProgress(progress);

      const currentSec = progress * selectedPlay.durationSec;

      // Find current active step
      selectedPlay.timeline.forEach((step, idx) => {
        if (currentSec >= step.offsetSec && !triggeredStepsRef.current.has(idx)) {
          triggeredStepsRef.current.add(idx);
          setActiveStepIndex(idx);

          // Audio triggers
          if (audioEnabled) {
            if (step.type === 'headshot_kill') {
              sound.playHitmarker(true);
              sound.playKillstreak(selectedPlay.streakCount || 2);
            } else if (step.type === 'kill') {
              sound.playHitmarker(false);
              sound.playKillstreak(Math.min(5, Math.max(1, selectedPlay.streakCount)));
            } else if (step.type === 'hit') {
              sound.playHitmarker(false);
            } else if (step.type === 'slide_action') {
              sound.playRadioClick(true);
            }
          }
        }
      });

      if (progress < 1) {
        replayTimerRef.current = requestAnimationFrame(stepSimulation);
      } else {
        setIsPlayingReplay(false);
      }
    };

    replayTimerRef.current = requestAnimationFrame(stepSimulation);
  };

  const handleCopyPlay = (play: MatchHighlight, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const rankTitle = play.rank === 1 ? '👑 MVP PLAY' : play.rank === 2 ? '🥈 RUNNER-UP PLAY' : '🥉 HIGHLIGHT PLAY';
    const text = `🔥 VengeStrike 3D ${rankTitle} #${play.rank}: ${play.title} (${play.badge})\n` +
      `🎯 Combat Grade: ${play.grade} (${play.score} Pts)\n` +
      `⚡ ${play.killsCount} Frags | ${play.damageDealt} DMG in ${play.durationSec}s\n` +
      `🔫 Weapon: ${play.weaponName} | Streak: ${play.streakCount}x\n` +
      `💀 Eliminated: ${play.victims.join(', ')}\n` +
      `Play free in browser: ${window.location.href}`;

    navigator.clipboard.writeText(text);
    setCopiedPlayId(play.id);
    setTimeout(() => setCopiedPlayId(null), 2200);
  };

  const handleShareX = (play: MatchHighlight) => {
    const rankTitle = play.rank === 1 ? 'MVP Play' : `Top Play #${play.rank}`;
    const text = `Check out my ${rankTitle} in VengeStrike 3D: "${play.title}"! Scored ${play.score} PTS with ${play.killsCount} frags and ${play.damageDealt} DMG using ${play.weaponName}. Can you top that?`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  if (highlights.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800">
        <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-mono text-slate-400">No combat highlights recorded for this session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Top 3 Plays Carousel / Selector Tabs */}
      <div className="grid grid-cols-3 gap-2.5">
        {highlights.map((play) => {
          const isSelected = selectedPlay?.id === play.id;
          const isRank1 = play.rank === 1;
          const isRank2 = play.rank === 2;

          return (
            <button
              key={play.id}
              onClick={() => setSelectedPlay(play)}
              className={`relative p-3 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? isRank1
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : isRank2
                    ? 'bg-slate-800/80 border-cyan-400/80 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-800/80 border-amber-600/70 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Rank Header */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                      isRank1
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : isRank2
                        ? 'bg-slate-300 text-slate-950'
                        : 'bg-amber-700/80 text-white'
                    }`}
                  >
                    #{play.rank} {isRank1 ? 'MVP' : ''}
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-black ${
                    play.grade === 'S+'
                      ? 'text-amber-400'
                      : play.grade === 'S'
                      ? 'text-cyan-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {play.grade}
                </span>
              </div>

              {/* Title & Badge */}
              <div className="text-xs font-bold font-heading text-slate-100 truncate mb-1">
                {play.title}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{play.killsCount} Frags</span>
                <span className="text-amber-300/90 font-bold">{play.damageDealt} DMG</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Play Deep-Dive & Timeline Inspection */}
      {selectedPlay && (
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          {/* Header of selected play */}
          <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wide ${
                    selectedPlay.rank === 1
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : selectedPlay.rank === 2
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {selectedPlay.badge}
                </span>

                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Match Time: {selectedPlay.matchTimeFormatted}</span>
                </span>
              </div>

              <h4 className="text-lg font-bold font-heading text-white tracking-wide">
                {selectedPlay.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedPlay.description}
              </p>
            </div>

            {/* Score & Grade pill */}
            <div className="text-right shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="text-[9px] font-mono text-slate-500 uppercase font-bold">PLAY RATING</div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-lg font-black font-mono text-amber-400">{selectedPlay.grade}</span>
                <span className="text-xs font-mono text-slate-300 font-bold">{selectedPlay.score} PTS</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="text-[9px] font-mono text-slate-500">FRAGS</div>
              <div className="text-sm font-bold font-mono text-slate-100">{selectedPlay.killsCount}</div>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="text-[9px] font-mono text-slate-500">TOTAL DMG</div>
              <div className="text-sm font-bold font-mono text-rose-400">{selectedPlay.damageDealt}</div>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="text-[9px] font-mono text-slate-500">WEAPON</div>
              <div className="text-xs font-bold font-mono text-cyan-300 truncate">{selectedPlay.weaponName}</div>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="text-[9px] font-mono text-slate-500">STREAK</div>
              <div className="text-sm font-bold font-mono text-amber-400">{selectedPlay.streakCount}x</div>
            </div>
          </div>

          {/* Replay Simulation Control Panel */}
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={isPlayingReplay ? stopReplay : startReplay}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition shadow-sm ${
                    isPlayingReplay
                      ? 'bg-rose-500 text-slate-950 hover:bg-rose-400'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {isPlayingReplay ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingReplay ? 'PAUSE REPLAY' : 'SIMULATE REPLAY'}</span>
                </button>

                <button
                  onClick={startReplay}
                  title="Replay from start"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  title={audioEnabled ? 'Mute Replay SFX' : 'Enable Replay SFX'}
                  className={`p-1.5 rounded-lg transition ${
                    audioEnabled ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-400">
                <span>Duration: </span>
                <span className="text-slate-200 font-bold">{selectedPlay.durationSec}s</span>
              </div>
            </div>

            {/* Animated Scrubber Bar */}
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-75"
                style={{ width: `${Math.min(100, replayProgress * 100)}%` }}
              />
            </div>
          </div>

          {/* Chronological Action Timeline */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold flex items-center justify-between">
              <span>MOMENT TIMELINE BREAKDOWN</span>
              <span className="text-slate-500">{selectedPlay.timeline.length} Key Events</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {selectedPlay.timeline.map((step, idx) => {
                const isStepActive = activeStepIndex === idx;
                const isPassed = isPlayingReplay && (replayProgress * selectedPlay.durationSec >= step.offsetSec);

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-3 p-2 rounded-xl text-xs font-mono transition-all border ${
                      isStepActive
                        ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 scale-[1.01]'
                        : isPassed
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-slate-500 shrink-0 font-bold w-12">
                        +{step.offsetSec.toFixed(1)}s
                      </span>

                      {step.type === 'headshot_kill' ? (
                        <span className="p-1 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300 shrink-0">
                          <Target className="w-3.5 h-3.5" />
                        </span>
                      ) : step.type === 'kill' ? (
                        <span className="p-1 rounded bg-rose-950/80 border border-rose-800/60 text-rose-300 shrink-0">
                          <Flame className="w-3.5 h-3.5" />
                        </span>
                      ) : step.type === 'slide_action' ? (
                        <span className="p-1 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                          <Crosshair className="w-3.5 h-3.5" />
                        </span>
                      )}

                      <span className="truncate text-xs font-sans text-slate-200">
                        {step.description}
                      </span>
                    </div>

                    {step.damage && (
                      <span className="shrink-0 text-[11px] font-bold text-rose-400">
                        -{step.damage} HP
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social share for this specific play */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="text-[11px] font-mono text-slate-400 truncate">
              <span>Opponents down: </span>
              <span className="text-slate-200 font-bold">{selectedPlay.victims.join(', ')}</span>
            </div>

            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={(e) => handleCopyPlay(selectedPlay, e)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[11px] font-mono font-bold transition"
                title="Copy highlight summary"
              >
                {copiedPlayId === selectedPlay.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleShareX(selectedPlay)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 rounded-xl text-[11px] font-mono font-bold transition"
                title="Share highlight on X"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>SHARE MOMENT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
