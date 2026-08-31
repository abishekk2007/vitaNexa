export interface VoiceResult {
  success: boolean; callId?: string; error?: string;
}

export interface VoiceProvider {
  call(phone: string, message: string): Promise<VoiceResult>;
}

function getProvider(): VoiceProvider {
  const provider = (process.env.VOICE_PROVIDER || 'log').toLowerCase();
  if (provider === 'exotel') return new ExotelVoiceAdapter();
  if (provider === 'twilio') return new TwilioVoiceAdapter();
  return new LogVoiceProvider();
}

class LogVoiceProvider implements VoiceProvider {
  async call(phone: string, message: string) {
    console.log(`[Voice][DEV] Call To: ${phone}, Message: ${message}`);
    return { success: true, callId: `dev-${Date.now()}` };
  }
}

class ExotelVoiceAdapter implements VoiceProvider {
  async call(phone: string, message: string) {
    const apiKey = process.env.VOICE_API_KEY;
    const sid = process.env.EXOTEL_SID;
    if (!apiKey || !sid) return { success: false, error: 'Exotel voice credentials not set' };
    console.log(`[Voice][Exotel] Call To: ${phone}, Message: ${message}`);
    return { success: true, callId: `exotel-call-${Date.now()}` };
  }
}

class TwilioVoiceAdapter implements VoiceProvider {
  async call(phone: string, message: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE;
    if (!accountSid || !authToken || !twilioPhone) return { success: false, error: 'Twilio voice credentials not set' };
    try {
      const twimlResponse = `<Response><Say>${message}</Say></Response>`;
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}` },
        body: new URLSearchParams({ To: phone, From: twilioPhone, Twiml: twimlResponse }).toString(),
      });
      const data: any = await response.json();
      return { success: response.ok, callId: data?.sid, error: data?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export async function callWithEscalation(provider: VoiceProvider, contacts: { phone: string; priority: number; name: string }[], message: string, timeoutMs: number = 60000): Promise<{ contacted: { phone: string; name: string; success: boolean }[] }> {
  const sorted = [...contacts].sort((a, b) => a.priority - b.priority);
  const contacted: { phone: string; name: string; success: boolean }[] = [];

  for (const contact of sorted) {
    const result = await provider.call(contact.phone, message);
    contacted.push({ phone: contact.phone, name: contact.name, success: result.success });
    if (result.success) {
      await new Promise(r => setTimeout(r, timeoutMs));
    }
  }

  return { contacted };
}

export const voiceProvider = getProvider();
