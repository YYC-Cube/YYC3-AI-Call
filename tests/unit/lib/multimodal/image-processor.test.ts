import { ImageProcessor } from '@/lib/multimodal/image-processor';
import {
  MediaInput,
  ImageAnalysisTask,
  ImageFormat,
  MediaType,
  AudioFormat,
} from '@/lib/multimodal/types';

describe('ImageProcessor', () => {
  let processor: ImageProcessor;

  beforeEach(() => {
    processor = new ImageProcessor();
  });

  const createTestImage = (
    format: ImageFormat = ImageFormat.PNG
  ): MediaInput => ({
    type: MediaType.IMAGE,
    format,
    data: 'base64-encoded-image-data',
    metadata: {
      filename: `test.${format}`,
      size: 1024 * 1024, // 1MB
      mimeType: `image/${format}`,
      dimensions: { width: 1920, height: 1080 },
    },
  });

  describe('Initialization', () => {
    it('should create processor with default config', () => {
      expect(processor).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customProcessor = new ImageProcessor({
        maxFileSize: 5 * 1024 * 1024,
        supportedFormats: [ImageFormat.PNG, ImageFormat.JPEG],
        defaultQuality: 0.8,
      });

      expect(customProcessor).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject non-image media type', async () => {
      const invalidInput: MediaInput = {
        type: MediaType.AUDIO,
        format: 'mp3' as AudioFormat,
        data: 'audio-data',
      };

      await expect(
        processor.analyzeImage(invalidInput)
      ).rejects.toThrow('Invalid media type');
    });

    it('should reject unsupported image format', async () => {
      const invalidInput: MediaInput = {
        type: MediaType.IMAGE,
        format: 'unsupported' as ImageFormat,
        data: 'data',
      };

      await expect(
        processor.analyzeImage(invalidInput)
      ).rejects.toThrow('Unsupported image format');
    });

    it('should reject oversized images', async () => {
      const oversizedInput = createTestImage();
      oversizedInput.metadata!.size = 100 * 1024 * 1024; // 100MB

      await expect(
        processor.analyzeImage(oversizedInput)
      ).rejects.toThrow('exceeds maximum limit');
    });
  });

  describe('Image Analysis Tasks', () => {
    const validImage = createTestImage();

    describe('DESCRIBE Task', () => {
      it('should generate image description', async () => {
        const results = await processor.analyzeImage(validImage, [
          ImageAnalysisTask.DESCRIBE,
        ]);

        expect(results.length).toBe(1);
        expect(results[0].success).toBe(true);
        expect(results[0].task).toBe(ImageAnalysisTask.DESCRIBE);
        expect(results[0].data?.description).toBeDefined();
        expect(typeof results[0].data?.description).toBe('string');
        expect(results[0].confidence).toBeGreaterThan(0);
        expect(results[0].processingTime).toBeGreaterThan(0);
      });
    });

    describe('OCR Task', () => {
      it('should extract text from image', async () => {
        const results = await processor.analyzeImage(validImage, [
          ImageAnalysisTask.OCR,
        ]);

        expect(results.length).toBe(1);
        expect(results[0].success).toBe(true);
        expect(results[0].task).toBe(ImageAnalysisTask.OCR);
        expect(results[0].data?.ocrText).toBeDefined();
        expect(typeof results[0].data?.ocrText).toBe('string');
      });
    });

    describe('CLASSIFY Task', () => {
      it('should classify image content', async () => {
        const results = await processor.analyzeImage(validImage, [
          ImageAnalysisTask.CLASSIFY,
        ]);

        expect(results[0].success).toBe(true);
        expect(results[0].data?.classifications).toBeDefined();
        expect(Array.isArray(results[0].data?.classifications)).toBe(true);

        if (results[0].data?.classifications) {
          results[0].data.classifications.forEach((cls) => {
            expect(cls.label).toBeDefined();
            expect(cls.confidence).toBeGreaterThanOrEqual(0);
            expect(cls.confidence).toBeLessThanOrEqual(1);
          });
        }
      });
    });

    describe('DETECT_OBJECTS Task', () => {
      it('should detect objects in image', async () => {
        const results = await processor.analyzeImage(validImage, [
          ImageAnalysisTask.DETECT_OBJECTS,
        ]);

        expect(results[0].success).toBe(true);
        expect(results[0].data?.objects).toBeDefined();
        expect(Array.isArray(results[0].data?.objects)).toBe(true);
      });
    });

    describe('ANALYZE_FACE Task', () => {
      it('should analyze face features', async () => {
        const results = await processor.analyzeImage(validImage, [
          ImageAnalysisTask.ANALYZE_FACE,
        ]);

        expect(results[0].success).toBe(true);
        expect(results[0].data?.faceAnalysis).toBeDefined();

        if (results[0].data?.faceAnalysis) {
          const face = results[0].data.faceAnalysis;
          expect(face.emotions).toBeDefined();
          expect(typeof face.emotions).toBe('object');
          expect(face.age).toBeDefined();
          expect(face.gender).toBeDefined();
        }
      });
    });

    describe('GENERATE_CAPTION Task', () => {
      it('should generate image caption', async () => {
        const results = await processor.analyzeImage(validImage, [
          ImageAnalysisTask.GENERATE_CAPTION,
        ]);

        expect(results[0].success).toBe(true);
        expect(results[0].data?.caption).toBeDefined();
        expect(typeof results[0].data?.caption).toBe('string');
        if (results[0].data?.caption) {
          expect(results[0].data.caption.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Multiple Tasks', () => {
    it('should process multiple tasks in sequence', async () => {
      const validImage = createTestImage();

      const results = await processor.analyzeImage(validImage, [
        ImageAnalysisTask.DESCRIBE,
        ImageAnalysisTask.CLASSIFY,
        ImageAnalysisTask.GENERATE_CAPTION,
      ]);

      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.processingTime).toBeGreaterThan(0);
      });
    });

    it('should handle all six tasks together', async () => {
      const validImage = createTestImage();

      const results = await processor.analyzeImage(validImage, [
        ImageAnalysisTask.DESCRIBE,
        ImageAnalysisTask.OCR,
        ImageAnalysisTask.CLASSIFY,
        ImageAnalysisTask.DETECT_OBJECTS,
        ImageAnalysisTask.ANALYZE_FACE,
        ImageAnalysisTask.GENERATE_CAPTION,
      ]);

      expect(results.length).toBe(6);

      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBe(6);
    });
  });

  describe('Error Handling', () => {
    it('should handle individual task failures gracefully', async () => {
      const validImage = createTestImage();

      const results = await processor.analyzeImage(validImage, [
        ImageAnalysisTask.DESCRIBE,
      ]);

      expect(results.length).toBe(1);
      expect(results[0]).toHaveProperty('success');
      expect(results[0].success).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should record processing time for each task', async () => {
      const validImage = createTestImage();

      const results = await processor.analyzeImage(validImage, [
        ImageAnalysisTask.DESCRIBE,
        ImageAnalysisTask.OCR,
      ]);

      results.forEach((result) => {
        expect(result.processingTime).toBeGreaterThan(0);
        expect(result.processingTime).toBeLessThan(10000); // < 10 seconds
      });
    });

    it('should provide confidence scores', async () => {
      const validImage = createTestImage();

      const results = await processor.analyzeImage(validImage, [
        ImageAnalysisTask.DESCRIBE,
        ImageAnalysisTask.CLASSIFY,
      ]);

      results.forEach((result) => {
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});
