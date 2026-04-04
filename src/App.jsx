import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CampaignEditor from './components/CampaignEditor';
import SendingPanel from './components/SendingPanel';
import SettingsPanel from './components/Settings';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, editor, sending
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    }
  };

  const handleSaveCampaign = async (campaignData) => {
    try {
      const res = await axios.post('http://localhost:3001/api/campaigns', {
        ...campaignData,
        id: activeCampaignId
      });
      setActiveCampaignId(res.data.id);
      fetchCampaigns();
      alert('Campaign saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save campaign');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await axios.post(`http://localhost:3001/api/campaigns/${id}/delete`);
      fetchCampaigns();
      if (activeCampaignId === id) {
        setActiveCampaignId(null);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSending = (campaignData) => {
    // Ensure it's saved first
    handleSaveCampaign(campaignData).then(() => {
      setActiveTab('sending');
    });
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        campaigns={campaigns}
        activeCampaignId={activeCampaignId}
        setActiveCampaignId={setActiveCampaignId}
      />
      
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            campaigns={campaigns} 
            onSelect={(id) => { setActiveCampaignId(id); setActiveTab('editor'); }}
            onDelete={handleDeleteCampaign}
            onNew={() => { setActiveCampaignId(null); setActiveTab('editor'); }}
          />
        )}
        
        {activeTab === 'editor' && (
          <CampaignEditor 
            campaignId={activeCampaignId}
            onSave={handleSaveCampaign}
            onSend={handleStartSending}
          />
        )}

        {activeTab === 'sending' && (
          <SendingPanel 
            campaignId={activeCampaignId} 
            onFinish={() => { fetchCampaigns(); setActiveTab('dashboard'); }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </main>
    </div>
  );
}

export default App;
