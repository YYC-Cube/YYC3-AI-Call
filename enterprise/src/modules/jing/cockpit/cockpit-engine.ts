import {
  CockpitMetric,
  CockpitConfig,
  NLQueryRequest,
  NLQueryResponse,
  AnomalyAlert,
  ObjectiveTrackingReport,
  QueryOptions,
  PaginatedResponse,
  TimeRange,
  MetricCategory,
  ChangeDirection,
  AlertSeverity,
  InsightType,
  RecommendationType
} from './types';

export class IntelligentBusinessCockpit {
  private config: CockpitConfig;
  private metricsCache: Map<string, CockpitMetric[]>;
  private queryHistory: Map<string, NLQueryResponse[]>;

  constructor(config: CockpitConfig) {
    this.config = config;
    this.metricsCache = new Map();
    this.queryHistory = new Map();
  }

  async getMetrics(options?: QueryOptions): Promise<PaginatedResponse<CockpitMetric>> {
    const metrics = await this.fetchMetricsFromSources(options);
    
    const processedMetrics = metrics.map(metric => this.enrichMetric(metric));
    
    return {
      data: processedMetrics.slice(0, options?.pagination?.pageSize || 20),
      pagination: {
        page: options?.pagination?.page || 1,
        pageSize: options?.pagination?.pageSize || 20,
        totalItems: metrics.length,
        totalPages: Math.ceil(metrics.length / (options?.pagination?.pageSize || 20)),
        hasNextPage: metrics.length > (options?.pagination?.pageSize || 20),
        hasPrevPage: (options?.pagination?.page || 1) > 1
      }
    };
  }

  async getMetricById(metricId: string): Promise<CockpitMetric | null> {
    const allMetrics = await this.fetchMetricsFromSources();
    const metric = allMetrics.find(m => m.id === metricId);
    return metric ? this.enrichMetric(metric) : null;
  }

  async queryByNaturalLanguage(request: NLQueryRequest): Promise<NLQueryResponse> {
    const startTime = Date.now();
    
    try {
      const parsedQuery = await this.parseNLQuery(request.question);
      const relevantData = await this.retrieveRelevantData(parsedQuery);
      const analysis = await this.analyzeData(relevantData, request.context);
      const visualization = await this.generateVisualization(analysis);
      const insights = await this.generateInsights(analysis);
      const recommendations = await this.generateRecommendations(insights);
      const relatedQueries = await this.generateRelatedQueries(request.question);
      
      const response: NLQueryResponse = {
        answer: {
          type: analysis.answerType,
          content: analysis.answer,
          data: analysis.data,
          summary: analysis.summary,
          isComplete: true,
          requiresClarification: false
        },
        insights,
        recommendations,
        relatedQueries,
        visualization,
        confidence: analysis.confidence,
        processingTime: Date.now() - startTime,
        sources: analysis.sources,
        followUpSuggestions: this.generateFollowUpSuggestions(analysis)
      };

      this.cacheQueryResponse(request, response);
      
      return response;
    } catch (error) {
      console.error('NL Query processing error:', error);
      return this.generateErrorResponse(error, startTime);
    }
  }

  async detectAnomalies(timeRange?: TimeRange): Promise<AnomalyAlert[]> {
    const metrics = await this.fetchMetricsFromSources({ 
      filter: { timeRange: timeRange || this.config.defaultTimeRange } 
    });
    
    const anomalies: AnomalyAlert[] = [];
    
    for (const metric of metrics) {
      const anomalyDetection = await this.detectAnomalyForMetric(metric);
      if (anomalyDetection) {
        anomalies.push(anomalyDetection);
      }
    }

    return this.prioritizeAnomalies(anomalies);
  }

  async generateObjectiveTrackingReport(timeRange: TimeRange): Promise<ObjectiveTrackingReport> {
    const objectives = await this.fetchObjectives(timeRange);
    const progressData = await this.calculateProgress(objectives);
    const alignmentAnalysis = await this.performAlignmentAnalysis(progressData);
    const riskAssessment = await this.assessRisks(progressData);
    const recommendations = await this.generateObjectiveRecommendations(riskAssessment);

    return {
      period: timeRange,
      objectives: progressData,
      summary: this.calculateSummary(progressData),
      alignmentAnalysis,
      riskAssessment,
      recommendations,
      generatedAt: new Date()
    };
  }

  async generateExecutiveSummary(): Promise<{
    kpis: CockpitMetric[];
    alerts: AnomalyAlert[];
    trends: TrendInsight[];
    actionItems: ActionItemSummary[];
  }> {
    const [kpis, alerts] = await Promise.all([
      this.getTopKPIs(),
      this.getActiveAlerts()
    ]);

    const trends = await this.analyzeTrends(kpis);
    const actionItems = await this.generateActionItems(kpis, alerts);

    return {
      kpis: kpis.slice(0, 10),
      alerts: alerts.slice(0, 5),
      trends,
      actionItems
    };
  }

  async exportData(
    format: 'csv' | 'excel' | 'pdf',
    options?: QueryOptions
  ): Promise<Buffer> {
    const data = await this.getMetrics(options);
    
    switch (format) {
      case 'csv':
        return this.generateCSV(data.data);
      case 'excel':
        return this.generateExcel(data.data);
      case 'pdf':
        return this.generatePDF(data.data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  updateConfig(updates: Partial<CockpitConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): CockpitConfig {
    return { ...this.config };
  }

  private async fetchMetricsFromSources(options?: QueryOptions): Promise<CockpitMetric[]> {
    const cacheKey = JSON.stringify(options);
    
    if (this.metricsCache.has(cacheKey)) {
      return this.metricsCache.get(cacheKey)!;
    }

    const metrics: CockpitMetric[] = [];
    
    for (const source of this.getEnabledDataSources()) {
      try {
        const sourceMetrics = await this.queryDataSource(source, options);
        metrics.push(...sourceMetrics);
      } catch (error) {
        console.error(`Error fetching from source ${source}:`, error);
      }
    }

    this.metricsCache.set(cacheKey, metrics);
    
    setTimeout(() => this.metricsCache.delete(cacheKey), this.config.refreshInterval * 1000);
    
    return metrics;
  }

  private enrichMetric(metric: CockpitMetric): CockpitMetric {
    const changePercentage = this.calculateChangePercentage(
      metric.value,
      metric.previousValue
    );

    return {
      ...metric,
      changePercentage,
      changeDirection: this.determineChangeDirection(changePercentage),
      achievementRate: metric.target > 0 ? (metric.value / metric.target) * 100 : 0,
      confidence: this.calculateConfidence(metric),
      lastUpdated: new Date()
    };
  }

  private calculateChangePercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  private determineChangeDirection(changePercentage: number): ChangeDirection {
    const threshold = 0.01;
    if (Math.abs(changePercentage) < threshold) return ChangeDirection.STABLE;
    return changePercentage > 0 ? ChangeDirection.UP : ChangeDirection.DOWN;
  }

  private calculateConfidence(metric: CockpitMetric): number {
    let baseConfidence = 0.9;
    
    const dataAge = Date.now() - metric.lastUpdated.getTime();
    const maxAge = 24 * 60 * 60 * 1000;
    if (dataAge > maxAge) {
      baseConfidence -= 0.3;
    } else if (dataAge > maxAge / 2) {
      baseConfidence -= 0.1;
    }

    const dataSourceReliability = this.getDataSourceReliability(metric.dataSource);
    baseConfidence *= dataSourceReliability;

    return Math.max(0, Math.min(1, baseConfidence));
  }

  private async parseNLQuery(question: string): Promise<ParsedQuery> {
    return {
      intent: this.extractIntent(question),
      entities: this.extractEntities(question),
      timeRange: this.extractTimeRange(question),
      metrics: this.extractMentions(question),
      filters: this.extractFilters(question)
    };
  }

  private extractIntent(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('为什么') || lowerQuestion.includes('why')) {
      return 'causal_analysis';
    } else if (lowerQuestion.includes('多少') || lowerQuestion.includes('what')) {
      return 'value_retrieval';
    } else if (lowerQuestion.includes('趋势') || lowerQuestion.includes('trend')) {
      return 'trend_analysis';
    } else if (lowerQuestion.includes('预测') || lowerQuestion.includes('forecast')) {
      return 'prediction';
    } else if (lowerQuestion.includes('比较') || lowerQuestion.includes('compare')) {
      return 'comparison';
    } else if (lowerQuestion.includes('如何') || lowerQuestion.includes('how')) {
      return 'prescriptive';
    } else {
      return 'general_query';
    }
  }

  private extractEntities(question: string): string[] {
    const entities: string[] = [];
    const knownEntities = ['营收', '利润', '客户', '成本', '效率', '增长', '销售', '市场'];
    
    for (const entity of knownEntities) {
      if (question.includes(entity)) {
        entities.push(entity);
      }
    }
    
    return entities;
  }

  private extractTimeRange(question: string): TimeRange | undefined {
    const timePatterns: Record<string, TimeRange> = {
      '今天': TimeRange.TODAY,
      '昨天': TimeRange.YESTERDAY,
      '本周': TimeRange.LAST_7_DAYS,
      '本月': TimeRange.THIS_MONTH,
      '上月': TimeRange.LAST_MONTH,
      '本季度': TimeRange.THIS_QUARTER,
      '本年': TimeRange.THIS_YEAR,
      '去年': TimeRange.LAST_YEAR
    };

    for (const [pattern, range] of Object.entries(timePatterns)) {
      if (question.includes(pattern)) {
        return range;
      }
    }

    return undefined;
  }

  private extractMentions(question: string): string[] {
    return this.extractEntities(question);
  }

  private extractFilters(question: string): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    
    const departmentMatch = question.match(/(\w+部)/g);
    if (departmentMatch) {
      filters.department = departmentMatch[0];
    }

    return filters;
  }

  private async retrieveRelevantData(query: ParsedQuery): Promise<RelevantData> {
    const options: QueryOptions = {
      filter: {
        timeRange: query.timeRange,
        ...query.filters
      },
      search: query.metrics.join(' ')
    };

    const metrics = await this.getMetrics(options);
    
    return {
      metrics: metrics.data,
      queryContext: query,
      timestamp: new Date()
    };
  }

  private async analyzeData(data: RelevantData, context?: QueryContext): Promise<AnalysisResult> {
    const answerType = this.determineAnswerType(data.queryContext.intent);
    const answer = this.generateAnswer(data);
    const summary = this.generateSummary(data);
    const confidence = this.calculateAnalysisConfidence(data);
    const sources = this.identifyDataSources(data.metrics);

    return {
      answerType,
      answer,
      data: this.extractDataPoints(data),
      summary,
      confidence,
      sources
    };
  }

  private determineAnswerType(intent: string): any {
    const typeMap: Record<string, any> = {
      'value_retrieval': 'NUMERIC',
      'trend_analysis': 'TREND_BASED',
      'causal_analysis': 'CAUSAL',
      'comparison': 'COMPARATIVE',
      'prediction': 'PREDICTIVE',
      'prescriptive': 'ACTIONABLE',
      'general_query': 'TEXTUAL'
    };

    return typeMap[intent] || 'TEXTUAL';
  }

  private generateAnswer(data: RelevantData): string {
    if (data.metrics.length === 0) {
      return '抱歉，未找到相关数据。请尝试调整查询条件。';
    }

    const topMetric = data.metrics[0];
    
    return `根据最新数据，${topMetric.name}为${this.formatNumber(topMetric.value)}${topMetric.unit}，` +
           `较上期${topMetric.changeDirection === ChangeDirection.UP ? '增长' : '下降'}了` +
           `${Math.abs(topMetric.changePercentage).toFixed(1)}%，` +
           `目标达成率为${topMetric.achievementRate.toFixed(1)}%。`;
  }

  private generateSummary(data: RelevantData): string {
    const totalMetrics = data.metrics.length;
    const positiveCount = data.metrics.filter(m => 
      m.changeDirection === ChangeDirection.UP && m.category !== MetricCategory.COST
    ).length;
    const negativeCount = data.metrics.filter(m => 
      m.changeDirection === ChangeDirection.DOWN && m.category !== MetricCategory.COST
    ).length;

    return `分析了${totalMetrics}项指标，其中${positiveCount}项表现良好，${negativeCount}项需关注。`;
  }

  private extractDataPoints(data: RelevantData): any[] {
    return data.metrics.map(metric => ({
      label: metric.name,
      value: metric.value,
      metadata: {
        change: metric.changePercentage,
        target: metric.target,
        achievement: metric.achievementRate
      }
    }));
  }

  private calculateAnalysisConfidence(data: RelevantData): number {
    if (data.metrics.length === 0) return 0;
    
    const avgConfidence = data.metrics.reduce((sum, m) => sum + m.confidence, 0) / data.metrics.length;
    const dataCompleteness = Math.min(1, data.metrics.length / 10);
    
    return (avgConfidence * 0.7 + dataCompleteness * 0.3);
  }

  private identifyDataSources(metrics: CockpitMetric[]): any[] {
    const sourceMap = new Map<string, number>();
    
    for (const metric of metrics) {
      const count = sourceMap.get(metric.dataSource) || 0;
      sourceMap.set(metric.dataSource, count + 1);
    }

    return Array.from(sourceMap.entries()).map(([name, count]) => ({
      id: name,
      name,
      type: 'internal',
      lastSynced: new Date(),
      reliability: count / metrics.length
    }));
  }

  private async generateVisualization(analysis: AnalysisResult): Promise<any> {
    return {
      type: analysis.data.length > 5 ? 'BAR_CHART' : 'KPI_CARD',
      config: {
        title: '数据分析结果',
        responsive: true
      },
      data: {
        series: [{
          name: '指标数据',
          data: analysis.data
        }]
      },
      interactive: true,
      exportFormats: ['PNG', 'CSV', 'PDF']
    };
  }

  private async generateInsights(analysis: AnalysisResult): Promise<any[]> {
    const insights: any[] = [];

    for (const metric of analysis.data.slice(0, 3)) {
      if (Math.abs(metric.metadata?.change || 0) > 10) {
        insights.push({
          id: `insight_${metric.label}`,
          type: metric.metadata?.change > 0 ? 'OPPORTUNITY' : 'RISK',
          title: `${metric.label}${metric.metadata?.change > 0 ? '显著增长' : '明显下降'}`,
          description: `${metric.label}变化幅度达到${Math.abs(metric.metadata?.change || 0).toFixed(1)}%`,
          significance: Math.min(1, Math.abs(metric.metadata?.change || 0) / 50),
          confidence: 0.85,
          metrics: [metric.label],
          timeframe: TimeRange.LAST_30_DAYS,
          category: this.mapToInsightCategory(metric.label),
          actionItems: [
            {
              id: `action_${metric.label}`,
              title: `关注${metric.label}变化`,
              description: `建议深入分析${metric.label}${metric.metadata?.change > 0 ? '增长原因' : '下降原因'}`,
              priority: Math.abs(metric.metadata?.change || 0) > 20 ? 'P0' : 'P1',
              status: 'SUGGESTED',
              effort: 'MEDIUM'
            }
          ]
        });
      }
    }

    return insights;
  }

  private mapToInsightCategory(metricName: string): string {
    if (['营收', '收入', '销售额'].some(k => metricName.includes(k))) return 'REVENUE';
    if (['成本', '费用'].some(k => metricName.includes(k))) return 'COST';
    if (['客户', '用户'].some(k => metricName.includes(k))) return 'CUSTOMER';
    if (['效率', '产能'].some(k => metricName.includes(k))) return 'EFFICIENCY';
    return 'OPERATIONAL';
  }

  private async generateRecommendations(insights: any[]): Promise<any[]> {
    const recommendations: any[] = [];

    for (const insight of insights.slice(0, 2)) {
      recommendations.push({
        id: `rec_${insight.id}`,
        type: insight.type === 'OPPORTUNITY' ? 'REVENUE_INCREASE' : 'RISK_MITIGATION',
        title: `针对${insight.title}的建议`,
        description: `基于${insight.description}，建议采取相应措施`,
        rationale: `数据驱动的智能推荐`,
        expectedOutcome: {
          metric: insight.metrics[0],
          currentValue: 0,
          projectedValue: insight.type === 'OPPORTUNITY' ? 10 : -5,
          improvementPercentage: 10,
          timeline: '30天',
          assumptions: ['基于历史数据模式']
        },
        implementationSteps: [
          {
            stepNumber: 1,
            title: '数据验证',
            description: '确认数据的准确性和完整性',
            duration: { min: 1, max: 2, unit: 'DAYS', confidence: 0.9 }
          },
          {
            stepNumber: 2,
            title: '根因分析',
            description: '深入分析变化的根本原因',
            duration: { min: 3, max: 5, unit: 'DAYS', confidence: 0.8 }
          }
        ],
        priority: insight.actionItems[0]?.priority || 'P1',
        confidence: 0.75,
        validityPeriod: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          reason: '基于当前数据时效性'
        }
      });
    }

    return recommendations;
  }

  private async generateRelatedQueries(originalQuery: string): Promise<any[]> {
    const relatedPatterns = [
      { query: `${originalQuery}的详细数据`, relevance: 0.9, category: 'DRILL_DOWN' },
      { query: `${originalQuery}的趋势分析`, relevance: 0.85, category: 'TREND_ANALYSIS' },
      { query: `${originalQuery}的影响因素`, relevance: 0.8, category: 'CAUSAL_ANALYSIS' },
      { query: `${originalQuery}的预测`, relevance: 0.75, category: 'FORECASTING' }
    ];

    return relatedPatterns.map(pattern => ({
      ...pattern,
      popularity: Math.floor(Math.random() * 100)
    }));
  }

  private generateFollowUpSuggestions(analysis: AnalysisResult): any[] {
    return [
      {
        question: '这个指标的详细构成是什么？',
        rationale: '了解指标组成部分有助于深入理解',
        expectedValue: '详细的分解数据',
        category: 'DRILL_DOWN'
      },
      {
        question: '与去年同期相比如何？',
        rationale: '同比分析可以消除季节性影响',
        expectedValue: '年度对比数据',
        category: 'COMPARISON'
      },
      {
        question: '未来30天的预测趋势？',
        rationale: '预测可以帮助提前规划',
        expectedValue: '预测图表和置信区间',
        category: 'FORECASTING'
      }
    ];
  }

  private async detectAnomalyForMetric(metric: CockpitMetric): Promise<AnomalyAlert | null> {
    const threshold = this.config.alertThresholds.find(t => t.metricId === metric.id);
    if (!threshold) return null;

    const deviation = Math.abs(metric.changePercentage);
    
    if (deviation < threshold.warningThreshold) return null;

    const severity = deviation >= threshold.criticalThreshold 
      ? AlertSeverity.CRITICAL 
      : AlertSeverity.WARNING;

    return {
      id: `anomaly_${metric.id}_${Date.now()}`,
      metricId: metric.id,
      metricName: metric.name,
      anomalyType: this.classifyAnomalyType(metric),
      severity,
      detectedAt: new Date(),
      value: metric.value,
      expectedValue: metric.previousValue * (1 + threshold.warningThreshold / 100),
      deviation: metric.value - metric.previousValue,
      deviationPercentage: metric.changePercentage,
      description: `${metric.name}${severity === AlertSeverity.CRITICAL ? '严重异常' : '异常波动'}：` +
                 `变化幅度${metric.changePercentage.toFixed(1)}%`,
      possibleCauses: this.generatePossibleCauses(metric, deviation),
      recommendedActions: this.generateAnomalyActions(metric, severity),
      trendContext: this.buildTrendContext(metric),
      historicalSimilarity: [],
      isAcknowledged: false
    };
  }

  private classifyAnomalyType(metric: CockpitMetric): string {
    const absChange = Math.abs(metric.changePercentage);
    
    if (absChange > 50) return 'SPIKE';
    if (absChange > 20) return 'DROP';
    return 'OUTLIER';
  }

  private generatePossibleCauses(metric: CockpitMetric, deviation: number): any[] {
    return [
      {
        description: '季节性因素影响',
        probability: 0.6,
        evidence: ['历史同期类似波动'],
        relatedMetrics: [metric.id]
      },
      {
        description: '特殊事件或促销活动',
        probability: 0.3,
        evidence: ['需要进一步确认'],
        relatedMetrics: []
      }
    ];
  }

  private generateAnomalyActions(metric: CockpitMetric, severity: AlertSeverity): any[] {
    return [
      {
        id: `action_anomaly_${metric.id}`,
        title: `${severity === AlertSeverity.CRITICAL ? '立即' : '及时'}处理${metric.name}异常`,
        description: `调查并解决${metric.name}的异常波动`,
        priority: severity === AlertSeverity.CRITICAL ? 'P0' : 'P1',
        status: 'SUGGESTED',
        effort: 'MEDIUM'
      }
    ];
  }

  private buildTrendContext(metric: CockpitMetric): any {
    return {
      periodBefore: {
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        average: metric.previousValue,
        variance: Math.abs(metric.previousValue * 0.1),
        dataPoints: 7
      },
      periodAfter: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        average: metric.value,
        variance: Math.abs(metric.value * 0.15),
        dataPoints: 7
      },
      overallTrend: metric.changeDirection,
      acceleration: metric.changePercentage > 0 ? 1 : -1
    };
  }

  private prioritizeAnomalies(anomalies: AnomalyAlert[]): AnomalyAlert[] {
    return anomalies.sort((a, b) => {
      const severityOrder = { [AlertSeverity.CRITICAL]: 3, [AlertSeverity.WARNING]: 2, [AlertSeverity.INFO]: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private async fetchObjectives(timeRange: TimeRange): Promise<any[]> {
    return [];
  }

  private async calculateProgress(objectives: any[]): Promise<any[]> {
    return objectives;
  }

  private async performAlignmentAnalysis(progress: any[]): Promise<any> {
    return {
      companyAlignment: { score: 85, maxScore: 100, percentage: 85, grade: 'B', trend: ChangeDirection.UP },
      departmentAlignment: [],
      crossFunctionalAlignment: [],
      gaps: [],
      recommendations: []
    };
  }

  private async assessRisks(progress: any[]): Promise<any[]> {
    return [];
  }

  private async generateObjectiveRecommendations(risks: any[]): Promise<any[]> {
    return [];
  }

  private calculateSummary(progress: any[]): any {
    return {
      totalObjectives: progress.length,
      onTrackCount: Math.floor(progress.length * 0.6),
      atRiskCount: Math.floor(progress.length * 0.25),
      offTrackCount: Math.floor(progress.length * 0.1),
      achievedCount: Math.floor(progress.length * 0.05),
      notStartedCount: 0,
      averageProgress: 72,
      healthScore: 78,
      trend: 'STABLE' as any
    };
  }

  private async getTopKPIs(): Promise<CockpitMetric[]> {
    const metrics = await this.fetchMetricsFromSources();
    return metrics
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15);
  }

  private async getActiveAlerts(): Promise<AnomalyAlert[]> {
    return this.detectAnomalies(this.config.defaultTimeRange);
  }

  private async analyzeTrends(metrics: CockpitMetric[]): Promise<TrendInsight[]> {
    return metrics.slice(0, 5).map(metric => ({
      metricId: metric.id,
      metricName: metric.name,
      direction: metric.changeDirection,
      strength: Math.abs(metric.changePercentage),
      acceleration: this.calculateAcceleration(metric.trend),
      forecast: this.simpleForecast(metric),
      confidence: metric.confidence
    }));
  }

  private calculateAcceleration(trend: any[]): number {
    if (trend.length < 3) return 0;
    const recent = trend.slice(-3);
    const changes = recent.slice(1).map((point, i) => point.value - recent[i].value);
    return changes[changes.length - 1] - changes[0];
  }

  private simpleForecast(metric: CockpitMetric): any {
    return {
      nextPeriodValue: metric.value * (1 + metric.changePercentage / 100),
      confidence: metric.confidence * 0.8,
      methodology: 'linear_extrapolation'
    };
  }

  private async generateActionItems(metrics: CockpitMetric[], alerts: AnomalyAlert[]): Promise<ActionItemSummary[]> {
    const items: ActionItemSummary[] = [];

    for (const alert of alerts.slice(0, 3)) {
      items.push({
        id: alert.id,
        title: alert.recommendedActions[0]?.title || '处理异常',
        priority: alert.recommendedActions[0]?.priority || 'P1',
        category: 'ANOMALY_RESPONSE',
        dueDate: new Date(Date.now() + (alert.severity === AlertSeverity.CRITICAL ? 1 : 3) * 24 * 60 * 60 * 1000),
        impact: 'HIGH'
      });
    }

    for (const metric of metrics.filter(m => m.achievementRate < 80).slice(0, 2)) {
      items.push({
        id: `action_improve_${metric.id}`,
        title: `提升${metric.name}达成率`,
        priority: metric.achievementRate < 50 ? 'P0' : 'P1',
        category: 'PERFORMANCE_IMPROVEMENT',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        impact: 'MEDIUM'
      });
    }

    return items;
  }

  private getEnabledDataSources(): string[] {
    return ['erp', 'crm', 'hrms', 'finance', 'analytics'];
  }

  private async queryDataSource(source: string, options?: QueryOptions): Promise<CockpitMetric[]> {
    const mockMetrics: CockpitMetric[] = [
      {
        id: `${source}_revenue`,
        name: '营业收入',
        description: '企业主营业务收入',
        category: MetricCategory.REVENUE,
        unit: '万元',
        value: Math.random() * 1000 + 500,
        previousValue: Math.random() * 900 + 400,
        target: 1500,
        trend: [],
        dataSource: source,
        lastUpdated: new Date(),
        confidence: 0.9
      },
      {
        id: `${source}_profit`,
        name: '净利润',
        description: '扣除所有成本后的利润',
        category: MetricCategory.PROFIT,
        unit: '万元',
        value: Math.random() * 200 + 100,
        previousValue: Math.random() * 180 + 80,
        target: 300,
        trend: [],
        dataSource: source,
        lastUpdated: new Date(),
        confidence: 0.88
      },
      {
        id: `${source}_customers`,
        name: '客户数量',
        description: '活跃客户总数',
        category: MetricCategory.CUSTOMER,
        unit: '个',
        value: Math.floor(Math.random() * 5000 + 1000),
        previousValue: Math.floor(Math.random() * 4500 + 900),
        target: 6000,
        trend: [],
        dataSource: source,
        lastUpdated: new Date(),
        confidence: 0.92
      }
    ];

    return mockMetrics;
  }

  private getDataSourceReliability(source: string): number {
    const reliabilityMap: Record<string, number> = {
      'erp': 0.95,
      'crm': 0.92,
      'hrms': 0.90,
      'finance': 0.98,
      'analytics': 0.88
    };

    return reliabilityMap[source] || 0.85;
  }

  private cacheQueryResponse(request: NLQueryRequest, response: NLQueryResponse): void {
    const history = this.queryHistory.get(request.userId) || [];
    history.unshift(response);
    
    if (history.length > 50) {
      history.pop();
    }
    
    this.queryHistory.set(request.userId, history);
  }

  private generateErrorResponse(error: any, startTime: number): NLQueryResponse {
    return {
      answer: {
        type: 'TEXTUAL',
        content: '抱歉，处理您的查询时遇到了问题。请稍后重试或联系技术支持。',
        summary: '查询处理失败',
        isComplete: false,
        requiresClarification: false
      },
      insights: [],
      recommendations: [],
      relatedQueries: [],
      visualization: {
        type: 'KPI_CARD',
        config: { title: '错误', responsive: true },
        data: { series: [] },
        interactive: false,
        exportFormats: []
      },
      confidence: 0,
      processingTime: Date.now() - startTime,
      sources: [],
      followUpSuggestions: []
    };
  }

  private formatNumber(value: number): string {
    if (value >= 10000) {
      return (value / 10000).toFixed(2) + '万';
    }
    return value.toFixed(2);
  }

  private generateCSV(metrics: CockpitMetric[]): Buffer {
    const headers = ['指标名称', '类别', '单位', '当前值', '上期值', '变化率%', '目标值', '达成率%', '更新时间'];
    const rows = metrics.map(m => [
      m.name,
      m.category,
      m.unit,
      m.value.toFixed(2),
      m.previousValue.toFixed(2),
      m.changePercentage.toFixed(2),
      m.target.toFixed(2),
      m.achievementRate.toFixed(2),
      m.lastUpdated.toISOString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  private generateExcel(metrics: CockpitMetric[]): Buffer {
    return this.generateCSV(metrics);
  }

  private generatePDF(metrics: CockpitMetric[]): Buffer {
    const content = metrics.map(m => 
      `${m.name}: ${m.value}${m.unit} (${m.changePercentage > 0 ? '+' : ''}${m.changePercentage.toFixed(1)}%)`
    ).join('\n');

    return Buffer.from(content, 'utf-8');
  }
}

interface ParsedQuery {
  intent: string;
  entities: string[];
  timeRange?: TimeRange;
  metrics: string[];
  filters: Record<string, unknown>;
}

interface RelevantData {
  metrics: CockpitMetric[];
  queryContext: ParsedQuery;
  timestamp: Date;
}

interface AnalysisResult {
  answerType: string;
  answer: string;
  data: any[];
  summary: string;
  confidence: number;
  sources: any[];
}

interface TrendInsight {
  metricId: string;
  metricName: string;
  direction: ChangeDirection;
  strength: number;
  acceleration: number;
  forecast: any;
  confidence: number;
}

interface ActionItemSummary {
  id: string;
  title: string;
  priority: string;
  category: string;
  dueDate: Date;
  impact: string;
}
