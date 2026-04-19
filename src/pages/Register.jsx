import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } }
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'admin'
      }, { onConflict: 'id' });

      if (profileError) console.error('Profile error:', profileError);

      await supabase.from('settings').upsert({
        user_id: data.user.id,
      }, { onConflict: 'user_id' });

      await seedProducts(data.user.id);
    }

    setLoading(false);
    addToast('Account created! Welcome to QuoteFlow.', 'success');
    navigate('/dashboard');
  };

  const seedProducts = async (userId) => {
    const products = [
      { name: 'LED Panel Light 18W', code: 'PL18W', rate: 450, unit: 'Pcs', category: 'Panel', stock: 50, min_stock: 10, track_stock: true },
      { name: 'LED Panel Light 36W', code: 'PL36W', rate: 750, unit: 'Pcs', category: 'Panel', stock: 30, min_stock: 5, track_stock: true },
      { name: 'LED Spot Light 7W', code: 'SL7W', rate: 180, unit: 'Pcs', category: 'Spot', stock: 100, min_stock: 20, track_stock: true },
      { name: 'LED Spot Light 12W', code: 'SL12W', rate: 280, unit: 'Pcs', category: 'Spot', stock: 75, min_stock: 10, track_stock: true },
      { name: 'LED Strip Light 5050', code: 'STR5050', rate: 120, unit: 'Meter', category: 'Strip', stock: 200, min_stock: 30, track_stock: true },
      { name: 'LED Strip Light 3528', code: 'STR3528', rate: 80, unit: 'Meter', category: 'Strip', stock: 150, min_stock: 20, track_stock: true },
      { name: 'LED Bulb 9W', code: 'BL9W', rate: 75, unit: 'Pcs', category: 'Bulb', stock: 200, min_stock: 50, track_stock: true },
      { name: 'LED Bulb 12W', code: 'BL12W', rate: 95, unit: 'Pcs', category: 'Bulb', stock: 180, min_stock: 40, track_stock: true },
      { name: 'LED Tube Light 20W', code: 'TL20W', rate: 220, unit: 'Pcs', category: 'Tube', stock: 60, min_stock: 10, track_stock: true },
      { name: 'LED Downlight 10W', code: 'DL10W', rate: 320, unit: 'Pcs', category: 'Downlight', stock: 80, min_stock: 15, track_stock: true },
      { name: 'LED Flood Light 50W', code: 'FL50W', rate: 1200, unit: 'Pcs', category: 'Flood', stock: 20, min_stock: 5, track_stock: true },
      { name: 'LED Street Light 30W', code: 'STRL30W', rate: 2500, unit: 'Pcs', category: 'Street', stock: 10, min_stock: 3, track_stock: true },
      { name: 'LED COB Light 20W', code: 'COB20W', rate: 550, unit: 'Pcs', category: 'COB', stock: 40, min_stock: 8, track_stock: true },
      { name: 'LED Driver 12V 5A', code: 'DRV12V5A', rate: 350, unit: 'Pcs', category: 'Driver', stock: 60, min_stock: 10, track_stock: true },
      { name: 'LED Driver 24V 10A', code: 'DRV24V10A', rate: 680, unit: 'Pcs', category: 'Driver', stock: 35, min_stock: 5, track_stock: true },
      { name: 'LED Batten Light 18W', code: 'BAT18W', rate: 390, unit: 'Pcs', category: 'Batten', stock: 50, min_stock: 10, track_stock: true },
      { name: 'LED Ceiling Light 24W', code: 'CEL24W', rate: 890, unit: 'Pcs', category: 'Ceiling', stock: 25, min_stock: 5, track_stock: true },
      { name: 'LED Track Light 15W', code: 'TRK15W', rate: 750, unit: 'Pcs', category: 'Track', stock: 30, min_stock: 5, track_stock: true },
      { name: 'LED Emergency Light', code: 'EMG1', rate: 650, unit: 'Pcs', category: 'Emergency', stock: 20, min_stock: 4, track_stock: true },
      { name: 'LED Solar Light 10W', code: 'SOL10W', rate: 1800, unit: 'Pcs', category: 'Solar', stock: 15, min_stock: 3, track_stock: true },
    ].map(p => ({ ...p, user_id: userId }));

    await supabase.from('products').insert(products);
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={28} color="white" /></div>
          <div className="auth-title">QuoteFlow</div>
          <div className="auth-sub">Create your free account</div>
        </div>

        {error && (
          <div className="auth-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Full Name</label>
            <div className="auth-input-wrap">
              <User size={15} className="auth-input-icon" />
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your Name" autoComplete="name" required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" required />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <div className="auth-input-wrap" style={{ position: 'relative' }}>
              <Lock size={15} className="auth-input-icon" />
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters" autoComplete="new-password" required
                style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
