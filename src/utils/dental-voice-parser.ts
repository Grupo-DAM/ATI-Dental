import { ToothState, ToothSurface, ALL_TOOTH_STATES } from '@/types/clinical-record';

export interface ParsedVoiceCommand {
  success: boolean;
  toothNumber?: number;
  state?: ToothState | 'sano';
  surface?: ToothSurface;
  rawText: string;
  error?: 'TOOTH_OUT_OF_RANGE' | 'UNKNOWN_STATE' | 'INVALID_COMMAND';
  feedbackMessage?: string;
}

// Mapeo de números hablados en español a dígitos
const SPANISH_NUMBER_WORDS: Record<string, number> = {
  'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
  'dieciseis': 16, 'dieciséis': 16, 'diecisiete': 17, 'dieciocho': 18,
  'veintiuno': 21, 'veintidos': 22, 'veintidós': 22, 'veintitres': 23, 'veintitrés': 23,
  'veinticuatro': 24, 'veinticinco': 25, 'veintiseis': 26, 'veintiséis': 26, 'veintisiete': 27, 'veintiocho': 28,
  'treinta y uno': 31, 'treinta y dos': 32, 'treinta y tres': 33, 'treinta y cuatro': 34,
  'treinta y cinco': 35, 'treinta y seis': 36, 'treinta y siete': 37, 'treinta y ocho': 38,
  'cuarenta y uno': 41, 'cuarenta y dos': 42, 'cuarenta y tres': 43, 'cuarenta y cuatro': 44,
  'cuarenta y cinco': 45, 'cuarenta y seis': 46, 'cuarenta y siete': 47, 'cuarenta y ocho': 48,
  // Pediátricos (cuadrantes 5 al 8)
  'cincuenta y uno': 51, 'cincuenta y dos': 52, 'cincuenta y tres': 53, 'cincuenta y cuatro': 54, 'cincuenta y cinco': 55,
  'sesenta y uno': 61, 'sesenta y dos': 62, 'sesenta y tres': 63, 'sesenta y cuatro': 64, 'sesenta y cinco': 65,
  'setenta y uno': 71, 'setenta y dos': 72, 'setenta y tres': 73, 'setenta y cuatro': 74, 'setenta y cinco': 75,
  'ochenta y uno': 81, 'ochenta y dos': 82, 'ochenta y tres': 83, 'ochenta y cuatro': 84, 'ochenta y cinco': 85,
};

// Diccionario de sinónimos hablados para cada estado de la app
const STATE_SYNONYMS: Record<string, ToothState | 'sano'> = {
  // Caries (cavity)
  'caries': 'cavity',
  'carie': 'cavity',
  'picado': 'cavity',
  'cavidad': 'cavity',
  // Obturado / Calzado (filled)
  'obturado': 'filled',
  'obturacion': 'filled',
  'obturación': 'filled',
  'calzado': 'filled',
  'calza': 'filled',
  'resina': 'filled',
  'amalgama': 'filled',
  'empaste': 'filled',
  // Ausente (missing)
  'ausente': 'missing',
  'falta': 'missing',
  'perdido': 'missing',
  'extraido': 'missing',
  'extraído': 'missing',
  // Implante (implant)
  'implante': 'implant',
  // Endodoncia (root_canal)
  'endodoncia': 'root_canal',
  'conducto': 'root_canal',
  'tratamiento de conducto': 'root_canal',
  // Corona / Prótesis fija (fixed_dental_prosthesis)
  'corona': 'fixed_dental_prosthesis',
  'funda': 'fixed_dental_prosthesis',
  'puente': 'fixed_dental_prosthesis',
  // Raíz retenida (retained_root)
  'raiz': 'retained_root',
  'raíz': 'retained_root',
  'remanente': 'retained_root',
  'resto radicular': 'retained_root',
  // En erupción (in_eruption)
  'erupcion': 'in_eruption',
  'erupción': 'in_eruption',
  'saliendo': 'in_eruption',
  // Temporal (temporal)
  'temporal': 'temporal',
  'provisional': 'temporal',
  // Sano / Sin afección
  'sano': 'sano',
  'limpio': 'sano',
  'normal': 'sano',
};

const STATE_DISPLAY_NAMES: Record<ToothState | 'sano', string> = {
  cavity: 'Caries',
  filled: 'Obturado',
  missing: 'Ausente',
  implant: 'Implante',
  root_canal: 'Endodoncia',
  fixed_dental_prosthesis: 'Prótesis Fija',
  retained_root: 'Remanente Radicular',
  in_eruption: 'En Erupción',
  temporal: 'Temporal',
  sano: 'Sano',
};

// Superficies dentales
const SURFACE_SYNONYMS: Record<string, ToothSurface> = {
  'oclusal': 'oclusal',
  'ocluso': 'oclusal',
  'mesial': 'mesial',
  'distal': 'distal',
  'vestibular': 'vestibular',
  'lingual': 'lingual',
};

// Rangos válidos FDI
export function isValidFdiToothNumber(num: number, isAdult = true): boolean {
  if (isAdult) {
    // Cuadrantes 1, 2, 3, 4 (piezas 1 a 8)
    const validAdult = [
      11, 12, 13, 14, 15, 16, 17, 18,
      21, 22, 23, 24, 25, 26, 27, 28,
      31, 32, 33, 34, 35, 36, 37, 38,
      41, 42, 43, 44, 45, 46, 47, 48,
    ];
    return validAdult.includes(num);
  } else {
    // Cuadrantes 5, 6, 7, 8 (piezas 1 a 5)
    const validPediatric = [
      51, 52, 53, 54, 55,
      61, 62, 63, 64, 65,
      71, 72, 73, 74, 75,
      81, 82, 83, 84, 85,
    ];
    return validPediatric.includes(num);
  }
}

/**
 * Parsea un comando de voz libre en español para el odontograma.
 * Ejemplos aceptados:
 * - "Diente 18 caries"
 * - "Pieza veinticuatro endodoncia"
 * - "16 obturado oclusal"
 * - "Diente 31 sano"
 */
export function parseDentalVoiceCommand(
  rawTranscript: string,
  isAdult = true
): ParsedVoiceCommand {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    return {
      success: false,
      rawText: '',
      error: 'INVALID_COMMAND',
      feedbackMessage: 'Comando no reconocido',
    };
  }

  const normalized = rawTranscript.trim().toLowerCase();

  // 1. Extraer el número del diente (en dígitos o en palabras)
  let detectedNumber: number | null = null;

  // Buscar dígitos (ej. "18", "24")
  const digitMatch = normalized.match(/\b([1-8][1-8])\b/);
  if (digitMatch) {
    detectedNumber = Number.parseInt(digitMatch[1], 10);
  } else {
    // Buscar en números hablados
    for (const [word, num] of Object.entries(SPANISH_NUMBER_WORDS)) {
      if (normalized.includes(word)) {
        detectedNumber = num;
        break;
      }
    }
  }

  if (detectedNumber === null) {
    return {
      success: false,
      rawText: rawTranscript,
      error: 'INVALID_COMMAND',
      feedbackMessage: 'No se detectó el número de diente en el comando',
    };
  }

  // 2. Validar rango FDI
  if (!isValidFdiToothNumber(detectedNumber, isAdult)) {
    return {
      success: false,
      toothNumber: detectedNumber,
      rawText: rawTranscript,
      error: 'TOOTH_OUT_OF_RANGE',
      feedbackMessage: `Diente ${detectedNumber} fuera del rango válido (${isAdult ? '11-48' : '51-85'})`,
    };
  }

  // 3. Detectar el estado/afección
  let detectedState: ToothState | 'sano' | null = null;
  for (const [keyword, state] of Object.entries(STATE_SYNONYMS)) {
    // Regex para buscar la palabra completa
    const stateRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (stateRegex.test(normalized)) {
      detectedState = state;
      break;
    }
  }

  if (!detectedState) {
    return {
      success: false,
      toothNumber: detectedNumber,
      rawText: rawTranscript,
      error: 'UNKNOWN_STATE',
      feedbackMessage: 'Estado o afección no reconocida',
    };
  }

  // 4. Detectar superficie opcional (ej. oclusal, mesial)
  let detectedSurface: ToothSurface | undefined = undefined;
  for (const [keyword, surface] of Object.entries(SURFACE_SYNONYMS)) {
    if (normalized.includes(keyword)) {
      detectedSurface = surface;
      break;
    }
  }
  const displayState = STATE_DISPLAY_NAMES[detectedState] || detectedState;
  const displaySurface = detectedSurface
      ? ` (${detectedSurface.charAt(0).toUpperCase() + detectedSurface.slice(1)})`
      : '';
  return {
    success: true,
    toothNumber: detectedNumber,
    state: detectedState,
    surface: detectedSurface,
    rawText: rawTranscript,
    feedbackMessage: `Diente ${detectedNumber}: ${displayState}${displaySurface}`,
  };
}