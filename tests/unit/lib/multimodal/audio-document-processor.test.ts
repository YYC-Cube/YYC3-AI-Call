import { AudioProcessor } from '@/lib/multimodal/audio-processor';
import { DocumentProcessor } from '@/lib/multimodal/document-processor';
import {
  MediaInput,
  AudioProcessingTask,
  DocumentProcessingTask,
  AudioFormat,
  DocumentFormat,
  MediaType,
  ImageFormat,
} from '@/lib/multimodal/types';

describe('AudioProcessor', () => {
  let processor: AudioProcessor;

  beforeEach(() => {
    processor = new AudioProcessor();
  });

  const createTestAudio = (
    format: AudioFormat = AudioFormat.MP3
  ): MediaInput => ({
    type: MediaType.AUDIO,
    format,
    data: 'audio-data',
    metadata: {
      filename: `test.${format}`,
      size: 5 * 1024 * 1024, // 5MB
      duration: 120, // 2 minutes
      mimeType: `audio/${format}`,
    },
  });

  describe('Initialization', () => {
    it('should create processor with default config', () => {
      expect(processor).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject non-audio media type', async () => {
      const invalidInput: MediaInput = {
        type: MediaType.IMAGE,
        format: 'png' as ImageFormat,
        data: 'data',
      };

      await expect(
        processor.processAudio(invalidInput, AudioProcessingTask.TRANSCRIBE)
      ).rejects.toThrow('Invalid media type');
    });
  });

  describe('Audio Processing Tasks', () => {
    const validAudio = createTestAudio();

    describe('TRANSCRIBE Task', () => {
      it('should transcribe audio to text', async () => {
        const result = await processor.processAudio(
          validAudio,
          AudioProcessingTask.TRANSCRIBE
        );

        expect(result.success).toBe(true);
        expect(result.task).toBe(AudioProcessingTask.TRANSCRIBE);
        expect(result.data?.text).toBeDefined();
        expect(typeof result.data?.text).toBe('string');
        expect(result.processingTime).toBeGreaterThan(0);
      }, 15000);
    });

    describe('SYNTHESIZE_SPEECH Task', () => {
      it('should synthesize speech from text', async () => {
        const inputWithText = createTestAudio();
        (inputWithText.data as any) = { text: 'Hello, this is a test' };

        const result = await processor.processAudio(
          inputWithText,
          AudioProcessingTask.SYNTHESIZE_SPEECH
        );

        expect(result.success).toBe(true);
        expect(result.data?.audioData).toBeDefined();
        expect(result.data?.features).toBeDefined();

        if (result.data?.features) {
          expect(result.data.features.duration).toBeDefined();
          expect(result.data.features.format).toBeDefined();
        }
      });
    });

    describe('EXTRACT_FEATURES Task', () => {
      it('should extract audio features', async () => {
        const result = await processor.processAudio(
          validAudio,
          AudioProcessingTask.EXTRACT_FEATURES
        );

        expect(result.success).toBe(true);
        expect(result.data?.features).toBeDefined();

        if (result.data?.features) {
          expect(result.data.features.duration).toBe(validAudio.metadata?.duration);
          expect(result.data.features.sampleRate).toBeDefined();
          expect(result.data.features.channels).toBeDefined();
        }
      });
    });

    describe('ENHANCE_QUALITY Task', () => {
      it('should enhance audio quality', async () => {
        const result = await processor.processAudio(
          validAudio,
          AudioProcessingTask.ENHANCE_QUALITY
        );

        expect(result.success).toBe(true);
        expect(result.data?.enhancedData).toBeDefined();
      });
    });

    describe('CONVERT_FORMAT Task', () => {
      it('should convert audio format', async () => {
        const inputWithTarget = createTestAudio();
        (inputWithTarget.data as any) = { targetFormat: 'wav' };

        const result = await processor.processAudio(
          inputWithTarget,
          AudioProcessingTask.CONVERT_FORMAT
        );

        expect(result.success).toBe(true);
        expect(result.data?.features?.format).toBe('wav');
      });
    });
  });
});

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor;

  beforeEach(() => {
    processor = new DocumentProcessor();
  });

  const createTestDoc = (
    format: DocumentFormat = DocumentFormat.PDF
  ): MediaInput => ({
    type: MediaType.DOCUMENT,
    format,
    data: 'document-data',
    metadata: {
      filename: `test.${format}`,
      size: 10 * 1024 * 1024, // 10MB
      mimeType: `application/${format}`,
    },
  });

  describe('Initialization', () => {
    it('should create processor with default config', () => {
      expect(processor).toBeDefined();
    });
  });

  describe('Document Processing Tasks', () => {
    const validDoc = createTestDoc();

    describe('PARSE Task', () => {
      it('should parse document structure', async () => {
        const result = await processor.processDocument(
          validDoc,
          DocumentProcessingTask.PARSE
        );

        expect(result.success).toBe(true);
        expect(result.task).toBe(DocumentProcessingTask.PARSE);
        expect(result.data?.structure).toBeDefined();
      });
    });

    describe('EXTRACT_TEXT Task', () => {
      it('should extract text from document', async () => {
        const result = await processor.processDocument(
          validDoc,
          DocumentProcessingTask.EXTRACT_TEXT
        );

        expect(result.success).toBe(true);
        expect(result.task).toBe(DocumentProcessingTask.EXTRACT_TEXT);
        expect(result.data?.content).toBeDefined();
        if (result.data?.content) {
          expect(typeof result.data.content).toBe('string');
          expect(result.data.content.length).toBeGreaterThan(0);
        }
      });
    });

    describe('SUMMARIZE Task', () => {
      it('should generate document summary', async () => {
        const result = await processor.processDocument(
          validDoc,
          DocumentProcessingTask.SUMMARIZE
        );

        expect(result.success).toBe(true);
        expect(result.data?.summary).toBeDefined();
        expect(typeof result.data?.summary).toBe('string');
        expect(result.data!.summary!.length).toBeGreaterThan(50);
      });
    });

    describe('COMPARE Task', () => {
      it('should compare documents', async () => {
        const inputWithTarget = createTestDoc();
        (inputWithTarget.data as any) = { targetDocument: 'target-doc-id' };

        const result = await processor.processDocument(
          inputWithTarget,
          DocumentProcessingTask.COMPARE
        );

        expect(result.success).toBe(true);
        expect(result.data?.comparison).toBeDefined();

        if (result.data?.comparison) {
          expect(result.data.comparison.similarities).toBeDefined();
          expect(Array.isArray(result.data.comparison.similarities)).toBe(true);
          expect(result.data.comparison.differences).toBeDefined();
          expect(Array.isArray(result.data.comparison.differences)).toBe(true);
        }
      });
    });

    describe('CONVERT_FORMAT Task', () => {
      it('should convert document format', async () => {
        const inputWithTarget = createTestDoc();
        (inputWithTarget.data as any) = { targetFormat: 'docx' };

        const result = await processor.processDocument(
          inputWithTarget,
          DocumentProcessingTask.CONVERT_FORMAT
        );

        expect(result.success).toBe(true);
        expect(result.data?.content).toContain('docx');
      });
    });

    describe('EXTRACT_TABLES Task', () => {
      it('should extract tables from document', async () => {
        const result = await processor.processDocument(
          validDoc,
          DocumentProcessingTask.EXTRACT_TABLES
        );

        expect(result.success).toBe(true);
        expect(result.data?.extractedTables).toBeDefined();
        expect(Array.isArray(result.data?.extractedTables)).toBe(true);

        if (result.data?.extractedTables && result.data.extractedTables.length > 0) {
          const table = result.data.extractedTables[0];
          expect(table.headers).toBeDefined();
          expect(table.rows).toBeDefined();
        }
      });
    });
  });
});
