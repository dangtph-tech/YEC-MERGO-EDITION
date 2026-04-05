import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { supabase } from './db.js';
import { sendEmailBatch } from './mailer.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check and diagnostic endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    envCheck: {
      hasUrl: !!process.env.SUPABASE_URL || !!process.env.Project_URL || !!process.env.PROJECT_URL,
      hasKey: !!process.env.SUPABASE_ANON_KEY || !!process.env.SUPABASE_KEY,
      nodeVersion: process.version,
      port: process.env.PORT
    }
  });
});

// Create/Update Campaign
app.post('/api/campaigns', async (req, res) => {
  const { id, name, subject, content, delay, recipients, attachments } = req.body;

  try {
    let campaignId = id;
    const attachmentsJson = JSON.stringify(attachments || []);

    if (id) {
      const { error } = await supabase
        .from('campaigns')
        .update({ name, subject, content, delay, attachments: attachmentsJson })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ name, subject, content, delay: delay || 1000, attachments: attachmentsJson }])
        .select();
      if (error) throw error;
      campaignId = data[0].id;
    }

    // Update recipients if provided
    if (recipients && Array.isArray(recipients)) {
      // Supabase's CASCADE delete handles cleaning up recipients when a campaign is updated?
      // Actually, we'll manually delete and re-insert for now as the current code does.
      await supabase.from('recipients').delete().eq('campaign_id', campaignId);
      
      const newRecipients = recipients.map(r => ({
        campaign_id: campaignId,
        email: r.email,
        name: r.name,
        placeholders: JSON.stringify(r.placeholders || {})
      }));

      const { error: rError } = await supabase.from('recipients').insert(newRecipients);
      if (rError) throw rError;
    }

    res.json({ id: campaignId, message: 'Campaign saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSV Upload (remains the same logic, but client-side could handle this too)
app.post('/api/upload-csv', upload.single('file'), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      fs.unlinkSync(req.file.path); 
      res.json(results);
    });
});

// Attachment Upload (remains local for now, but could be Supabase Storage)
app.post('/api/upload-attachment', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    filename: req.file.originalname,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Start Sending
app.post('/api/send/:campaignId', async (req, res) => {
  const { email, appPassword } = req.body;
  const { campaignId } = req.params;

  if (!email || !appPassword) {
    return res.status(400).json({ error: 'Email and App Password required' });
  }

  try {
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (cError || !campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Start sending in background
    sendEmailBatch(supabase, campaignId, email, appPassword, campaign.delay);
    
    const { error: uError } = await supabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);
    if (uError) throw uError;

    res.json({ message: 'Sending started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Campaign Details
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (cError || !campaign) return res.status(404).json({ error: 'Campaign not found' });
    
    const { data: recipients, error: rError } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', req.params.id);
    if (rError) throw rError;
    
    // Count stats
    const stats = {
      total: recipients.length,
      sent: recipients.filter(r => r.status === 'sent').length,
      failed: recipients.filter(r => r.status === 'failed').length,
      pending: recipients.filter(r => r.status === 'pending').length
    };

    res.json({ ...campaign, recipients, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Campaign
app.post('/api/campaigns/:id/delete', async (req, res) => {
  try {
    const { data: campaign, error: fError } = await supabase
      .from('campaigns')
      .select('attachments')
      .eq('id', req.params.id)
      .single();
      
    if (campaign && campaign.attachments) {
      const attachments = JSON.parse(campaign.attachments);
      attachments.forEach(att => {
        if (fs.existsSync(att.path)) {
          fs.unlinkSync(att.path);
        }
      });
    }

    const { error: dError } = await supabase.from('campaigns').delete().eq('id', req.params.id);
    if (dError) throw dError;

    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
