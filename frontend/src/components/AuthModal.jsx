'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  User, 
  Lock, 
  AlertCircle, 
  ArrowLeft,
  LogIn,
  UserPlus,
  Loader2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const { 
    modalOpen, 
    modalMode, 
    closeModal, 
    loginWithCredentials, 
    loginWithGoogle, 
    signupFarmer 
  } = useAuth();

  const [mode, setMode] = useState(modalMode); // 'login' | 'signup'
  const [googleAccountView, setGoogleAccountView] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  // Sign In Form State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    Full_Name: '',
    Phone_Number: '',
    Aadhaar_Number: '',
    Village: '',
    District: 'Surat',
    State: 'Gujarat',
    UPI_ID: '',
    Password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleButtonRef = useRef(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '304542558475-irf55f69uevblj5hcg702gtp1gtlg4ji.apps.googleusercontent.com';

  // Synchronize modal state on open
  useEffect(() => {
    setMode(modalMode);
    setGoogleAccountView(false);
    setError('');
  }, [modalMode, modalOpen]);

  // Load official Google Identity Services client SDK asynchronously
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      setGoogleScriptReady(true);
      return;
    }

    const scriptId = 'google-gsi-client';
    const existing = document.getElementById(scriptId);

    if (existing) {
      const handleLoad = () => setGoogleScriptReady(true);
      existing.addEventListener('load', handleLoad);
      return () => existing.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptReady(true);
    script.onerror = () => {
      console.warn('Google Identity Services script failed to load.');
    };
    document.head.appendChild(script);
  }, []);

  // Handle genuine Google ID token response from Google Identity Services
  const handleCredentialResponse = useCallback(async (response) => {
    if (!response || !response.credential) {
      setError('Google Sign-In was cancelled or failed to return a credential.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Forward genuine Google ID Token to backend for cryptographic verification
      await loginWithGoogle(response.credential);
      setGoogleAccountView(false);
    } catch (err) {
      setError(err.message || 'Google token verification failed on server.');
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  // Initialize and render official Google Sign-In Button when Google View is active
  useEffect(() => {
    if (!modalOpen || !googleAccountView) return;
    if (!googleScriptReady || !window.google?.accounts?.id) return;
    if (!googleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 280,
        });
      }

      // Trigger One Tap prompt if available
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fall back quietly to the rendered button
        }
      });
    } catch (err) {
      console.warn('Error initializing Google Identity Services:', err);
    }
  }, [modalOpen, googleAccountView, googleScriptReady, googleClientId, handleCredentialResponse]);

  if (!modalOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithCredentials(username, password);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!signUpData.Full_Name || !signUpData.Phone_Number) {
      setError('Please provide your full name and 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await signupFarmer(signUpData);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Official Google Multi-Color SVG Logo
  const GoogleLogo = ({ size = "w-5 h-5" }) => (
    <svg className={`${size} shrink-0`} viewBox="0 0 24 24">
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
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* VIEW 1: GENUINE GOOGLE SIGN-IN FLOW */}
        {googleAccountView ? (
          <div>
            {/* Top Bar */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setGoogleAccountView(false);
                  setError('');
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <GoogleLogo size="w-4 h-4" />
                <span className="font-mono text-xs font-bold text-slate-700">
                  Google Identity Services
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Google OAuth Body */}
            <div className="p-6 bg-white space-y-5">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm mb-1">
                  <GoogleLogo size="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Sign in with Google
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  to continue to <strong className="text-forest">AgriSlot APMC Mandi</strong>
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-coral/60 border border-navy-border text-coral-dark text-xs font-mono font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State during Token Verification */}
              {loading ? (
                <div className="py-8 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-mint-light text-forest animate-spin mx-auto">
                    <Loader2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-navy-border">
                      Verifying Google OAuth 2.0 Token...
                    </div>
                    <div className="font-mono text-xs text-slate-500 mt-0.5">
                      Cryptographic backend verification via google-auth-library
                    </div>
                  </div>
                </div>
              ) : googleClientId ? (
                /* Google Client ID Configured: Show Official GIS Container */
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-4 min-h-[60px]">
                    <div ref={googleButtonRef} className="flex justify-center w-full" />
                    {!googleScriptReady && (
                      <div className="text-xs font-mono text-slate-500 flex items-center gap-2 mt-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting to accounts.google.com...</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px] leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-navy-border mb-1">
                      <ExternalLink className="w-3.5 h-3.5 text-forest" />
                      <span>Authentic Google Consent Flow</span>
                    </div>
                    Google Identity Services verifies your identity securely and issues a signed ID token directly from Google servers.
                  </div>
                </div>
              ) : (
                /* Google Client ID Not Configured Notice */
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 space-y-3 font-mono text-xs text-navy-border">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Google OAuth Client ID Required</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Real Google authentication requires an active Google Cloud OAuth 2.0 Web Client ID.
                  </p>
                  <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200 text-[10.5px] space-y-1">
                    <div className="font-bold text-slate-800">Configuration Steps:</div>
                    <div>1. Create OAuth Client ID in Google Cloud Console</div>
                    <div>2. Set Authorized origin: <code className="bg-amber-100 px-1 rounded">http://localhost:3000</code></div>
                    <div>3. Add to <code className="bg-amber-100 px-1 rounded font-bold">frontend/.env.local</code>:</div>
                    <code className="block bg-slate-900 text-emerald-400 p-2 rounded text-[10px] select-all overflow-x-auto">
                      NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                    </code>
                    <div>4. Add to backend <code className="bg-amber-100 px-1 rounded font-bold">.env</code>:</div>
                    <code className="block bg-slate-900 text-emerald-400 p-2 rounded text-[10px] select-all overflow-x-auto">
                      GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGoogleAccountView(false)}
                    className="w-full py-2 rounded-lg bg-forest text-white font-bold hover:bg-forest-light transition-colors text-center text-xs"
                  >
                    Use Standard Sign-In
                  </button>
                </div>
              )}
            </div>

            {/* Google OAuth Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Secure APMC Gateway</span>
              <button
                type="button"
                onClick={() => setGoogleAccountView(false)}
                className="text-forest hover:underline font-bold"
              >
                Standard Sign-In
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: STANDARD AGRISLOT MODAL (Sign In / Register) */
          <div>
            {/* Top Header Pill Bar */}
            <div className="px-6 py-4 bg-mint-foam border-b-[2px] border-navy-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-forest text-saffron border-[1.5px] border-navy-border flex items-center justify-center font-display font-black text-sm shadow-[1.5px_1.5px_0px_#0F2B20]">
                  AS
                </div>
                <div>
                  <span className="font-display font-black text-base text-navy-border tracking-tight block leading-tight">
                    AgriSlot Portal
                  </span>
                  <span className="font-mono text-[10px] font-bold text-forest-light uppercase tracking-wider">
                    Farmer &amp; Officer Access
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white hover:bg-coral/40 border-[1.5px] border-navy-border flex items-center justify-center text-navy-border shadow-bento-sm active:translate-y-0.5 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-white">
              {/* Segmented Switcher */}
              <div className="flex items-center p-1 bg-canvas rounded-2xl border-[2px] border-navy-border shadow-bento-sm font-display font-black text-xs uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-forest text-white shadow-bento-sm'
                      : 'text-navy-border hover:bg-mint-foam'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-forest text-white shadow-bento-sm'
                      : 'text-navy-border hover:bg-mint-foam'
                  }`}
                >
                  New Registration
                </button>
              </div>

              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setGoogleAccountView(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center justify-center gap-3 font-mono text-xs font-bold text-navy-border"
              >
                <GoogleLogo size="w-4 h-4" />
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-[1.5px] bg-slate-200"></div>
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                  OR WITH USERNAME &amp; PASSCODE
                </span>
                <div className="flex-1 h-[1.5px] bg-slate-200"></div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-coral/60 border border-navy-border text-coral-dark text-xs font-mono font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN FORM */}
              {mode === 'login' ? (
                <form onSubmit={handleSignIn} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 uppercase">
                      Username / Mobile
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. farmer or admin"
                        className="w-full h-11 pl-10 pr-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 uppercase">
                      Password / Passcode
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full h-11 pl-10 pr-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-saffron" />
                        <span>Sign In to AgriSlot</span>
                      </>
                    )}
                  </button>

                  {/* Fast 1-Click Demo Profiles */}
                  <div className="pt-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase block mb-1.5 text-center">
                      Demo Quick-Login
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUsername('farmer');
                          setPassword('farmer123');
                        }}
                        className="py-1.5 px-2 rounded-lg bg-mint-foam hover:bg-mint-light border border-navy-border text-forest font-bold text-[11px] shadow-sm active:translate-y-0.5"
                      >
                        Demo Farmer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUsername('admin');
                          setPassword('admin123');
                        }}
                        className="py-1.5 px-2 rounded-lg bg-saffron-light hover:bg-saffron border border-navy-border text-navy-border font-bold text-[11px] shadow-sm active:translate-y-0.5"
                      >
                        Mandi Officer (Admin)
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* MODE 2: SIGN UP / REGISTRATION FORM */
                <form onSubmit={handleSignUp} className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 uppercase">
                      Farmer Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={signUpData.Full_Name}
                        onChange={(e) => setSignUpData({ ...signUpData, Full_Name: e.target.value })}
                        className="w-full h-11 pl-10 pr-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 uppercase">
                        Phone (10 digits)
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        placeholder="10 digit number"
                        value={signUpData.Phone_Number}
                        onChange={(e) => setSignUpData({ ...signUpData, Phone_Number: e.target.value })}
                        className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 uppercase">
                        Village / Town
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bardoli"
                        value={signUpData.Village}
                        onChange={(e) => setSignUpData({ ...signUpData, Village: e.target.value })}
                        className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 uppercase">
                        District
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Surat"
                        value={signUpData.District}
                        onChange={(e) => setSignUpData({ ...signUpData, District: e.target.value })}
                        className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1 uppercase">
                        UPI ID (for payments)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ramesh@upi"
                        value={signUpData.UPI_ID}
                        onChange={(e) => setSignUpData({ ...signUpData, UPI_ID: e.target.value })}
                        className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 uppercase">
                      Create Passcode
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Enter safe passcode"
                        value={signUpData.Password}
                        onChange={(e) => setSignUpData({ ...signUpData, Password: e.target.value })}
                        className="w-full h-11 pl-10 pr-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl text-navy-border font-bold focus:ring-0 focus:border-forest shadow-bento-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <span>Registering...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-saffron" />
                        <span>Create Producer Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer info strip */}
            <div className="px-6 py-3 bg-canvas border-t-[1.5px] border-slate-200 text-center font-mono text-[10.5px] font-bold text-slate-500">
              Official APMC e-NAM Mandi Gateway • Secure Authentication
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
