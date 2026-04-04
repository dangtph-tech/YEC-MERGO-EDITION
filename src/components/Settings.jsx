import React, { useState, useEffect } from 'react';
import { Globe, Moon, Sun, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsPanel = () => {
  const { t, lang, setLang } = useLanguage();
  const [theme, setTheme] = useState('dark');
  const [expandedGuide, setExpandedGuide] = useState('import');

  // Load theme on component mount checking the body class
  useEffect(() => {
    if (document.body.classList.contains('light-theme')) {
      setTheme('light');
    }
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  const guides = [
    { id: 'import', title: t('settings.guide1Title'), content: t('settings.guide1Content') },
    { id: 'personalize', title: t('settings.guide2Title'), content: t('settings.guide2Content') },
    { id: 'html', title: t('settings.guide3Title'), content: t('settings.guide3Content') },
    { id: 'extract', title: t('settings.guide4Title'), content: t('settings.guide4Content') }
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('settings.title')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Language & Theme */}
        <div className="premium-card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={22} color="var(--primary)" /> 
            {t('settings.general')}
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
            <div style={{ paddingRight: '20px' }}>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>{t('settings.language')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.languageDesc')}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(161, 161, 170, 0.1)', padding: '4px', borderRadius: '12px' }}>
              <button 
                onClick={() => setLang('en')} 
                className={`btn ${lang === 'en' ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '8px', background: lang === 'en' ? '' : 'transparent', border: 'none', color: lang === 'en' ? 'white' : 'var(--text-muted)' }}
              >
                English
              </button>
              <button 
                onClick={() => setLang('vi')} 
                className={`btn ${lang === 'vi' ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '8px', background: lang === 'vi' ? '' : 'transparent', border: 'none', color: lang === 'vi' ? 'white' : 'var(--text-muted)' }}
              >
                Tiếng Việt
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ paddingRight: '20px' }}>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>{t('settings.theme')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.themeDesc')}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(161, 161, 170, 0.1)', padding: '4px', borderRadius: '12px' }}>
              <button 
                onClick={() => toggleTheme('light')} 
                className={`btn ${theme === 'light' ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '8px', background: theme === 'light' ? '' : 'transparent', border: 'none', color: theme === 'light' ? 'white' : 'var(--text-muted)' }}
              >
                <Sun size={16} style={{marginRight: '6px'}}/> {t('settings.light')}
              </button>
              <button 
                onClick={() => toggleTheme('dark')} 
                className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '8px', background: theme === 'dark' ? '' : 'transparent', border: 'none', color: theme === 'dark' ? 'white' : 'var(--text-muted)' }}
              >
                <Moon size={16} style={{marginRight: '6px'}}/> {t('settings.dark')}
              </button>
            </div>
          </div>
        </div>

        {/* User Guide */}
        <div className="premium-card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} color="var(--primary)" /> 
            {t('settings.guide')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {guides.map(guide => (
              <div key={guide.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: expandedGuide === guide.id ? 'rgba(161, 161, 170, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                <button 
                  onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'transparent', border: 'none', color: expandedGuide === guide.id ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}
                >
                  {guide.title}
                  {expandedGuide === guide.id ? <ChevronDown size={20} color="var(--primary)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                </button>
                {expandedGuide === guide.id && (
                  <div style={{ padding: '0 20px 20px 20px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {guide.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
