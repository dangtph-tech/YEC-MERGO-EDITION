import React from 'react';
import { Mail, Clock, CheckCircle, AlertCircle, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = ({ campaigns, onSelect, onDelete, onNew }) => {
  const { t } = useLanguage();
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="badge badge-sent"><CheckCircle size={12} /> {t('dashboard.status.completed')}</span>;
      case 'sending': return <span className="badge badge-active"><Clock size={12} /> {t('dashboard.status.sending')}</span>;
      case 'failed': return <span className="badge badge-failed"><AlertCircle size={12} /> {t('dashboard.failed')}</span>;
      default: return <span className="badge badge-pending">{t('dashboard.status.draft')}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('dashboard.title')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.subtitle')}</p>
        </div>
        <button onClick={onNew} className="btn btn-primary">
          <Plus size={20} />
          {t('dashboard.newCampaign')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {campaigns.length === 0 ? (
          <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
            <Mail size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3>{t('dashboard.noCampaignsTitle')}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.noCampaignsDesc')}</p>
          </div>
        ) : (
          campaigns.map(c => (
            <div key={c.id} className="premium-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                {getStatusBadge(c.status)}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', minHeight: '3em' }}>{c.subject || 'No subject'}</p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => onSelect(c.id)} 
                  className="btn btn-outline" 
                  style={{ flex: 1, height: '40px' }}
                >
                  Edit <ArrowRight size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  className="btn btn-outline" 
                  style={{ width: '40px', height: '40px', padding: 0, color: 'var(--error)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
