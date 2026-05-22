export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  GIF = 'gif',
  WEBP = 'webp',
  BMP = 'bmp',
}

export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
  FLAC = 'flac',
  AAC = 'aac',
  M4A = 'm4a',
}

export enum DocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  PPTX = 'pptx',
  TXT = 'txt',
  MD = 'md',
  HTML = 'html',
}

export enum ImageAnalysisTask {
  DESCRIBE = 'describe',
  OCR = 'ocr',
  CLASSIFY = 'classify',
  DETECT_OBJECTS = 'detect_objects',
  ANALYZE_FACE = 'analyze_face',
  GENERATE_CAPTION = 'generate_caption',
}

export enum AudioProcessingTask {
  TRANSCRIBE = 'transcribe',
  SYNTHESIZE_SPEECH = 'synthesize_speech',
  EXTRACT_FEATURES = 'extract_features',
  ENHANCE_QUALITY = 'enhance_quality',
  CONVERT_FORMAT = 'convert_format',
}

export enum DocumentProcessingTask {
  PARSE = 'parse',
  EXTRACT_TEXT = 'extract_text',
  SUMMARIZE = 'summarize',
  COMPARE = 'compare',
  CONVERT_FORMAT = 'convert_format',
  EXTRACT_TABLES = 'extract_tables',
}

export interface MediaInput {
  type: MediaType;
  format: string;
  data: Buffer | string; // Base64 or file path
  metadata?: {
    filename?: string;
    size?: number;
    mimeType?: string;
    duration?: number;
    dimensions?: { width: number; height: number };
  };
}

export interface ImageAnalysisResult {
  success: boolean;
  task: ImageAnalysisTask;
  data?: {
    description?: string;
    ocrText?: string;
    classifications?: Array<{
      label: string;
      confidence: number;
    }>;
    objects?: Array<{
      label: string;
      confidence: number;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    faceAnalysis?: {
      emotions: Record<string, number>;
      age?: number;
      gender?: string;
      landmarks?: Array<{ x: number; y: number; type: string }>;
    };
    caption?: string;
  };
  error?: string;
  processingTime: number;
  confidence: number;
}

export interface AudioProcessingResult {
  success: boolean;
  task: AudioProcessingTask;
  data?: {
    text?: string;
    language?: string;
    audioData?: string; // Base64 encoded
    features?: {
      duration: number;
      sampleRate: number;
      channels: number;
      format: string;
    };
    enhancedData?: string;
  };
  error?: string;
  processingTime: number;
  tokensUsed?: number;
}

export interface DocumentProcessingResult {
  success: boolean;
  task: DocumentProcessingTask;
  data?: {
    content?: string;
    structure?: {
      sections: Array<{ title: string; content: string; level: number }>;
      tables: Array<Array<Array<string>>>;
      images: Array<{ alt: string; position: number }>;
    };
    summary?: string;
    comparison?: {
      similarities: number[];
      differences: string[];
    };
    extractedTables?: Array<{
      headers: string[];
      rows: Array<string[]>;
    }>;
  };
  error?: string;
  processingTime: number;
  pageCount?: number;
}

export interface MultimodalConfig {
  imageProcessing?: {
    maxFileSize: number;
    supportedFormats: ImageFormat[];
    defaultQuality: number;
  };
  audioProcessing?: {
    maxDuration: number;
    supportedFormats: AudioFormat[];
    sampleRate: number;
  };
  documentProcessing?: {
    maxFileSize: number;
    supportedFormats: DocumentFormat[];
    maxPages: number;
  };
}
