import { GoogleGenAI } from '@google/genai';

export interface TriageInput {
  symptoms: string;
  duration?: string;
  age?: number;
  gender?: string;
}

export interface TriageResult {
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';
  urgency: string;
  recommendation: string;
  emergency: boolean;
  redFlags: string[];
}

export async function analyzeSymptoms(input: TriageInput): Promise<TriageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return rulesBasedTriage(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = 
      You are a clinical triage decision support system.
      Do NOT diagnose. Do NOT prescribe.
      Analyze the following patient profile and symptoms.
      Return ONLY a JSON object (no markdown, no extra text) with this exact schema:
      {
        "severity": "LOW" | "MODERATE" | "HIGH" | "EMERGENCY",
        "urgency": "Brief explanation of how soon they need care",
        "recommendation": "What the patient should do next",
        "emergency": boolean,
        "redFlags": ["list of any red flag symptoms detected"]
      }

      Patient:
      Symptoms: \
      Duration: \
      Age: \
      Gender: \
    ;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    const result = JSON.parse(response.text);
    return {
      severity: result.severity || 'MODERATE',
      urgency: result.urgency || 'Seek medical advice',
      recommendation: result.recommendation || 'Consult a healthcare professional',
      emergency: result.emergency === true,
      redFlags: Array.isArray(result.redFlags) ? result.redFlags : []
    };
  } catch (err) {
    console.error("AI Triage Error, falling back to rules engine:", err);
    return rulesBasedTriage(input);
  }
}

function rulesBasedTriage(input: TriageInput): TriageResult {
  const sym = input.symptoms.toLowerCase();
  
  if (sym.includes('heart') || sym.includes('chest pain') || sym.includes('breath') || sym.includes('bleed') || sym.includes('unconscious') || sym.includes('stroke') || sym.includes('suicid')) {
    return {
      severity: 'EMERGENCY',
      urgency: 'Immediate medical attention required',
      recommendation: 'Call emergency services (108) or go to the nearest emergency department immediately.',
      emergency: true,
      redFlags: ['Potential life-threatening symptom detected']
    };
  } else if (sym.includes('fever') && (sym.includes('high') || sym.includes('days'))) {
    return {
      severity: 'HIGH',
      urgency: 'Within 24 hours',
      recommendation: 'Please visit a Primary Health Centre or Hospital as soon as possible.',
      emergency: false,
      redFlags: ['Persistent high fever']
    };
  } else if (sym.includes('pain') || sym.includes('cough') || sym.includes('vomit')) {
    return {
      severity: 'MODERATE',
      urgency: 'Within 48 hours',
      recommendation: 'Consider scheduling an appointment with a doctor or visiting a local clinic.',
      emergency: false,
      redFlags: []
    };
  } else {
    return {
      severity: 'LOW',
      urgency: 'Routine',
      recommendation: 'Your symptoms appear to require routine consultation. Rest and monitor. If symptoms worsen, seek care.',
      emergency: false,
      redFlags: []
    };
  }
}
