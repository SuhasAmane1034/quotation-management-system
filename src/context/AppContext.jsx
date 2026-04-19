import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  company_name: 'Ashok Vidyut',
  company_logo: '',
  company_address: 'Ashok Chowk, Opp WIT Boys Hostel, Old WIT College Road, SOLAPUR-413005',
  company_phone: '8411022244',
  validity_days: 7,
  default_unit: 'Pcs',
  currency: 'Rs.',
  tax_rate: 18,
  tax_label: 'GST',
  accent_color: '#6366f1',
  dark_mode: false,
  terms: 'ALL RATES ARE INCLUSIVE OF GST.\nGoods once sold will not be taken back.\nWarranty as per company policy.\nAdvance Payment Only.',
  shapes: [
    { key: 'R', value: 'Round' }, { key: 'S', value: 'Square' },
    { key: 'RE', value: 'Rectangle' }, { key: 'OV', value: 'Oval' }
  ],
  colors: [
    { key: 'W', value: 'White' }, { key: 'NW', value: 'Natural White' },
    { key: 'WW', value: 'Warm White' }, { key: '3', value: '3 in 1' },
    { key: '5', value: '5000K' }, { key: 'RGB', value: 'RGB' }
  ],
  body_colors: [
    { key: 'B', value: 'Black Body' }, { key: 'W', value: 'White Body' },
    { key: 'GB', value: 'Gun Black' }, { key: 'RG', value: 'Rose Gold' },
    { key: 'SS', value: 'Silver' }
  ],
  warranties: [
    { key: 'NW', value: 'No Warranty' }, { key: '1', value: '1 Year' },
    { key: '2', value: '2 Year' }, { key: '3', value: '3 Year' },
    { key: '5', value: '5 Year' }, { key: '10', value: '10 Year' }
  ],
  columns_visible: {
    sr_no: true, product_image: true, product_name: true, shape: true,
    color: true, body_color: true, warranty: true, quantity: true,
    unit: true, rate: true, discount: true, amount: true
  }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [settings, setSettings] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyTheme = useCallback((s) => {
    if (!s) return;
    if (s.dark_mode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    if (s.accent_color) {
      const root = document.documentElement;
      root.style.setProperty('--accent', s.accent_color);
      const hex = s.accent_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      root.style.setProperty('--accent-muted', `rgba(${r},${g},${b},0.12)`);
      root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.35)`);
    }
  }, []);

  const loadSettings = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      const merged = { ...DEFAULT_SETTINGS };
      setSettings(merged);
      applyTheme(merged);
      return merged;
    }
    const merged = { ...DEFAULT_SETTINGS, ...data };
    setSettings(merged);
    applyTheme(merged);
    return merged;
  }, [applyTheme]);

  const updateSettings = useCallback(async (newSettings) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      ...newSettings,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('settings')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      addToast('Failed to save settings', 'error');
      return;
    }
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    applyTheme(merged);
    addToast('Settings saved!', 'success');
  }, [user, settings, applyTheme, addToast]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSettings(session.user.id);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => { await loadSettings(session.user.id); })();
      } else {
        setSettings(null);
      }
      if (event === 'SIGNED_OUT') {
        setSettings(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSettings]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AppContext.Provider value={{
      user, session, settings, authLoading,
      updateSettings, signOut, addToast, removeToast, toasts
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AppContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onRemove(t.id)}>
          <span className="toast-icon">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
