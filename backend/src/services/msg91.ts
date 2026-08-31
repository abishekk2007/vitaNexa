export interface Msg91Result {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface Msg91Config {
  apiKey: string;
  templateId: string;
  senderId: string;
}

function getConfig(): Msg91Config {
  return {
    apiKey: process.env.MSG91_API_KEY || '',
    templateId: process.env.MSG91_TEMPLATE_ID || '',
    senderId: process.env.MSG91_SENDER_ID || '',
  };
}

function isConfigured(): boolean {
  const cfg = getConfig();
  return Boolean(cfg.apiKey && cfg.senderId);
}

export async function sendEmergencySMS(phone: string, message: string): Promise<Msg91Result> {
  const cfg = getConfig();
  if (!cfg.apiKey || !cfg.senderId) {
    console.log(`[MSG91][DEV] Would send to ${phone}: ${message.substring(0, 60)}...`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  try {
    const payload: any = {
      sender: cfg.senderId,
      mobiles: phone.replace('+', ''),
    };
    if (cfg.templateId) {
      payload.template_id = cfg.templateId;
    }
    payload.message = message;

    const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: cfg.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json();
    if (response.ok && data?.type === 'success') {
      return { success: true, messageId: `msg91-${Date.now()}` };
    }
    console.error('[MSG91] API error:', data);
    return { success: false, error: data?.message || `HTTP ${response.status}` };
  } catch (err: any) {
    console.error('[MSG91] Network error:', err);
    return { success: false, error: err.message };
  }
}

export async function sendTestSMS(phone: string): Promise<Msg91Result> {
  const message = 'This is a VitaNexa emergency contact test.\n\nNo action is required.\n\nThis message confirms your emergency contact is configured correctly.';
  return sendEmergencySMS(phone, message);
}

export async function sendSosSMS(phone: string, userName: string, latitude: number, longitude: number): Promise<Msg91Result> {
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const message = `VitaNexa Emergency Alert\n\n${userName} needs immediate help.\n\nCurrent Location:\n${mapsLink}\n\nPlease contact them immediately.`;
  return sendEmergencySMS(phone, message);
}

export { isConfigured };
