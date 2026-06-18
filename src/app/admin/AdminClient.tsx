'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface RSVP {
  id: number;
  memberType: 'VIP' | 'Reguler';
  nama: string;
  instansi: string;
  email: string;
  nomorTelepon: string;
  jumlahPax: number;
  orderId?: string | null;
  paymentStatus?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminClient({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialAuthenticated);
  const [authChecking, setAuthChecking] = useState(!initialAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [scanOrderId, setScanOrderId] = useState('');
  const [scanResult, setScanResult] = useState<RSVP | null>(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [loading, setLoading] = useState(initialAuthenticated);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'rsvp' | 'scan' | 'history'>('rsvp');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/login', { credentials: 'include' });
        const data = await response.json();
        setIsLoggedIn(Boolean(data.authenticated));
        if (!data.authenticated) setLoading(false);
      } catch {
        setIsLoggedIn(false);
        setLoading(false);
      } finally {
        setAuthChecking(false);
      }
    };

    if (!initialAuthenticated) checkAuth();
    else setAuthChecking(false);
  }, [initialAuthenticated]);

  useEffect(() => {
    if (isLoggedIn) fetchRSVPs();
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        const data = await response.json();
        setLoginError(data.error || 'Login gagal');
      }
    } catch {
      setLoginError('Terjadi kesalahan server');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE', credentials: 'include' });
    } finally {
      setIsLoggedIn(false);
      setRsvps([]);
      setLoading(false);
      setError('');
      setUsername('');
      setPassword('');
      setScanOrderId('');
      setScanResult(null);
      setScanError('');
    }
  };

  const fetchRSVPs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/rsvp');
      if (!response.ok) throw new Error('Gagal mengambil data');
      const data = await response.json();
      setRsvps(data);
    } catch {
      setError('Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    const trimmed = scanOrderId.trim();
    if (!trimmed) {
      setScanError('Masukkan order ID dulu.');
      return;
    }
    setScanLoading(true);
    setScanError('');
    setScanResult(null);
    try {
      const response = await fetch(`/api/rsvp/validate?order_id=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      if (!response.ok) {
        setScanError(data.error || 'Gagal validasi.');
        return;
      }
      setScanResult(data.data);
    } catch {
      setScanError('Koneksi gagal saat validasi.');
    } finally {
      setScanLoading(false);
    }
  };

  const paymentHistory = useMemo(
    () => [...rsvps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [rsvps]
  );

  const paidCount = rsvps.filter(r => r.paymentStatus === 'paid').length;
  const pendingCount = rsvps.filter(r => !r.paymentStatus || r.paymentStatus === 'pending').length;
  const totalPax = rsvps.reduce((sum, r) => sum + r.jumlahPax, 0);
  const totalVIP = rsvps.filter(r => r.memberType === 'VIP').length;
  const totalReguler = rsvps.filter(r => r.memberType === 'Reguler').length;

  const stats = [
    { label: 'Total RSVP', value: rsvps.length, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: '👥' },
    { label: 'Total Pax', value: totalPax, color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', icon: '✅' },
    { label: 'Tamu VIP', value: totalVIP, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: '👑' },
    { label: 'Tamu Reguler', value: totalReguler, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '🎟️' },
    { label: 'Paid', value: paidCount, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: '✔' },
    { label: 'Pending', value: pendingCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '⏳' },
  ];

  const s = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #213326 0%, #1d2d22 42%, #17251b 100%)',
      color: '#f7f3ea',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    } as React.CSSProperties,
    loginWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', padding: '20px' } as React.CSSProperties,
    loginCard: { background: '#070a07d1', color: '#213326', border: '1px solid rgba(26,77,46,0.14)', borderRadius: '20px', padding: '44px 40px', width: '100%', maxWidth: '400px', animation: 'fadeUp .4s ease', boxShadow: '0 12px 32px rgba(0,0,0,0.16)' } as React.CSSProperties,
    loginLogo: { width: '44px', height: '44px', background: 'rgba(26,77,46,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(26,77,46,0.14)', fontSize: '20px' } as React.CSSProperties,
    loginTitle: { textAlign: 'center', fontSize: '22px', fontWeight: 800, marginBottom: '6px' } as React.CSSProperties,
    loginSub: { textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '32px' } as React.CSSProperties,
    fieldLabel: { fontSize: '11px', fontWeight: 700, color: '#daf4e4', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' } as React.CSSProperties,
    input: { width: '100%', background: '#fff', border: '1px solid rgba(26,77,46,0.14)', borderRadius: '10px', padding: '11px 14px', fontSize: '15px', color: '#213326', fontFamily: 'inherit', outline: 'none', marginBottom: '14px', display: 'block' } as React.CSSProperties,
    btnPrimary: { width: '100%', padding: '13px', background: '#1a4d2e', color: '#f7f3ea', fontSize: '15px', fontWeight: 700, borderRadius: '10px', fontFamily: 'inherit', cursor: 'pointer', border: 'none', marginTop: '8px', transition: 'background .2s' } as React.CSSProperties,
    errMsg: { fontSize: '13px', color: '#b91c1c', padding: '10px 14px', background: 'rgba(220,38,38,.08)', borderRadius: '8px', border: '1px solid rgba(220,38,38,.16)', textAlign: 'center', marginBottom: '10px' } as React.CSSProperties,
    dashboard: { padding: '32px 28px', maxWidth: '1280px', margin: '0 auto' } as React.CSSProperties,
    topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' } as React.CSSProperties,
    h1: { fontSize: '26px', fontWeight: 800, marginBottom: '4px', color: '#f7f3ea' } as React.CSSProperties,
    subTitle: { fontSize: '13px', color: 'rgba(247,243,234,0.76)' } as React.CSSProperties,
    liveBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: '#22c55e', marginTop: '8px' } as React.CSSProperties,
    liveDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' } as React.CSSProperties,
    btnGhost: { background: '#efe9e3', border: '1px solid rgba(26,77,46,0.12)', color: '#1a4d2e', padding: '9px 18px', borderRadius: '10px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'background .2s' } as React.CSSProperties,
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' } as React.CSSProperties,
    statCard: { background: '#efe9e3', color: '#213326', border: '1px solid rgba(26,77,46,0.12)', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 10px 26px rgba(0,0,0,0.12)' } as React.CSSProperties,
    statIconBox: (bg: string) => ({ width: '34px', height: '34px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '14px' } as React.CSSProperties),
    statLabel: { fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' } as React.CSSProperties,
    statVal: (color: string) => ({ fontSize: '30px', fontWeight: 800, fontFamily: "'DM Mono', monospace", color, lineHeight: 1 } as React.CSSProperties),
    panel: { background: '#efe9e3', color: '#213326', border: '1px solid rgba(26,77,46,0.12)', borderRadius: '14px', overflow: 'hidden', marginBottom: '18px', boxShadow: '0 10px 26px rgba(0,0,0,0.12)' } as React.CSSProperties,
    panelHead: { padding: '18px 24px', borderBottom: '1px solid rgba(26,77,46,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } as React.CSSProperties,
    panelTitle: { fontSize: '15px', fontWeight: 700 } as React.CSSProperties,
    panelCount: { fontSize: '12px', color: '#64748b', marginTop: '2px' } as React.CSSProperties,
    tabRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' } as React.CSSProperties,
    tabBtn: (active: boolean) => ({ background: active ? 'rgba(26,77,46,0.1)' : '#fff', border: `1px solid ${active ? 'rgba(26,77,46,0.18)' : 'rgba(26,77,46,0.1)'}`, color: active ? '#1a4d2e' : '#64748b', padding: '9px 14px', borderRadius: '999px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties),
    btnRefresh: { background: '#fff', border: '1px solid rgba(26,77,46,0.12)', color: '#1a4d2e', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' } as React.CSSProperties,
    th: { padding: '12px 20px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', whiteSpace: 'nowrap' } as React.CSSProperties,
    td: { padding: '14px 20px', verticalAlign: 'middle' as const },
    badgeVIP: { display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, letterSpacing: '.04em', background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,.25)' } as React.CSSProperties,
    badgeReg: { display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, letterSpacing: '.04em', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,.25)' } as React.CSSProperties,
    paymentBadge: (status?: string | null) => ({
      display: 'inline-flex',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: 800,
      letterSpacing: '.04em',
      background: status === 'paid' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
      color: status === 'paid' ? '#22c55e' : '#f59e0b',
      border: status === 'paid' ? '1px solid rgba(34,197,94,.25)' : '1px solid rgba(245,158,11,.25)',
    } as React.CSSProperties),
    avatar: { width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: '#d9e3dc', color: '#1a4d2e', border: '1px solid rgba(26,77,46,0.12)', flexShrink: 0 as const } as React.CSSProperties,
    namaText: { fontWeight: 600, fontSize: '14px' } as React.CSSProperties,
    instText: { fontSize: '12px', color: '#64748b', marginTop: '2px' } as React.CSSProperties,
    emailText: { fontSize: '12px', fontFamily: "'DM Mono', monospace" } as React.CSSProperties,
    phoneText: { fontSize: '11px', color: '#64748b', fontFamily: "'DM Mono', monospace", marginTop: '2px' } as React.CSSProperties,
    paxText: { fontSize: '15px', fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#22c55e', textAlign: 'center' as const } as React.CSSProperties,
    timeText: { fontSize: '12px', color: '#64748b', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' as const } as React.CSSProperties,
    emptyState: { padding: '60px', textAlign: 'center' as const, color: '#94a3b8', fontSize: '14px' } as React.CSSProperties,
    footerLink: { marginTop: '28px', textAlign: 'center' as const, fontSize: '12px', color: '#475569' } as React.CSSProperties,
    scanWrap: { padding: '20px', borderRadius: '14px', background: '#fff', border: '1px solid rgba(26,77,46,0.08)' } as React.CSSProperties,
  };

  const renderRSVP = () => (
    <div style={s.panel}>
      <div style={s.panelHead}>
        <div>
          <p style={s.panelTitle}>Daftar Kehadiran</p>
          <p style={s.panelCount}>{rsvps.length} tamu terdaftar</p>
        </div>
        <button style={s.btnRefresh} onClick={fetchRSVPs}>⟳ Refresh</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {loading ? <div style={s.emptyState}>Memuat data…</div> : error ? <div style={{ ...s.emptyState, color: '#b91c1c' }}>{error}</div> : rsvps.length === 0 ? <div style={s.emptyState}>Belum ada data konfirmasi.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(26,77,46,0.06)' }}>
                <th style={{ ...s.th, textAlign: 'start' }}>Tipe</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Tamu</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Kontak</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Pax</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Bayar</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map(rsvp => (
                <tr key={rsvp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ ...s.td, textAlign: 'start' }}><span style={rsvp.memberType === 'VIP' ? s.badgeVIP : s.badgeReg}>{rsvp.memberType}</span></td>
                  <td style={{ ...s.td, textAlign: 'start' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div><div style={s.namaText}>{rsvp.nama}</div><div style={s.instText}>{rsvp.instansi}</div></div></div></td>
                  <td style={{ ...s.td, textAlign: 'start' }}><div style={s.emailText}>{rsvp.email}</div><div style={s.phoneText}>{rsvp.nomorTelepon}</div></td>
                  <td style={{ ...s.td, ...s.paxText, textAlign: 'start' }}>{rsvp.jumlahPax}</td>
                  <td style={{ ...s.td, textAlign: 'start' }}><span style={s.paymentBadge(rsvp.paymentStatus)}>{rsvp.paymentStatus || 'pending'}</span></td>
                  <td style={{ ...s.td, ...s.timeText, textAlign: 'start' }}>{formatDate(rsvp.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div style={s.panel}>
      <div style={s.panelHead}>
        <div>
          <p style={s.panelTitle}>History Payment</p>
          <p style={s.panelCount}>Riwayat pembayaran dan status terakhir transaksi</p>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {rsvps.length === 0 ? <div style={s.emptyState}>Belum ada history pembayaran.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(26,77,46,0.06)' }}>
                <th style={{ ...s.th, textAlign: 'start' }}>Order</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Nama</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Kategori</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Status</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Paid At</th>
                <th style={{ ...s.th, textAlign: 'start' }}>Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((rsvp) => (
                <tr key={rsvp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={s.td}><div style={s.emailText}>{rsvp.orderId || '-'}</div></td>
                  <td style={s.td}>
                    <div style={s.namaText}>{rsvp.nama}</div>
                    <div style={s.instText}>{rsvp.instansi}</div>
                  </td>
                  <td style={s.td}><span style={rsvp.memberType === 'VIP' ? s.badgeVIP : s.badgeReg}>{rsvp.memberType}</span></td>
                  <td style={s.td}><span style={s.paymentBadge(rsvp.paymentStatus)}>{rsvp.paymentStatus || 'pending'}</span></td>
                  <td style={s.td}>{formatDate(rsvp.paidAt)}</td>
                  <td style={s.td}>{formatDate(rsvp.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderScan = () => (
    <div style={s.panel}>
      <div style={s.panelHead}>
        <div>
          <p style={s.panelTitle}>Scan Validation</p>
          <p style={s.panelCount}>Validasi QR / order ID untuk check-in</p>
        </div>
      </div>
      <div style={s.scanWrap}>
        <label style={s.fieldLabel}>Order ID</label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            value={scanOrderId}
            onChange={(e) => setScanOrderId(e.target.value)}
            placeholder="RSVP-..."
            style={{ ...s.input, marginBottom: 0, flex: '1 1 320px' }}
          />
          <button onClick={handleScan} disabled={scanLoading} style={s.btnPrimary}>
            {scanLoading ? 'Memeriksa...' : 'Validasi'}
          </button>
        </div>
        {scanError && <div style={{ ...s.errMsg, marginTop: 12, marginBottom: 0 }}>{scanError}</div>}
        {scanResult && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: scanResult.paymentStatus === 'paid' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${scanResult.paymentStatus === 'paid' ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.18)'}` }}>
            <div style={{ fontWeight: 800, color: scanResult.paymentStatus === 'paid' ? '#22c55e' : '#f59e0b' }}>
              {scanResult.paymentStatus === 'paid' ? 'Tiket Valid' : 'Belum Valid'}
            </div>
            <div style={{ marginTop: 10, color: '#cbd5e1', fontSize: 13 }}>
              {scanResult.nama} - {scanResult.memberType} - {scanResult.jumlahPax} pax
            </div>
            <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{scanResult.orderId}</div>
          </div>
        )}
      </div>
    </div>
  );

  if (authChecking) {
    return <div style={{ ...s.page, ...s.loginWrap, color: '#94a3b8' }}>Memeriksa sesi admin...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div style={{ ...s.page, ...s.loginWrap }}>
        <div style={s.loginCard}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img src="/jaxlab-white.png" alt="JAXLAB Logo" style={{ width: "12rem"}} />
          </div>
          <p style={s.loginSub}>JaxLab RSVP Management</p>
          <form onSubmit={handleLogin}>
            <label style={s.fieldLabel}>Username</label>
            <input type="text" placeholder="Masukkan username" value={username} onChange={e => setUsername(e.target.value)} style={s.input} required />
            <label style={s.fieldLabel}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={s.input} required />
            {loginError && <p style={s.errMsg}>{loginError}</p>}
            <button type="submit" style={s.btnPrimary}>Masuk ke Dashboard →</button>
          </form>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link href="/" style={{ color: '#64748b', fontSize: '12px', textDecoration: 'none' }}>← Kembali ke Beranda</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.dashboard}>
        <div style={s.topbar}>
          <div>
            <h1 style={s.h1}>Dashboard RSVP</h1>
            <p style={s.subTitle}>Monitoring tamu konfirmasi JaxLab</p>
            <div style={s.liveBadge}><span style={s.liveDot} /> Live</div>
          </div>
          <button style={s.btnGhost} onClick={handleLogout}>Logout</button>
        </div>

        <div style={s.statsGrid}>
          {stats.map((st, i) => <div key={i} style={s.statCard}><div style={s.statIconBox(st.bg)}>{st.icon}</div><p style={s.statLabel}>{st.label}</p><p style={s.statVal(st.color)}>{st.value}</p></div>)}
        </div>

        <div style={s.panel}>
          <div style={s.panelHead}>
            <div>
              <p style={s.panelTitle}>Workspace</p>
              <p style={s.panelCount}>Kelola RSVP, scan check-in, dan history pembayaran dalam satu tempat</p>
            </div>
            <div style={s.tabRow}>
              <button style={s.tabBtn(activeTab === 'rsvp')} onClick={() => setActiveTab('rsvp')}>RSVP</button>
              <button style={s.tabBtn(activeTab === 'scan')} onClick={() => setActiveTab('scan')}>Scan</button>
              <button style={s.tabBtn(activeTab === 'history')} onClick={() => setActiveTab('history')}>History</button>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {activeTab === 'rsvp' && renderRSVP()}
            {activeTab === 'scan' && renderScan()}
            {activeTab === 'history' && renderHistory()}
          </div>
        </div>

        <div style={s.footerLink}><Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>← Kembali ke Form RSVP</Link></div>
      </div>
    </div>
  );
}
