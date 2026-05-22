import {
  MediaInput,
  ImageAnalysisResult,
  AudioProcessingResult,
  DocumentProcessingResult,
  ImageAnalysisTask,
  AudioProcessingTask,
  DocumentProcessingTask,
} from './types';
import { ImageProcessor } from './image-processor';
import { AudioProcessor } from './audio-processor';
import { DocumentProcessor } from './document-processor';

export interface MultimodalMetrics {
  totalProcessed: number;
  imageCount: number;
  audioCount: number;
  documentCount: number;
  averageProcessingTime: number;
  successRate: number;
}

export class MultimodalManager {
  private imageProcessor: ImageProcessor;
  private audioProcessor: AudioProcessor;
  private documentProcessor: DocumentProcessor;
  private metrics: MultimodalMetrics;

  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.audioProcessor = new AudioProcessor();
    this.documentProcessor = new DocumentProcessor();

    this.metrics = {
      totalProcessed: 0,
      imageCount: 0,
      audioCount: 0,
      documentCount: 0,
      averageProcessingTime: 0,
      successRate: 1.0,
    };
  }

  async processImage(
    input: MediaInput,
    tasks?: ImageAnalysisTask[]
  ): Promise<ImageAnalysisResult[]> {
    const startTime = Date.now();

    try {
      const results = await this.imageProcessor.analyzeImage(input, tasks);

      const successful = results.filter((r: ImageAnalysisResult) => r.success).length;
      this.updateMetrics(
        'image',
        results.length,
        Date.now() - startTime,
        successful / results.length
      );

      return results;
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  async processAudio(
    input: MediaInput,
    task: AudioProcessingTask
  ): Promise<AudioProcessingResult> {
    const startTime = Date.now();

    try {
      const result = await this.audioProcessor.processAudio(input, task);

      this.updateMetrics(
        'audio',
        1,
        result.processingTime,
        result.success ? 1 : 0
      );

      return result;
    } catch (error) {
      console.error('Audio processing error:', error);
      throw error;
    }
  }

  async processDocument(
    input: MediaInput,
    task: DocumentProcessingTask
  ): Promise<DocumentProcessingResult> {
    const startTime = Date.now();

    try {
      const result = await this.documentProcessor.processDocument(input, task);

      this.updateMetrics(
        'document',
        1,
        result.processingTime,
        result.success ? 1 : 0
      );

      return result;
    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }

  getMetrics(): MultimodalMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalProcessed: 0,
      imageCount: 0,
      audioCount: 0,
      documentCount: 0,
      averageProcessingTime: 0,
      successRate: 1.0,
    };
  }

  private updateMetrics(
    type: 'image' | 'audio' | 'document',
    count: number,
    processingTime: number,
    successRate: number
  ): void {
    this.metrics.totalProcessed += count;

    switch (type) {
      case 'image':
        this.metrics.imageCount += count;
        break;
      case 'audio':
        this.metrics.audioCount += count;
        break;
      case 'document':
        this.metrics.documentCount += count;
        break;
    }

    const totalTime =
      this.metrics.averageProcessingTime * (this.metrics.totalProcessed - count) +
      processingTime * count;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalProcessed;

    const totalSuccess =
      this.metrics.successRate * (this.metrics.totalProcessed - count) +
      successRate * count;
    this.metrics.successRate = totalSuccess / this.metrics.totalProcessed;
  }
}

export const multimodalManager = new MultimodalManager();
