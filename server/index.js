import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { setupDb } from './db.js';
import { sendEmailBatch } from './mailer.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

let db;

setupDb().then(database => {
  db = database;
  console.log('Database initialized');
});

// Create/Update Campaign (with auto-save)
app.post('/api/campaigns', async (req, res) => {
  const { id, name, subject, content, delay, recipients, attachments } = req.body;

  try {
    let campaignId = id;
    const attachmentsJson = JSON.stringify(attachments || []);

    if (id) {
      await db.run(
        'UPDATE campaigns SET name = ?, subject = ?, content = ?, delay = ?, attachments = ? WHERE id = ?',
        [name, subject, content, delay, attachmentsJson, id]
      );
    } else {
      const result = await db.run(
        'INSERT INTO campaigns (name, subject, content, delay, attachments) VALUES (?, ?, ?, ?, ?)',
        [name, subject, content, delay || 1000, attachmentsJson]
      );
      campaignId = result.lastID;
    }

    // Update recipients if provided
    if (recipients && Array.isArray(recipients)) {
      await db.run('DELETE FROM recipients WHERE campaign_id = ?', [campaignId]);
      for (const r of recipients) {
        await db.run(
          'INSERT INTO recipients (campaign_id, email, name, placeholders) VALUES (?, ?, ?, ?)',
          [campaignId, r.email, r.name, JSON.stringify(r.placeholders || {})]
        );
      }
    }

    res.json({ id: campaignId, message: 'Campaign saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSV Upload
app.post('/api/upload-csv', upload.single('file'), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      fs.unlinkSync(req.file.path); // Clean up
      res.json(results);
    });
});

// Attachment Upload
app.post('/api/upload-attachment', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    filename: req.file.originalname,
    path: req.file.path, // e.g., 'uploads/filename'
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
    const campaign = await db.get('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Start sending in background
    sendEmailBatch(db, campaignId, email, appPassword, campaign.delay);
    
    await db.run('UPDATE campaigns SET status = "sending" WHERE id = ?', [campaignId]);
    res.json({ message: 'Sending started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await db.all('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Campaign Details
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await db.get('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    
    const recipients = await db.all('SELECT * FROM recipients WHERE campaign_id = ?', [req.params.id]);
    
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
    const campaign = await db.get('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (campaign && campaign.attachments) {
      const attachments = JSON.parse(campaign.attachments);
      attachments.forEach(att => {
        if (fs.existsSync(att.path)) {
          fs.unlinkSync(att.path);
        }
      });
    }

    await db.run('DELETE FROM campaigns WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM recipients WHERE campaign_id = ?', [req.params.id]);
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
