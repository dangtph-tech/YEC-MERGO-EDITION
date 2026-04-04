import nodemailer from 'nodemailer';

async function createTransporter(user, pass) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
}

function makeHTMLSafeRegex(keyword) {
  const letters = `{{${keyword}}}`.split('').map(char => {
    return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('(?:<[^>]+>|\\s|&nbsp;)*');
  return new RegExp(letters, 'gi');
}

function processTemplate(template, data) {
  let processedSubject = template.subject;
  let processedContent = template.content;

  // Process all keys provided in data object
  Object.keys(data).forEach(key => {
    if (key === 'placeholders') return;
    const regex = makeHTMLSafeRegex(key);
    const val = data[key] ? data[key].toString() : '';
    processedSubject = processedSubject.replace(regex, val);
    processedContent = processedContent.replace(regex, val);
  });

  return { subject: processedSubject, content: processedContent };
}


async function sendEmailBatch(db, campaignId, user, pass, delayMs) {
  const transporter = await createTransporter(user, pass);
  const campaign = await db.get('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
  const recipients = await db.all('SELECT * FROM recipients WHERE campaign_id = ? AND status = "pending"', [campaignId]);

  console.log(`Starting campaign ${campaignId} with ${recipients.length} recipients.`);

  for (const recipient of recipients) {
    try {
      const placeholders = JSON.parse(recipient.placeholders || '{}');
      const { subject, content } = processTemplate({ subject: campaign.subject, content: campaign.content }, { 
        name: recipient.name, 
        email: recipient.email,
        ...placeholders 
      });

      const campaignAttachments = campaign.attachments ? JSON.parse(campaign.attachments) : [];
      const mailOptionsAttachments = campaignAttachments.map(att => ({
        filename: att.filename,
        path: att.path
      }));

      await transporter.sendMail({
        from: user,
        to: recipient.email,
        subject: subject,
        html: (() => {
          // Strip fixed pixel widths to make content responsive
          let responsiveContent = content;
          responsiveContent = responsiveContent.replace(/width\s*=\s*["']?(\d+)["']?/gi, (match, num) => {
            return parseInt(num) > 100 ? 'width="100%"' : match;
          });
          responsiveContent = responsiveContent.replace(/(<(?:table|td|tr)[^>]*?)height\s*=\s*["']?\d+["']?/gi, '$1');
          responsiveContent = responsiveContent.replace(/width\s*:\s*(\d+)\s*px/gi, (match, num) => {
            return parseInt(num) > 100 ? `width:100%;max-width:${num}px` : match;
          });
          responsiveContent = responsiveContent.replace(/min-width\s*:\s*(\d+)\s*px\s*;?/gi, (match, num) => {
            return parseInt(num) > 100 ? '' : match;
          });

          return `<!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                * { max-width: 100% !important; box-sizing: border-box !important; }
                img { border: 0; height: auto !important; max-width: 100% !important; }
                a { word-break: break-all; }
                .email-container { 
                  max-width: 600px !important; 
                  width: 100% !important;
                  margin: 0 auto !important; 
                  padding: 10px !important; 
                  background-color: #ffffff;
                }
                .email-content { 
                  word-wrap: break-word !important; 
                  overflow-wrap: anywhere !important; 
                  word-break: break-word !important;
                  line-height: 1.6;
                  color: #333333;
                }
                @media only screen and (max-width: 600px) {
                  table { display: block !important; width: 100% !important; }
                  tr { display: block !important; width: 100% !important; }
                  td { display: block !important; width: 100% !important; float: none !important; }
                  tbody { display: block !important; width: 100% !important; }
                  img { width: 100% !important; }
                  .es-desk-hidden { display: block !important; }
                  td[class*="esd-block"] { display: block !important; width: 100% !important; }
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0;">
              <div class="email-container">
                <div class="email-content">
                  ${responsiveContent}
                </div>
              </div>
            </body>
          </html>`;
        })(),
        attachments: mailOptionsAttachments
      });

      await db.run('UPDATE recipients SET status = "sent" WHERE id = ?', [recipient.id]);
      console.log(`Sent email to ${recipient.email}`);

      // Wait for the specified delay before the next email
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to send to ${recipient.email}:`, error);
      await db.run('UPDATE recipients SET status = "failed", error_message = ? WHERE id = ?', [error.message, recipient.id]);
    }
  }

  await db.run('UPDATE campaigns SET status = "completed" WHERE id = ?', [campaignId]);
}

export { sendEmailBatch };
