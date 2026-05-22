import Zod from "zod";

export const SentimentSchema = Zod.object({
  text: Zod.string().min(1, "文本不能为空"),
  language: Zod.string().default("zh"),
});

export type SentimentInput = Zod.infer<typeof SentimentSchema>;

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  keywords: string[];
}

export class SentimentService {
  private static instance: SentimentService | null = null;

  private constructor() {}

  public static getInstance(): SentimentService {
    if (!SentimentService.instance) {
      SentimentService.instance = new SentimentService();
    }
    return SentimentService.instance;
  }

  async analyzeSentiment(input: SentimentInput): Promise<SentimentResult> {
    try {
      const validated = SentimentSchema.parse(input);

      // 模拟情感分析结果
      return this.mockAnalyze(validated.text);
    } catch (error) {
      throw new Error(`情感分析失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  private mockAnalyze(text: string): SentimentResult {
    const positiveWords = ["好", "满意", "喜欢", "棒", "优秀", "完美", "高兴"];
    const negativeWords = ["差", "不满意", "讨厌", "糟糕", "失望", "愤怒"];

    let score = 0;
    const words = text.split("");

    words.forEach((word) => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(words.length, 1)));

    let sentiment: "positive" | "negative" | "neutral";
    if (normalizedScore > 0.2) {
      sentiment = "positive";
    } else if (normalizedScore < -0.2) {
      sentiment = "negative";
    } else {
      sentiment = "neutral";
    }

    return {
      sentiment,
      confidence: Math.abs(normalizedScore),
      emotions: {
        joy: sentiment === "positive" ? 0.8 : 0.2,
        sadness: sentiment === "negative" ? 0.7 : 0.1,
        anger: sentiment === "negative" ? 0.6 : 0.1,
        fear: 0.2,
        surprise: 0.3,
        disgust: sentiment === "negative" ? 0.5 : 0.1,
      },
      keywords: words.filter((w) => positiveWords.includes(w) || negativeWords.includes(w)),
    };
  }

  async batchAnalyze(texts: string[]): Promise<SentimentResult[]> {
    return Promise.all(texts.map((text) => this.analyzeSentiment({ text, language: 'zh' })));
  }
}

export default SentimentService.getInstance();
