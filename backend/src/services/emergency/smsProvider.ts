export interface SmsResult {
  success: boolean; messageId?: string; error?: string;
}

export interface SmsProvider {
  send(phone: string, message: string): Promise<SmsResult>;
}

function getProvider(): SmsProvider {
  const provider = (process.env.SMS_PROVIDER || 'log').toLowerCase();
  if (provider === 'msg91') return new Msg91Adapter();
  if (provider === 'exotel') return new ExotelAdapter();
  if (provider === 'twilio') return new TwilioAdapter();
  return new LogSmsProvider();
}

class LogSmsProvider implements SmsProvider {
  async send(phone: string, message: string) {
    console.log(`[SMS][DEV] To: ${phone}, Message: ${message}`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}

class Msg91Adapter implements SmsProvider {
  async send(phone: string, message: string) {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) return { success: false, error: 'MSG91_API_KEY not set' };
    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: apiKey },
        body: JSON.stringify({ sender: 'VITNEX', mobiles: phone.replace('+', ''), message }),
      });
      const data: any = await response.json();
      return { success: response.ok, messageId: data?.type === 'success' ? `msg91-${Date.now()}` : undefined, error: data?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

class ExotelAdapter implements SmsProvider {
  async send(phone: string, message: string) {
    const apiKey = process.env.SMS_API_KEY;
    const sid = process.env.EXOTEL_SID;
    if (!apiKey || !sid) return { success: false, error: 'Exotel credentials not set' };
    console.log(`[SMS][Exotel] To: ${phone}, Message: ${message}`);
    return { success: true, messageId: `exotel-${Date.now()}` };
  }
}

class TwilioAdapter implements SmsProvider {
  async send(phone: string, message: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE;
    if (!accountSid || !authToken || !twilioPhone) return { success: false, error: 'Twilio credentials not set' };
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}` },
        body: new URLSearchParams({ To: phone, From: twilioPhone, Body: message }).toString(),
      });
      const data: any = await response.json();
      return { success: response.ok, messageId: data?.sid, error: data?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export async function sendWithRetry(provider: SmsProvider, phone: string, message: string, maxRetries: number = 3): Promise<SmsResult & { attempts: number }> {
  let lastResult: SmsResult = { success: false, error: 'No attempt made' };
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await provider.send(phone, message);
    if (lastResult.success) return { ...lastResult, attempts: attempt };
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return { ...lastResult, attempts: maxRetries };
}

export const smsProvider = getProvider();
