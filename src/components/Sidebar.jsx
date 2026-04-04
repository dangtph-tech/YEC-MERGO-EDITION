import React from 'react';
import { LayoutDashboard, PlusCircle, Settings, Mail, LogOut, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Sidebar = ({ activeTab, setActiveTab, campaigns, activeCampaignId, setActiveCampaignId }) => {
  const { t } = useLanguage();
  return (
    <aside className="sidebar" style={{
      width: 'var(--sidebar-w)',
      backgroundColor: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '24px 16px'
    }}>
      <div className="logo-section" style={{ marginBottom: '40px', padding: '0 8px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={28} />
          MERGO
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>YEC EDITION</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          <li style={{ marginBottom: '8px' }}>
            <button 
              onClick={() => { setActiveTab('dashboard'); setActiveCampaignId(null); }}
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              {t('sidebar.dashboard')}
            </button>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <button 
              onClick={() => { setActiveTab('editor'); setActiveCampaignId(null); }}
              className={`nav-item ${activeTab === 'editor' && !activeCampaignId ? 'active' : ''}`}
            >
              <PlusCircle size={20} />
              {t('sidebar.newCampaign')}
            </button>
          </li>
          
          {campaigns.length > 0 && (
            <>
              <div style={{ margin: '24px 8px 12px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('sidebar.recentCampaigns')}</div>
              {campaigns.slice(0, 5).map(c => (
                <li key={c.id} style={{ marginBottom: '4px' }}>
                  <button 
                    onClick={() => { setActiveCampaignId(c.id); setActiveTab('editor'); }}
                    className={`nav-item ${activeCampaignId === c.id ? 'active' : ''}`}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <ChevronRight size={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <button 
          onClick={() => { setActiveTab('settings'); setActiveCampaignId(null); }}
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={20} />
          {t('sidebar.settings')}
        </button>
        <button className="nav-item" style={{ color: 'var(--error)' }}>
          <LogOut size={20} />
          {t('sidebar.logout')}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
        }
        .nav-item.active {
          background: var(--primary-glow);
          color: var(--primary);
        }
      `}} />
    </aside>
  );
};

export default Sidebar;
