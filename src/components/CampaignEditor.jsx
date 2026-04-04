import React, { useState, useEffect } from 'react';
import { Save, Send, Upload, Trash2, Eye, Layout, FileText, Users, X, Plus, Wand2, Copy, Info, Edit2, Paperclip } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import * as XLSX from 'xlsx';
import SafeHtmlEditor from './SafeHtmlEditor';
import { API_BASE_URL } from '../config';

const CampaignEditor = ({ campaignId, onSave, onSend }) => {
  const { t } = useLanguage();
  const [campaign, setCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    delay: 1000,
    recipients: [],
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewRecipient, setPreviewRecipient] = useState(null);
  const [manualInput, setManualInput] = useState({ name: '', email: '' });
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractText, setExtractText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop or mobile

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    } else {
      setCampaign({
        name: 'New Outreach Campaign',
        subject: '',
        content: '<p>Hi {{name}},</p><p>We wanted to reach out regarding...</p>',
        delay: 1000,
        recipients: [],
        attachments: []
      });
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/campaigns/${campaignId}`);
      setCampaign({
        ...res.data,
        content: res.data.content || '',
        attachments: res.data.attachments ? JSON.parse(res.data.attachments) : [],
        recipients: res.data.recipients.map(r => ({
          ...r,
          placeholders: JSON.parse(r.placeholders || '{}')
        }))
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileName = file.name.toLowerCase();

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // header: 1 gives us arrays [Row, Row]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      // Skip top row (header)
      const newRecipients = data.slice(1).map(row => {
        if (!row[0] || !row[0].toString().includes('@')) return null;
        
        const placeholders = {};
        // Map Column B (index 1) to "1", Column C (index 2) to "2", etc.
        for (let i = 1; i <= 10; i++) {
          placeholders[i.toString()] = row[i] !== undefined ? row[i].toString() : '';
        }

        return {
          email: row[0].toString().trim(),
          name: (row[1] || row[0].toString().split('@')[0]).toString(),
          placeholders
        };
      }).filter(Boolean);
      
      setCampaign(prev => ({ ...prev, recipients: [...newRecipients, ...prev.recipients] }));
    };
    reader.readAsBinaryString(file);
    setUploading(false);
    e.target.value = null; // Reset input so same file can be uploaded again
  };
  const handleImportDocument = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(t('editor.alertFileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      if (file.name.endsWith('.html')) {
         // Load HTML template
         setCampaign(prev => ({ ...prev, content }));
         setIsHtmlMode(true);
      } else {
         // Load Image
         setCampaign(prev => ({ 
           ...prev, 
           content: (prev.content || '') + `<br/><img src="${content}" style="max-width: 100%; display: block; margin: 10px auto; border-radius: 4px;" alt="Imported document image" />` 
         }));
      }
    };

    if (file.name.endsWith('.html')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleExtractEmails = () => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = extractText.match(emailRegex) || [];
    const uniqueEmails = [...new Set(matches)];
    
    if (uniqueEmails.length === 0) {
      alert(t('editor.alertNoEmails'));
      return;
    }
    
    const newRecipients = uniqueEmails.map(email => ({
      email,
      name: email.split('@')[0], // Guess name from email
      placeholders: { email, name: email.split('@')[0] }
    }));
    
    setCampaign(prev => ({ 
      ...prev, 
      recipients: [...newRecipients, ...prev.recipients] 
    }));
    
    setShowExtractModal(false);
    setExtractText('');
    alert(t('editor.alertExtracted', { count: uniqueEmails.length }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const getAvailablePlaceholders = () => {
    // Just return 1-10 as requested
    return Array.from({ length: 10 }, (_, i) => (i + 1).toString());
  };
  
  const handleUpdateRecipient = (updated) => {
    const newRecipients = campaign.recipients.map((r, i) => 
      i === editingRecipient.index ? updated : r
    );
    setCampaign({ ...campaign, recipients: newRecipients });
    setEditingRecipient(null);
  };
  
  const handleGridChange = (index, field, value) => {
    const updatedRecipients = [...campaign.recipients];
    if (field === 'email') {
      updatedRecipients[index].email = value;
    } else {
      if (!updatedRecipients[index].placeholders) {
        updatedRecipients[index].placeholders = {};
      }
      updatedRecipients[index].placeholders[field] = value;
    }
    setCampaign({ ...campaign, recipients: updatedRecipients });
  };

  const handleAddManual = () => {
    const newRecipient = {
      email: '',
      placeholders: {}
    };
    setCampaign(prev => ({
      ...prev,
      recipients: [newRecipient, ...prev.recipients]
    }));
  };

  const makeHTMLSafeRegex = (keyword) => {
    const letters = `{{${keyword}}}`.split('').map(char => {
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('(?:<[^>]+>|\\s|&nbsp;)*');
    return new RegExp(letters, 'gi');
  };

  const processTemplate = (template, data) => {
    let res = template;
    // Process all keys in data (e.g., name, email, 1, 2, 3...)
    Object.keys(data).forEach(key => {
      if (key === 'placeholders') return;
      const regex = makeHTMLSafeRegex(key);
      const val = data[key] ? data[key].toString() : '';
      res = res.replace(regex, val);
    });
    return res;
  };

  // Strip fixed pixel widths from HTML to make it responsive
  const makeResponsive = (html) => {
    let result = html;
    // Replace width="NNN" HTML attributes (number > 100) with width="100%"
    result = result.replace(/width\s*=\s*["']?(\d+)["']?/gi, (match, num) => {
      return parseInt(num) > 100 ? 'width="100%"' : match;
    });
    // Replace height="NNN" on tables/tds to auto
    result = result.replace(/(<(?:table|td|tr)[^>]*?)height\s*=\s*["']?\d+["']?/gi, '$1');
    // Replace width:NNNpx in inline styles with width:100%;max-width:NNNpx
    result = result.replace(/width\s*:\s*(\d+)\s*px/gi, (match, num) => {
      return parseInt(num) > 100 ? `width:100%;max-width:${num}px` : match;
    });
    // Replace min-width:NNNpx in inline styles (> 100) with nothing
    result = result.replace(/min-width\s*:\s*(\d+)\s*px\s*;?/gi, (match, num) => {
      return parseInt(num) > 100 ? '' : match;
    });
    return result;
  };


  const handleSave = async () => {
    onSave(campaign);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('editor.loading')}</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('editor.title')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('editor.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSave} className="btn btn-outline">
            <Save size={18} /> {t('editor.saveDraft')}
          </button>
          <button 
            onClick={() => onSend(campaign)} 
            className="btn btn-primary"
            disabled={!campaign.recipients.length || !campaign.subject || !campaign.content}
          >
            <Send size={18} /> {t('editor.startCampaign')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Left Column: Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="premium-card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={20} color="var(--primary)" /> 
              {t('editor.information')}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('editor.campaignName')}</label>
              <input 
                className="input-field" 
                value={campaign.name} 
                onChange={e => setCampaign({...campaign, name: e.target.value})} 
                placeholder={t('editor.campaignNamePlaceholder')}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('editor.emailSubject')}</label>
              <input 
                className="input-field" 
                value={campaign.subject} 
                onChange={e => setCampaign({...campaign, subject: e.target.value})} 
                placeholder={t('editor.emailSubjectPlaceholder')}
              />
            </div>
          </div>

          {/* Personalization Toolkit */}
          <div className="premium-card">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wand2 size={20} color="var(--primary)" /> 
              {t('editor.personalization')}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {getAvailablePlaceholders().map((key, index) => (
                <button 
                  key={key} 
                  onClick={() => copyToClipboard(`{{${key}}}`)}
                  className={`variable-circle ${copyFeedback === `{{${key}}}` ? 'copied' : ''}`}
                  title={t('editor.copyPlaceholder', { placeholder: `{{${key}}}`, field: key })}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--primary)" /> 
                {t('editor.emailContent')}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'rgba(255,91,0,0.05)' }}>
                  {t('editor.restoreHtml')}
                  <input type="file" hidden accept=".html,.png,.jpg,.jpeg" onChange={handleImportDocument} />
                </label>
                <button 
                  onClick={() => setIsHtmlMode(!isHtmlMode)}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: isHtmlMode ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
                >
                  {isHtmlMode ? t('editor.codeMode') : t('editor.visualMode')}
                </button>
              </div>
            </div>

            {isHtmlMode ? (
              <textarea 
                className="input-field" 
                style={{ minHeight: '520px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                value={campaign.content} 
                onChange={e => setCampaign({...campaign, content: e.target.value})} 
                placeholder={t('editor.htmlPlaceholder')}
              />
            ) : (
              <div style={{ marginTop: '12px' }}>
                <SafeHtmlEditor 
                  value={campaign.content || ''}
                  onChange={val => setCampaign({...campaign, content: val})}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recipients & Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="premium-card">
            <div style={{ padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={24} color="var(--primary)" /> 
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('editor.recipients')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>{campaign.recipients.length} {t('editor.total')}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setShowExtractModal(true)}
                  className="btn btn-outline" 
                  style={{ padding: '10px 14px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}
                >
                  <Wand2 size={14} /> {t('editor.extractBtn')}
                </button>
                <label className="btn btn-outline" style={{ padding: '10px 14px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                  <Upload size={14} /> {t('editor.importExcel')}
                  <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
            {uploading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>{t('editor.loading')}</p>
            ) : campaign.recipients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{t('editor.noRecipients')}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={handleAddManual} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <Plus size={16} style={{marginRight: '6px'}} /> {t('editor.addEmptyRow')}
                  </button>
                  <label className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <Upload size={16} style={{marginRight: '6px'}} /> {t('editor.importExcel')}
                    <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px 24px', background: 'rgba(255, 91, 0, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 91, 0, 0.2)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <Users size={48} color="var(--primary)" />
                </div>
                <h4 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{t('editor.recipientData')}</h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
                  {t('editor.uploadedContacts', { count: campaign.recipients.length })}
                </p>
                <button 
                  onClick={() => setShowRecipientsModal(true)}
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem', fontWeight: 600 }}
                >
                  <Layout size={20} style={{ marginRight: '8px' }} /> {t('editor.openGrid')}
                </button>
              </div>
            )}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
               <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('editor.delayTitle')}</label>
               <input 
                type="number" 
                className="input-field" 
                value={campaign.delay} 
                onChange={e => setCampaign({...campaign, delay: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>
        </div>
      </div>

      {showRecipientsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="premium-card fade-in" style={{ width: '90vw', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button 
              onClick={() => setShowRecipientsModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={24} />
            </button>
            
            <div style={{ marginBottom: '24px' }}>
               <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Users size={24} color="var(--primary)" /> 
                 {t('editor.gridTitle')}
               </h2>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                 {t('editor.gridSubtitle', { count: campaign.recipients.length })}
               </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button onClick={handleAddManual} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <Plus size={16} style={{marginRight: '6px'}} /> {t('editor.addEmptyRow')}
              </button>
              <label className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <Upload size={16} style={{marginRight: '6px'}} /> {t('editor.importExcel')}
                <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
              </label>
              <button onClick={() => { setShowRecipientsModal(false); setShowExtractModal(true); }} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <Wand2 size={16} style={{marginRight: '6px'}}/> {t('editor.extractBtn')}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(255, 91, 0, 0.1)', backdropFilter: 'blur(16px)', zIndex: 10 }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: '200px' }}>{t('editor.colEmail')}</th>
                      {getAvailablePlaceholders().map(key => (
                        <th key={key} style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: '100px', color: 'var(--primary)' }}>
                          {`{{${key}}}`}
                        </th>
                      ))}
                      <th style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{t('editor.colAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.recipients.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                        <td style={{ padding: 0, borderRight: '1px solid var(--border)' }}>
                          <input 
                            value={r.email || ''} 
                            onChange={(e) => handleGridChange(i, 'email', e.target.value)} 
                            style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', fontSize: '0.85rem' }}
                            placeholder="email@example.com"
                          />
                        </td>
                        {getAvailablePlaceholders().map(key => (
                           <td key={key} style={{ padding: 0, borderRight: '1px solid var(--border)' }}>
                             <input 
                               value={r.placeholders?.[key] || ''} 
                               onChange={(e) => handleGridChange(i, key, e.target.value)} 
                               style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', outline: 'none', fontSize: '0.85rem' }}
                               placeholder="-"
                             />
                           </td>
                        ))}
                        <td style={{ padding: '8px', textAlign: 'center', minWidth: '100px' }}>
                           <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => { setShowRecipientsModal(false); setPreviewRecipient(r); }}
                              className="btn btn-outline" 
                              style={{ padding: '6px', border: 'none', color: 'var(--primary)' }}
                              title={t('editor.actionPreview')}
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                const newRecipients = [...campaign.recipients];
                                newRecipients.splice(i, 1);
                                setCampaign({...campaign, recipients: newRecipients});
                              }}
                              className="btn btn-outline" 
                              style={{ padding: '6px', border: 'none', color: 'var(--error)' }}
                              title={t('editor.actionDelete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {showExtractModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button 
              onClick={() => setShowExtractModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wand2 size={24} color="var(--primary)" /> 
              {t('editor.extractEmailTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
              {t('editor.extractEmailDesc')}
            </p>
            <textarea 
              className="input-field" 
              style={{ minHeight: '200px', marginBottom: '20px' }}
              value={extractText} 
              onChange={e => setExtractText(e.target.value)} 
              placeholder={t('editor.extractPlaceholder')}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowExtractModal(false)} className="btn btn-outline">{t('editor.cancel')}</button>
              <button 
                onClick={handleExtractEmails} 
                className="btn btn-primary"
                disabled={!extractText.trim()}
              >
                {t('editor.extractAddBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .variable-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 91, 0, 0.05);
          border: 1px solid rgba(255, 91, 0, 0.2);
          border-radius: 50%;
          color: var(--primary);
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .variable-circle:hover {
          background: var(--primary);
          color: white;
          transform: scale(1.1);
          box-shadow: 0 0 15px var(--primary-glow);
          border-color: var(--primary);
        }
        .variable-circle.copied {
          background: var(--success);
          border-color: var(--success);
          color: white;
          transform: scale(1.1);
        }
        .variable-chip {
      `}} />

      {editingRecipient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button 
              onClick={() => setEditingRecipient(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px' }}>{t('editor.editRecipient')}</h2>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>{t('editor.name')}</label>
                <input 
                  className="input-field" 
                  value={editingRecipient.name} 
                  onChange={e => setEditingRecipient({...editingRecipient, name: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>{t('editor.email')}</label>
                <input 
                  className="input-field" 
                  value={editingRecipient.email} 
                  onChange={e => setEditingRecipient({...editingRecipient, email: e.target.value})}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingRecipient(null)} className="btn btn-outline">{t('editor.cancel')}</button>
              <button onClick={() => handleUpdateRecipient(editingRecipient)} className="btn btn-primary">{t('editor.saveChanges')}</button>
            </div>
          </div>
        </div>
      )}

      {previewRecipient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="premium-card fade-in" style={{ width: '100%', maxWidth: '900px', maxHeight: '95vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10, padding: '10px 0' }}>
              <h2 style={{ margin: 0 }}>{t('editor.previewModalTitle')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                  <button 
                    onClick={() => setPreviewMode('desktop')} 
                    className={`btn ${previewMode === 'desktop' ? 'btn-primary' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', border: 'none', background: previewMode === 'desktop' ? '' : 'transparent' }}
                  >
                    Laptop
                  </button>
                  <button 
                    onClick={() => setPreviewMode('mobile')} 
                    className={`btn ${previewMode === 'mobile' ? 'btn-primary' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', border: 'none', background: previewMode === 'mobile' ? '' : 'transparent' }}
                  >
                    Mobile
                  </button>
                </div>
                <button 
                  onClick={() => setPreviewRecipient(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
              <strong>To:</strong> {previewRecipient.email} ({previewRecipient.name}) <br/>
              <strong>Subject:</strong> {processTemplate(campaign.subject, { name: previewRecipient.name, email: previewRecipient.email, ...previewRecipient.placeholders })}
            </div>
            <div style={{ 
              margin: '0 auto',
              width: previewMode === 'mobile' ? '375px' : '100%', 
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: previewMode === 'mobile' ? '2px solid var(--border)' : 'none',
              boxShadow: previewMode === 'mobile' ? '0 0 30px rgba(0,0,0,0.3)' : 'none'
            }}>
              <iframe
                key={previewMode}
                title="Email Preview"
                style={{ 
                  width: previewMode === 'mobile' ? '600px' : '100%',
                  minHeight: '500px',
                  border: 'none',
                  background: 'white',
                  display: 'block',
                  transformOrigin: 'top left',
                  transform: previewMode === 'mobile' ? 'scale(0.625)' : 'none',
                  marginBottom: previewMode === 'mobile' ? '-37.5%' : '0'
                }}
                srcDoc={(() => {
                  const rawHtml = processTemplate(campaign.content, { name: previewRecipient.name, email: previewRecipient.email, ...previewRecipient.placeholders });
                  return `<!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <style>
                      body { margin: 0; padding: 0; background: white; }
                      img { max-width: 100%; height: auto; }
                      a { word-break: break-all; }
                    </style>
                  </head>
                  <body>
                    ${rawHtml.replace(/`/g, '\\`')}
                  </body>
                  </html>`;
                })()}
                onLoad={(e) => {
                  const iframe = e.target;
                  const doc = iframe.contentDocument;
                  if (doc && doc.body) {
                    const h = doc.body.scrollHeight;
                    const scale = previewMode === 'mobile' ? 0.625 : 1;
                    iframe.style.height = h + 'px';
                    iframe.parentElement.style.height = Math.ceil(h * scale) + 'px';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignEditor;
