import {
  MediaType,
  ImageFormat,
  AudioFormat,
  DocumentFormat,
  ImageAnalysisTask,
  AudioProcessingTask,
  DocumentProcessingTask,
} from '@/lib/multimodal/types';

describe('Multimodal Types', () => {
  describe('MediaType Enum', () => {
    it('should have all media types defined', () => {
      expect(Object.keys(MediaType).length).toBe(4);
      expect(MediaType.IMAGE).toBe('image');
      expect(MediaType.AUDIO).toBe('audio');
      expect(MediaType.VIDEO).toBe('video');
      expect(MediaType.DOCUMENT).toBe('document');
    });
  });

  describe('ImageFormat Enum', () => {
    it('should have common image formats', () => {
      expect(ImageFormat.PNG).toBe('png');
      expect(ImageFormat.JPEG).toBe('jpeg');
      expect(ImageFormat.GIF).toBe('gif');
      expect(ImageFormat.WEBP).toBe('webp');
    });
  });

  describe('AudioFormat Enum', () => {
    it('should have audio formats', () => {
      expect(AudioFormat.MP3).toBe('mp3');
      expect(AudioFormat.WAV).toBe('wav');
      expect(AudioFormat.AAC).toBe('aac');
    });
  });

  describe('DocumentFormat Enum', () => {
    it('should have document formats', () => {
      expect(DocumentFormat.PDF).toBe('pdf');
      expect(DocumentFormat.DOCX).toBe('docx');
      expect(DocumentFormat.TXT).toBe('txt');
      expect(DocumentFormat.MD).toBe('md');
    });
  });

  describe('ImageAnalysisTask Enum', () => {
    it('should have all image analysis tasks', () => {
      const tasks = Object.keys(ImageAnalysisTask);
      expect(tasks.length).toBe(6);

      expect(ImageAnalysisTask.DESCRIBE).toBe('describe');
      expect(ImageAnalysisTask.OCR).toBe('ocr');
      expect(ImageAnalysisTask.CLASSIFY).toBe('classify');
      expect(ImageAnalysisTask.DETECT_OBJECTS).toBe('detect_objects');
      expect(ImageAnalysisTask.ANALYZE_FACE).toBe('analyze_face');
      expect(ImageAnalysisTask.GENERATE_CAPTION).toBe('generate_caption');
    });
  });

  describe('AudioProcessingTask Enum', () => {
    it('should have all audio processing tasks', () => {
      const tasks = Object.keys(AudioProcessingTask);
      expect(tasks.length).toBe(5);

      expect(AudioProcessingTask.TRANSCRIBE).toBe('transcribe');
      expect(AudioProcessingTask.SYNTHESIZE_SPEECH).toBe('synthesize_speech');
      expect(AudioProcessingTask.EXTRACT_FEATURES).toBe('extract_features');
      expect(AudioProcessingTask.ENHANCE_QUALITY).toBe('enhance_quality');
      expect(AudioProcessingTask.CONVERT_FORMAT).toBe('convert_format');
    });
  });

  describe('DocumentProcessingTask Enum', () => {
    it('should have all document processing tasks', () => {
      const tasks = Object.keys(DocumentProcessingTask);
      expect(tasks.length).toBe(6);

      expect(DocumentProcessingTask.PARSE).toBe('parse');
      expect(DocumentProcessingTask.EXTRACT_TEXT).toBe('extract_text');
      expect(DocumentProcessingTask.SUMMARIZE).toBe('summarize');
      expect(DocumentProcessingTask.COMPARE).toBe('compare');
      expect(DocumentProcessingTask.CONVERT_FORMAT).toBe('convert_format');
      expect(DocumentProcessingTask.EXTRACT_TABLES).toBe('extract_tables');
    });
  });
});
