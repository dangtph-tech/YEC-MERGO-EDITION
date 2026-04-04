import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SendingPanel = ({ campaignId, onFinish }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, completed
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 });
  const [recipients, setRecipients] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'sending') {
      fetchStatus(); // Call immediately
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/campaigns/${campaignId}`);
      setStats(res.data.stats);
      setRecipients(res.data.recipients);
      
      if (res.data.status === 'completed') {
        setStatus('completed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startSending = async () => {
    if (!email || !password) {
      alert(t('sending.alertAuthRequired'));
      return;
    }

    try {
      setError(null);
      const res = await axios.post(`${API_BASE_URL}/send/${campaignId}`, {
        email,
        appPassword: password
      });
      setStatus('sending');
    } catch (err) {
      setError(err.response?.data?.error || t('sending.errorStart'));
    }
  };

  const progress = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('sending.title')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('sending.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Left: Input Credentials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="premium-card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--primary)" /> 
              {t('sending.authTitle')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {t('sending.authDesc')}
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('sending.labelEmail')}</label>
              <input 
                className="input-field" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="your.email@gmail.com"
                disabled={status !== 'idle'}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('sending.labelPassword')}</label>
              <input 
                type="password"
                className="input-field" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="abcd efgh ijkl mnop"
                disabled={status !== 'idle'}
              />
            </div>

            {status === 'idle' ? (
              <button onClick={startSending} className="btn btn-primary" style={{ width: '100%' }}>
                <Mail size={18} /> {t('sending.confirmBtn')}
              </button>
            ) : status === 'sending' ? (
              <div style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={20} className="spin" />
                {t('sending.sendingStatus')}
              </div>
            ) : (
              <button onClick={onFinish} className="btn btn-outline" style={{ width: '100%' }}>
                <CheckCircle size={18} /> {t('sending.allDone')}
              </button>
            )}

            {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center' }}>{error}</p>}
          </div>

          <div className="premium-card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
             <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.sent}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{t('sending.sent')}</div>
             </div>
             <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.failed}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600 }}>{t('sending.failed')}</div>
             </div>
             <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.pending}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('sending.pending')}</div>
             </div>
          </div>
        </div>

        {/* Right: Detailed Log */}
        <div className="premium-card">
          <h3 style={{ marginBottom: '20px' }}>{t('sending.deliveryStatus')}</h3>
          <div style={{ height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ 
              height: '100%', 
              width: `${progress}%`, 
              background: 'linear-gradient(90deg, var(--primary), #FFB700)',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>

          <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border)' }}>{t('sending.colRecipient')}</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border)' }}>{t('sending.colStatus')}</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border)' }}>{t('sending.colNotes')}</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{r.name || 'No Name'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {r.status === 'sent' && <span className="badge badge-sent"><CheckCircle size={12} /> {t('sending.sent')}</span>}
                      {r.status === 'failed' && <span className="badge badge-failed"><AlertCircle size={12} /> {t('sending.failed')}</span>}
                      {r.status === 'pending' && <span className="badge badge-pending">{t('sending.pending')}</span>}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--error)', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.error_message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1.5s linear infinite; }
      `}} />
    </div>
  );
};

export default SendingPanel;
