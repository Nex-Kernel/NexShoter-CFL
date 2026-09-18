import React, { useState, useEffect, useRef } from 'react';
import { GameSettings } from '../types';
import { Mic, MicOff, Volume2, Radio, Check, AlertCircle } from 'lucide-react';
import { sound } from '../game/audio';

interface VoiceChatModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const [micLevel, setMicLevel] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [simulatedTeammates, setSimulatedTeammates] = useState([
    { name: 'ApexStriker', status: 'Connected', isTalking: false },
    { name: 'ShadowViper', status: 'Connected', isTalking: true },
    { name: 'NeonPulse', status: 'Connected', isTalking: false },
  ]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startMicTest = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicActive(true);
      sound.playRadioClick(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch {
      setMicError('Microphone access denied or device not found. Tactical radio fallback active.');
    }
  };

  const stopMicTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setMicActive(false);
    setMicLevel(0);
    sound.playRadioClick(false);
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  return (
    <div id="voice-chat-modal" className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col text-slate-100 overflow-hidden font-rajdhani">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl">
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-wide">TACTICAL SQUAD VOICE COMMS</h1>
            <p className="text-xs text-slate-400">Integrated team radio & low-latency spatial audio setup</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-mono font-bold transition"
        >
          SAVE & CLOSE
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Audio Input Device & Test */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-bold font-heading text-white tracking-wider uppercase">
              MICROPHONE CALIBRATION
            </h3>

            {/* Test Mic Button */}
            <div>
              {micActive ? (
                <button
                  onClick={stopMicTest}
                  className="w-full py-3 bg-rose-600/80 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <MicOff className="w-4 h-4" />
                  <span>STOP LIVE MIC TEST</span>
                </button>
              ) : (
                <button
                  onClick={startMicTest}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-600/20"
                >
                  <Mic className="w-4 h-4" />
                  <span>TEST REAL MICROPHONE INPUT</span>
                </button>
              )}
            </div>

            {/* Live Volume VU Meter */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400">INPUT GAIN LEVEL</span>
                <span className="text-cyan-400 font-bold">{micLevel}%</span>
              </div>
              <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800 flex gap-0.5">
                {Array.from({ length: 24 }).map((_, idx) => {
                  const step = (idx / 24) * 100;
                  const isFilled = micLevel >= step;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-sm transition-all duration-75 ${
                        isFilled
                          ? idx > 18
                            ? 'bg-rose-500'
                            : idx > 12
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                          : 'bg-slate-900'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {micError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{micError}</span>
              </div>
            )}

            {/* Radio settings */}
            <div className="space-y-4 pt-4 border-t border-slate-800 font-mono text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">ENABLE TEAM VOICE CHAT</span>
                <input
                  type="checkbox"
                  checked={settings.voiceChatEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, voiceChatEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400"
                />
              </label>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">VOICE VOLUME</span>
                  <span className="text-cyan-400 font-bold">{settings.voiceChatVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.voiceChatVolume}
                  onChange={(e) => onUpdateSettings({ ...settings, voiceChatVolume: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">PUSH-TO-TALK KEY</span>
                <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded font-bold">
                  [{settings.pushToTalkKey}]
                </span>
              </div>
            </div>
          </div>

          {/* Active Channel Squad Roster */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold font-heading text-white tracking-wider uppercase">
                  SQUAD RADIO CHANNEL #104
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                  LOW LATENCY (18ms)
                </span>
              </div>

              <div className="space-y-3">
                {simulatedTeammates.map((mate, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${mate.isTalking ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                      <div>
                        <div className="text-sm font-bold text-slate-200">{mate.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{mate.status}</div>
                      </div>
                    </div>
                    {mate.isTalking && (
                      <span className="text-xs font-mono text-emerald-400 font-bold animate-pulse">
                        TRANSMITTING...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-slate-500 bg-slate-950 p-4 rounded-2xl border border-slate-800 mt-6">
              💡 Hold <span className="text-cyan-400 font-bold">[V]</span> during active combat matches to transmit tactical callouts to your team.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
