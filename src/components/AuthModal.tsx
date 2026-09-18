import React, { useState } from 'react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  signOut,
  updateProfile,
  syncUserDataToCloud,
  loadUserDataFromCloud,
  FirebaseUser
} from '../firebase';
import { PlayerStats, PlayerLoadout } from '../types';
import {
  User,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
  Shield,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  currentUser: FirebaseUser | null;
  stats: PlayerStats;
  loadout: PlayerLoadout;
  onUserChange: (user: FirebaseUser | null) => void;
  onStatsUpdate: (stats: PlayerStats) => void;
  onLoadoutUpdate: (loadout: PlayerLoadout) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  stats,
  loadout,
  onUserChange,
  onStatsUpdate,
  onLoadoutUpdate,
  onClose
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [callsign, setCallsign] = useState(stats.username || '');

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/user-not-found') return 'No operative account found with this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password. Please try again.';
    if (code === 'auth/invalid-credential') return 'Invalid email or password combination.';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists. Try signing in.';
    if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
    if (code === 'auth/popup-closed-by-user') return 'Sign-in popup was closed before completion.';
    if (code === 'auth/network-request-failed') return 'Network issue. Please check your internet connection.';
    return err?.message || 'Authentication failed. Please check your credentials.';
  };

  const handlePostAuthSync = async (user: FirebaseUser, isNewUser: boolean, preferredName?: string) => {
    setSyncing(true);
    try {
      if (preferredName && (!user.displayName || user.displayName !== preferredName)) {
        await updateProfile(user, { displayName: preferredName });
      }

      if (isNewUser) {
        // First time account creation: upload current local stats & loadout to cloud
        const initialStats: PlayerStats = {
          ...stats,
          username: preferredName || user.displayName || stats.username
        };
        await syncUserDataToCloud(user, initialStats, loadout);
        onStatsUpdate(initialStats);
        confetti({ particleCount: 60, spread: 70 });
        setSuccessMessage(`Account created! Welcome Operative ${initialStats.username}.`);
      } else {
        // Returning user: fetch cloud stats if they exist
        const cloudData = await loadUserDataFromCloud(user.uid);
        if (cloudData && cloudData.stats) {
          onStatsUpdate(cloudData.stats);
          if (cloudData.loadout) {
            onLoadoutUpdate(cloudData.loadout);
          }
          setSuccessMessage(`Welcome back, ${cloudData.stats.username || user.displayName || 'Operative'}! Cloud profile restored.`);
        } else {
          // No prior cloud stats, sync local stats to user account
          const syncedStats: PlayerStats = {
            ...stats,
            username: user.displayName || stats.username
          };
          await syncUserDataToCloud(user, syncedStats, loadout);
          onStatsUpdate(syncedStats);
          setSuccessMessage(`Welcome back! Cloud sync profile initialized.`);
        }
      }
      onUserChange(user);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Cloud profile sync error:', err);
      setError('Signed in, but cloud save sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await handlePostAuthSync(userCredential.user, false);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCallsign = callsign.trim();
    if (!cleanCallsign) {
      setError('Please choose an Operative Callsign.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await handlePostAuthSync(userCredential.user, true, cleanCallsign);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if existing cloud profile
      const cloudData = await loadUserDataFromCloud(result.user.uid);
      const isNew = !cloudData || !cloudData.stats;
      await handlePostAuthSync(result.user, isNew, result.user.displayName || undefined);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      onUserChange(null);
      setSuccessMessage('Signed out successfully.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError('Sign out failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCloudSync = async () => {
    if (!currentUser) return;
    setSyncing(true);
    try {
      await syncUserDataToCloud(currentUser, stats, loadout);
      setSuccessMessage('Cloud save synchronized successfully!');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setError('Failed to sync to cloud: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div id="auth-modal" className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-rajdhani animate-in fade-in duration-200">
      <div className="relative bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading tracking-wide text-white">
              {currentUser ? 'OPERATIVE ACCOUNT' : mode === 'signin' ? 'OPERATIVE SIGN IN' : 'NEW OPERATIVE ENLISTMENT'}
            </h3>
            <p className="text-xs text-slate-400">
              {currentUser
                ? 'Persistent cloud identity and cross-device telemetry'
                : 'Save career stats, unlocked skins, and custom loadouts to cloud'}
            </p>
          </div>
        </div>

        {/* Notifications & Status */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ALREADY SIGNED IN VIEW */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-lg font-heading text-slate-950 shadow-md">
                  {(currentUser.displayName || currentUser.email || 'OP').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">
                      {currentUser.displayName || 'Operative'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ONLINE
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              {/* Quick Career Stats summary */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center font-mono">
                <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[9px] text-slate-500">LEVEL</div>
                  <div className="text-sm font-bold text-cyan-300">LVL {stats.level}</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[9px] text-slate-500">KILLS</div>
                  <div className="text-sm font-bold text-emerald-400">{stats.kills}</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[9px] text-slate-500">COINS</div>
                  <div className="text-sm font-bold text-amber-400">🪙 {stats.coins}</div>
                </div>
              </div>
            </div>

            {/* Cloud Sync Status */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span>Cloud Save Status:</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <button
                onClick={handleManualCloudSync}
                disabled={syncing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{syncing ? 'SYNCING...' : 'SYNC NOW'}</span>
              </button>
            </div>

            {/* Account Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 border border-rose-800/60 rounded-2xl text-xs font-mono font-bold transition shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>LOG OUT</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl text-xs font-mono font-bold transition shadow-lg shadow-cyan-500/20"
              >
                RETURN TO ARENA
              </button>
            </div>
          </div>
        ) : (
          /* SIGN IN / SIGN UP FORMS */
          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono font-bold transition ${
                  mode === 'signin'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-mono font-bold transition ${
                  mode === 'signup'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>CREATE ACCOUNT</span>
              </button>
            </div>

            {/* Google OAuth Quick Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading || syncing}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-slate-950 hover:bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-2xl text-xs font-mono font-bold transition mb-4 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] font-mono text-slate-500 uppercase">OR WITH EMAIL</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Email Form */}
            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Operative Callsign
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      placeholder="e.g. ShadowSniper"
                      maxLength={16}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl py-2.5 pl-10 pr-3 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@vengestrike.net"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl py-2.5 pl-10 pr-3 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Enter password'}
                    minLength={6}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl py-2.5 pl-10 pr-3 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      minLength={6}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl py-2.5 pl-10 pr-3 text-xs font-mono text-white placeholder-slate-600 outline-none transition"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || syncing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 text-slate-950 rounded-2xl text-xs font-mono font-bold transition shadow-lg shadow-cyan-500/20 mt-4"
              >
                {loading || syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{syncing ? 'SYNCING CLOUD TELEMETRY...' : 'AUTHENTICATING...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'ENTER THE COMBAT ARENA' : 'INITIALIZE OPERATIVE ACCOUNT'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Guest note */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
              >
                Continue as Guest (Local Save only)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
