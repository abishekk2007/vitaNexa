export interface ScanResult {
  barcode: string;
  productName: string;
  brand: string;
  ingredients: string;
  confidence: number;
  nutrition: Record<string, number | null>;
}

let mediaStream: MediaStream | null = null;

export async function startCamera(videoEl: HTMLVideoElement): Promise<void> {
  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
  });
  videoEl.srcObject = mediaStream;
  videoEl.play();
}

export function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}

export function captureFrame(videoEl: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(videoEl, 0, 0);
  return canvas;
}

export async function scanBarcodeFromVideo(videoEl: HTMLVideoElement): Promise<string | null> {
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
      const barcodes = await detector.detect(videoEl);
      if (barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
    } catch { }
  }
  return null;
}

export async function scanBarcodeFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
      const barcodes = await detector.detect(canvas);
      if (barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
    } catch { }
  }
  return null;
}

export function simulateBarcodeDetection(): string | null {
  const prefixes = ['890', '841', '871', '501', '400', '200', '000'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const body = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
  const digits = (prefix + body).split('').map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return prefix + body + check;
}

export async function lookUpOpenFoodFacts(barcode: string): Promise<ScanResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await res.json();
    if (!data.product) return null;

    const p = data.product;
    return {
      barcode,
      productName: p.product_name || 'Unknown Product',
      brand: p.brands || '',
      ingredients: p.ingredients_text || '',
      confidence: data.status === 1 ? 0.9 : 0.5,
      nutrition: {
        energyKcal: p.nutriments?.['energy-kcal_100g'] ?? null,
        protein: p.nutriments?.proteins_100g ?? null,
        fat: p.nutriments?.fat_100g ?? null,
        carbs: p.nutriments?.carbohydrates_100g ?? null,
        fiber: p.nutriments?.fiber_100g ?? null,
        vitaminD: p.nutriments?.['vitamin-d_100g'] ?? null,
        iron: p.nutriments?.iron_100g ?? null,
        calcium: p.nutriments?.calcium_100g ?? null,
        magnesium: p.nutriments?.magnesium_100g ?? null,
        zinc: p.nutriments?.zinc_100g ?? null,
        b12: p.nutriments?.['vitamin-b12_100g'] ?? null,
        omega3: p.nutriments?.['omega-3-fatty-acids_100g'] ?? null,
        vitaminC: p.nutriments?.['vitamin-c_100g'] ?? null,
      },
    };
  } catch {
    return null;
  }
}

export async function performOCR(_canvas: HTMLCanvasElement): Promise<string> {
  try {
    const Tesseract = await import(/* @vite-ignore */ 'tesseract.js');
    const { data } = await Tesseract.recognize(_canvas, 'eng', { logger: () => {} });
    return data.text;
  } catch {
    return '';
  }
}
