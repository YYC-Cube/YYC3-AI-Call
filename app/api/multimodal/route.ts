import { NextRequest, NextResponse } from 'next/server';
import {
  multimodalManager,
  ImageAnalysisTask,
  AudioProcessingTask,
  DocumentProcessingTask,
  MediaType,
} from '@/lib/multimodal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, mediaType, ...params } = body;

    switch (action) {
      case 'process-image':
        if (!params.input) {
          return NextResponse.json(
            { success: false, error: 'Image input is required' },
            { status: 400 }
          );
        }

        const imageTasks = params.tasks || [
          ImageAnalysisTask.DESCRIBE,
          ImageAnalysisTask.CLASSIFY,
        ];

        const imageResults = await multimodalManager.processImage(
          params.input,
          imageTasks
        );

        return NextResponse.json({
          success: true,
          data: imageResults,
          metrics: multimodalManager.getMetrics(),
        });

      case 'process-audio':
        if (!params.input || !params.task) {
          return NextResponse.json(
            { success: false, error: 'Audio input and task are required' },
            { status: 400 }
          );
        }

        const audioResult = await multimodalManager.processAudio(
          params.input,
          params.task
        );

        return NextResponse.json({
          success: true,
          data: audioResult,
          metrics: multimodalManager.getMetrics(),
        });

      case 'process-document':
        if (!params.input || !params.task) {
          return NextResponse.json(
            { success: false, error: 'Document input and task are required' },
            { status: 400 }
          );
        }

        const documentResult = await multimodalManager.processDocument(
          params.input,
          params.task
        );

        return NextResponse.json({
          success: true,
          data: documentResult,
          metrics: multimodalManager.getMetrics(),
        });

      case 'batch-process':
        if (!params.items || !Array.isArray(params.items)) {
          return NextResponse.json(
            { success: false, error: 'Batch items array is required' },
            { status: 400 }
          );
        }

        const batchResults = await Promise.all(
          params.items.map(async (item: any) => {
            try {
              switch (item.type) {
                case MediaType.IMAGE:
                  return await multimodalManager.processImage(item.input, item.tasks);
                case MediaType.AUDIO:
                  return await multimodalManager.processAudio(item.input, item.task);
                case MediaType.DOCUMENT:
                  return await multimodalManager.processDocument(item.input, item.task);
                default:
                  throw new Error(`Unsupported media type: ${item.type}`);
              }
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          })
        );

        return NextResponse.json({
          success: true,
          data: batchResults,
          metrics: multimodalManager.getMetrics(),
        });

      case 'get-metrics':
        const metrics = multimodalManager.getMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'reset-metrics':
        multimodalManager.resetMetrics();
        return NextResponse.json({
          success: true,
          message: 'Multimodal metrics reset successfully',
        });

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Multimodal API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const metrics = multimodalManager.getMetrics();

  return NextResponse.json({
    success: true,
    message: 'YYC3 Multimodal AI Processing System',
    version: '1.0.0',
    capabilities: {
      image: [
        'describe',
        'ocr',
        'classify',
        'detect_objects',
        'analyze_face',
        'generate_caption',
      ],
      audio: ['transcribe', 'synthesize_speech', 'extract_features', 'enhance_quality', 'convert_format'],
      document: ['parse', 'extract_text', 'summarize', 'compare', 'convert_format', 'extract_tables'],
    },
    metrics,
  });
}
