import { EventEmitter } from 'eventemitter3';
import { U as UnifiedAuthManager } from '../unified-auth-Dzz5qQ93.js';
import '../types-BrIugxRS.js';

/**
 * file types.ts
 * description @yyc3/core 类型定义
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/core 类型定义
 */
/**
 * 多模态类型
 */
type MultimodalType = 'image' | 'audio' | 'document' | 'video';
/**
 * 图像格式
 */
type ImageFormat = 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp';
/**
 * 音频格式
 */
type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a';
/**
 * 文档格式
 */
type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'md' | 'html';
/**
 * 视频格式
 */
type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv';
/**
 * 多模态输入
 */
interface MultimodalInput {
    type: MultimodalType;
    data: string | Buffer;
    format?: string;
    metadata?: Record<string, unknown>;
}
/**
 * 图像输入
 */
interface ImageInput extends MultimodalInput {
    type: 'image';
    format: ImageFormat;
    width?: number;
    height?: number;
}
/**
 * 音频输入
 */
interface AudioInput extends MultimodalInput {
    type: 'audio';
    format: AudioFormat;
    duration?: number;
    sampleRate?: number;
    channels?: number;
}
/**
 * 文档输入
 */
interface DocumentInput extends MultimodalInput {
    type: 'document';
    format: DocumentFormat;
    pageCount?: number;
    language?: string;
}
/**
 * 视频输入
 */
interface VideoInput extends MultimodalInput {
    type: 'video';
    format: VideoFormat;
    duration?: number;
    width?: number;
    height?: number;
    fps?: number;
}
/**
 * 图像分析选项
 */
interface ImageAnalysisOptions {
    tasks?: ImageAnalysisTask[];
    detail?: 'low' | 'high' | 'auto';
    maxTokens?: number;
}
/**
 * 图像分析任务
 */
type ImageAnalysisTask = 'describe' | 'ocr' | 'classify' | 'detect' | 'segment' | 'face' | 'caption';
/**
 * 图像分析结果
 */
interface ImageAnalysisResult {
    description?: string;
    text?: string;
    labels?: Array<{
        label: string;
        confidence: number;
    }>;
    objects?: Array<{
        name: string;
        bbox: [number, number, number, number];
        confidence: number;
    }>;
    faces?: Array<{
        bbox: [number, number, number, number];
        attributes?: Record<string, unknown>;
    }>;
    caption?: string;
    tokens?: {
        input: number;
        output: number;
    };
}
/**
 * 音频转录选项
 */
interface AudioTranscriptionOptions {
    language?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
    timestampGranularities?: ('word' | 'segment')[];
}
/**
 * 音频转录结果
 */
interface AudioTranscriptionResult {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
    }>;
    words?: Array<{
        word: string;
        start: number;
        end: number;
    }>;
}
/**
 * 语音合成选项
 */
interface TextToSpeechOptions {
    voice?: string;
    model?: string;
    speed?: number;
    format?: AudioFormat;
}
/**
 * 语音合成结果
 */
interface TextToSpeechResult {
    audio: Buffer;
    format: AudioFormat;
    duration: number;
}
/**
 * 文档解析选项
 */
interface DocumentParseOptions {
    extractText?: boolean;
    extractImages?: boolean;
    extractTables?: boolean;
    extractMetadata?: boolean;
    ocrLanguage?: string;
}
/**
 * 文档解析结果
 */
interface DocumentParseResult {
    text?: string;
    pages?: Array<{
        number: number;
        text: string;
        images?: Array<{
            data: Buffer;
            format: string;
        }>;
        tables?: Array<{
            data: string[][];
        }>;
    }>;
    images?: Array<{
        data: Buffer;
        format: string;
        page?: number;
    }>;
    tables?: Array<{
        data: string[][];
        page?: number;
    }>;
    metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
        pageCount?: number;
    };
}
/**
 * 多模态处理结果
 */
interface MultimodalResult {
    success: boolean;
    type: MultimodalType;
    result?: ImageAnalysisResult | AudioTranscriptionResult | DocumentParseResult | unknown;
    error?: string;
    duration: number;
}
/**
 * 多模态处理器配置
 */
interface MultimodalProcessorConfig {
    openai?: {
        apiKey?: string;
        baseUrl?: string;
    };
    ollama?: {
        baseUrl?: string;
    };
    visionModel?: string;
    audioModel?: string;
}

/**
 * file image-processor.ts
 * description 图像处理器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 图像处理器
 */

/**
 * 图像处理器
 */
declare class ImageProcessor {
    private authManager;
    private defaultModel;
    constructor(authManager: UnifiedAuthManager, model?: string);
    /**
     * 分析图像
     */
    analyze(image: ImageInput, options?: ImageAnalysisOptions): Promise<ImageAnalysisResult>;
    /**
     * 执行单个分析任务
     */
    private executeTask;
    /**
     * 构建任务提示词
     */
    private buildPrompt;
    /**
     * 解析分析结果
     */
    private parseResult;
    /**
     * 准备图像数据
     */
    private prepareImageData;
    /**
     * 提取标签
     */
    private extractLabels;
    /**
     * 提取物体
     */
    private extractObjects;
    /**
     * 批量分析图像
     */
    analyzeBatch(images: ImageInput[], options?: ImageAnalysisOptions): Promise<ImageAnalysisResult[]>;
}

/**
 * file audio-processor.ts
 * description 音频处理器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 音频处理器
 */

/**
 * 音频处理器配置
 */
interface AudioProcessorConfig {
    openaiApiKey?: string;
    openaiBaseUrl?: string;
    ollamaBaseUrl?: string;
    defaultModel?: string;
}
/**
 * 音频处理器
 */
declare class AudioProcessor {
    private config;
    constructor(config: AudioProcessorConfig);
    /**
     * 转录音频
     */
    transcribe(audio: AudioInput, options?: AudioTranscriptionOptions): Promise<AudioTranscriptionResult>;
    /**
     * 语音合成
     */
    synthesize(text: string, options?: TextToSpeechOptions): Promise<TextToSpeechResult>;
    /**
     * 估算音频时长
     */
    private estimateDuration;
}

/**
 * file document-processor.ts
 * description 文档处理器
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 文档处理器
 */

/**
 * 文档处理器
 */
declare class DocumentProcessor {
    private authManager;
    constructor(authManager: UnifiedAuthManager);
    /**
     * 解析文档
     */
    parse(document: DocumentInput, options?: DocumentParseOptions): Promise<DocumentParseResult>;
    /**
     * 提取文本
     */
    private extractText;
    /**
     * 去除 HTML 标签
     */
    private stripHtml;
    /**
     * 解析复杂文档
     */
    private parseComplexDocument;
    /**
     * 提取元数据
     */
    private extractMetadata;
    /**
     * 摘要文档
     */
    summarize(document: DocumentInput, maxLength?: number): Promise<string>;
    /**
     * 提取关键信息
     */
    extractKeyInfo(document: DocumentInput, keys: string[]): Promise<Record<string, string>>;
    /**
     * 解析关键信息
     */
    private parseKeyInfo;
    /**
     * 对比文档
     */
    compare(document1: DocumentInput, document2: DocumentInput): Promise<{
        similarities: string[];
        differences: string[];
        summary: string;
    }>;
    /**
     * 提取列表
     */
    private extractList;
}

/**
 * file manager.ts
 * description 管理器核心
 * module @yyc3/core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[multimodal]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 管理器核心
 */

/**
 * 多模态管理器事件
 */
interface MultimodalEvents {
    processing_started: {
        type: string;
        input: MultimodalInput;
    };
    processing_completed: {
        type: string;
        result: MultimodalResult;
    };
    processing_failed: {
        type: string;
        error: string;
    };
}
/**
 * 多模态管理器
 */
declare class MultimodalManager extends EventEmitter<MultimodalEvents> {
    private _authManager;
    private _config;
    private imageProcessor;
    private audioProcessor;
    private documentProcessor;
    constructor(authManager: UnifiedAuthManager, config?: MultimodalProcessorConfig);
    /**
     * 获取认证管理器
     */
    get authManager(): UnifiedAuthManager;
    /**
     * 获取配置
     */
    get config(): MultimodalProcessorConfig;
    /**
     * 处理多模态输入
     */
    process(input: MultimodalInput): Promise<MultimodalResult>;
    /**
     * 处理图像
     */
    processImage(image: ImageInput, options?: ImageAnalysisOptions): Promise<ImageAnalysisResult>;
    /**
     * 处理音频
     */
    processAudio(audio: AudioInput, options?: AudioTranscriptionOptions): Promise<AudioTranscriptionResult>;
    /**
     * 处理文档
     */
    processDocument(document: DocumentInput, options?: DocumentParseOptions): Promise<DocumentParseResult>;
    /**
     * 处理视频
     */
    private processVideo;
    /**
     * 分析图像
     */
    analyzeImage(image: ImageInput, options?: ImageAnalysisOptions): Promise<ImageAnalysisResult>;
    /**
     * 转录音频
     */
    transcribeAudio(audio: AudioInput, options?: AudioTranscriptionOptions): Promise<AudioTranscriptionResult>;
    /**
     * 语音合成
     */
    synthesizeSpeech(text: string, options?: TextToSpeechOptions): Promise<TextToSpeechResult>;
    /**
     * 解析文档
     */
    parseDocument(document: DocumentInput, options?: DocumentParseOptions): Promise<DocumentParseResult>;
    /**
     * 摘要文档
     */
    summarizeDocument(document: DocumentInput, maxLength?: number): Promise<string>;
    /**
     * 批量处理
     */
    processBatch(inputs: MultimodalInput[]): Promise<MultimodalResult[]>;
    /**
     * 获取处理器
     */
    getImageProcessor(): ImageProcessor;
    getAudioProcessor(): AudioProcessor;
    getDocumentProcessor(): DocumentProcessor;
}

export { type AudioFormat, type AudioInput, AudioProcessor, type AudioProcessorConfig, type AudioTranscriptionOptions, type AudioTranscriptionResult, type DocumentFormat, type DocumentInput, type DocumentParseOptions, type DocumentParseResult, DocumentProcessor, type ImageAnalysisOptions, type ImageAnalysisResult, type ImageAnalysisTask, type ImageFormat, type ImageInput, ImageProcessor, type MultimodalEvents, type MultimodalInput, MultimodalManager, type MultimodalProcessorConfig, type MultimodalResult, type MultimodalType, type TextToSpeechOptions, type TextToSpeechResult, type VideoFormat, type VideoInput };
