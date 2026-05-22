import {
  BusinessDimension,
  EnablementDimension,
  KPI,
  KPICategory,
  KPITrend,
  KPIStatus,
  MeasurementFrequency,
  Priority,
  Organization,
  Currency,
  ApiResponse,
  QueryOptions,
  PaginatedResponse
} from '../../core/types';

export interface CockpitMetric {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  unit: string;
  value: number;
  previousValue: number;
  changePercentage: number;
  changeDirection: ChangeDirection;
  target: number;
  achievementRate: number;
  trend: TrendData[];
  dataSource: string;
  lastUpdated: Date;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export enum MetricCategory {
  REVENUE = 'revenue',
  PROFIT = 'profit',
  GROWTH = 'growth',
  EFFICIENCY = 'efficiency',
  CUSTOMER = 'customer',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  EMPLOYEE = 'employee'
}

export enum ChangeDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable'
}

export interface TrendData {
  date: Date;
  value: number;
  predicted?: boolean;
}

export interface CockpitConfig {
  organizationId: string;
  refreshInterval: number;
  defaultTimeRange: TimeRange;
  enabledModules: CockpitModule[];
  alertThresholds: AlertThreshold[];
  dashboardLayout: DashboardLayout;
  aiFeatures: AIFeaturesConfig;
  permissions: CockpitPermissions;
}

export enum TimeRange {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom'
}

export enum CockpitModule {
  EXECUTIVE_SUMMARY = 'executive_summary',
  REVENUE_ANALYSIS = 'revenue_analysis',
  PROFITABILITY = 'profitability',
  GROWTH_METRICS = 'growth_metrics',
  CUSTOMER_INSIGHTS = 'customer_insights',
  OPERATIONAL_EFFICIENCY = 'operational_efficiency',
  WORKFORCE_ANALYTICS = 'workforce_analytics',
  CASH_FLOW = 'cash_flow',
  FORECASTING = 'forecasting',
  ALERT_CENTER = 'alert_center'
}

export interface AlertThreshold {
  metricId: string;
  warningThreshold: number;
  criticalThreshold: number;
  direction: AlertDirection;
  notificationChannels: string[];
  cooldownPeriod: number;
  isEnabled: boolean;
}

export enum AlertDirection {
  ABOVE = 'above',
  BELOW = 'below',
  DEVIATION = 'deviation'
}

export interface DashboardLayout {
  columns: number;
  widgets: WidgetPosition[];
}

export interface WidgetPosition {
  moduleId: CockpitModule;
  position: GridPosition;
  size: WidgetSize;
  isVisible: boolean;
  isCollapsed: boolean;
  order: number;
}

export interface GridPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface AIFeaturesConfig {
  nlQueryEnabled: boolean;
  predictiveAnalyticsEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  recommendationEngineEnabled: boolean;
  naturalLanguageGenerationEnabled: boolean;
  voiceInteractionEnabled: boolean;
}

export interface CockpitPermissions {
  viewMetrics: string[];
  editConfig: string[];
  exportData: string[];
  manageAlerts: string[];
  aiInteractions: string[];
}

export interface NLQueryRequest {
  question: string;
  context?: QueryContext;
  language: string;
  userId: string;
  sessionId?: string;
}

export interface QueryContext {
  timeRange?: TimeRange;
  departments?: string[];
  metrics?: string[];
  filters?: Record<string, unknown>;
  previousQuestions?: string[];
}

export interface NLQueryResponse {
  answer: NLAnswer;
  insights: Insight[];
  recommendations: Recommendation[];
  relatedQueries: RelatedQuery[];
  visualization: VisualizationSpec;
  confidence: number;
  processingTime: number;
  sources: DataSourceReference[];
  followUpSuggestions: FollowUpSuggestion[];
}

export interface NLAnswer {
  type: AnswerType;
  content: string;
  data?: DataPoint[];
  summary: string;
  isComplete: boolean;
  requiresClarification: boolean;
  clarificationQuestion?: string;
}

export enum AnswerType {
  NUMERIC = 'numeric',
  TEXTUAL = 'textual',
  COMPARATIVE = 'comparative',
  TREND_BASED = 'trend_based',
  PREDICTIVE = 'predictive',
  CAUSAL = 'causal',
  ACTIONABLE = 'actionable'
}

export interface DataPoint {
  label: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  significance: number;
  confidence: number;
  metrics: string[];
  timeframe: TimeRange;
  actionItems: ActionItem[];
  category: InsightCategory;
}

export enum InsightType {
  ANOMALY = 'anomaly',
  TREND = 'trend',
  CORRELATION = 'correlation',
  OPPORTUNITY = 'opportunity',
  RISK = 'risk',
  MILESTONE = 'milestone',
  BENCHMARK = 'benchmark',
  PREDICTION = 'prediction'
}

export enum InsightCategory {
  REVENUE = 'revenue',
  COST = 'cost',
  EFFICIENCY = 'efficiency',
  CUSTOMER = 'customer',
  OPERATIONAL = 'operational',
  STRATEGIC = 'strategic'
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee?: string;
  dueDate?: Date;
  estimatedImpact: ImpactEstimate;
  status: ActionItemStatus;
  effort: EffortLevel;
  dependencies: string[];
}

export enum ActionItemStatus {
  SUGGESTED = 'suggested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
  BLOCKED = 'blocked'
}

export interface ImpactEstimate {
  metric: string;
  expectedChange: number;
  unit: string;
  timeframe: string;
  confidence: number;
}

export enum EffortLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: ExpectedOutcome;
  implementationSteps: ImplementationStep[];
  risks: RiskAssessment[];
  resourcesRequired: ResourceRequirement[];
  priority: Priority;
  confidence: number;
  validityPeriod: ValidityPeriod;
}

export enum RecommendationType {
  COST_REDUCTION = 'cost_reduction',
  REVENUE_INCREASE = 'revenue_increase',
  EFFICIENCY_IMPROVEMENT = 'efficiency_improvement',
  RISK_MITIGATION = 'risk_mitigation',
  PROCESS_OPTIMIZATION = 'process_optimization',
  RESOURCE_REALLOCATION = 'resource_reallocation',
  STRATEGIC_INITIATIVE = 'strategic_initiative'
}

export interface ExpectedOutcome {
  metric: string;
  currentValue: number;
  projectedValue: number;
  improvementPercentage: number;
  timeline: string;
  assumptions: string[];
}

export interface ImplementationStep {
  stepNumber: number;
  title: string;
  description: string;
  owner?: string;
  duration: DurationEstimate;
  dependencies: string[];
  deliverables: string[];
}

export interface DurationEstimate {
  min: number;
  max: number;
  unit: TimeUnit;
  confidence: number;
}

export enum TimeUnit {
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months',
  QUARTERS = 'quarters'
}

export interface RiskAssessment {
  description: string;
  probability: number;
  impact: number;
  mitigationStrategy: string;
}

export interface ResourceRequirement {
  type: string;
  quantity: number;
  cost?: number;
  availability: string;
}

export interface ValidityPeriod {
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface RelatedQuery {
  query: string;
  relevanceScore: number;
  category: string;
  popularity: number;
}

export interface VisualizationSpec {
  type: VisualizationType;
  config: VisualizationConfig;
  data: VisualizationData;
  interactive: boolean;
  exportFormats: ExportFormat[];
}

export enum VisualizationType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  SCATTER_PLOT = 'scatter_plot',
  HEATMAP = 'heatmap',
  TABLE = 'table',
  KPI_CARD = 'kpi_card',
  GAUGE = 'gauge',
  FUNNEL = 'funnel',
  WATERFALL = 'waterfall',
  TREEMAP = 'treemap',
  SANKEY = 'sankey',
  GEO_MAP = 'geo_map',
  RADAR_CHART = 'radar_chart',
  COMPARISON_TABLE = 'comparison_table'
}

export interface VisualizationConfig {
  title: string;
  subtitle?: string;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  colors?: string[];
  animations?: AnimationConfig;
  responsive: boolean;
  theme?: string;
}

export interface AxisConfig {
  label: string;
  format?: string;
  min?: number;
  max?: number;
  showGrid?: boolean;
  tickCount?: number;
}

export interface LegendConfig {
  position: LegendPosition;
  show: boolean;
  itemStyle?: LegendItemStyle;
}

export enum LegendPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right'
}

export interface LegendItemStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
}

export interface TooltipConfig {
  enabled: boolean;
  format?: string;
  showMarkers?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: EasingType;
}

export enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'ease_in',
  EASE_OUT = 'ease_out',
  EASE_IN_OUT = 'ease_in_out'
}

export interface VisualizationData {
  series: DataSeries[];
  categories?: string[];
  metadata?: Record<string, unknown>;
}

export interface DataSeries {
  name: string;
  data: DataPoint[];
  color?: string;
  type?: SeriesType;
  stack?: string;
}

export enum SeriesType {
  LINE = 'line',
  BAR = 'bar',
  AREA = 'area',
  SCATTER = 'scatter',
  PIE = 'pie'
}

export enum ExportFormat {
  PNG = 'png',
  SVG = 'svg',
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

export interface DataSourceReference {
  id: string;
  name: string;
  type: string;
  lastSynced: Date;
  reliability: number;
  url?: string;
}

export interface FollowUpSuggestion {
  question: string;
  rationale: string;
  expectedValue: string;
  category: FollowUpCategory;
}

export enum FollowUpCategory {
  DRILL_DOWN = 'drill_down',
  COMPARISON = 'comparison',
  FORECASTING = 'forecasting',
  CAUSAL_ANALYSIS = 'causal_analysis',
  WHAT_IF = 'what_if',
  ACTION_PLANNING = 'action_planning'
}

export interface AnomalyAlert {
  id: string;
  metricId: string;
  metricName: string;
  anomalyType: AnomalyType;
  severity: AlertSeverity;
  detectedAt: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  deviationPercentage: number;
  description: string;
  possibleCauses: PossibleCause[];
  recommendedActions: ActionItem[];
  trendContext: TrendContext;
  historicalSimilarity: HistoricalSimilarity[];
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolution?: ResolutionInfo;
  metadata?: Record<string, unknown>;
}

export enum AnomalyType {
  SPIKE = 'spike',
  DROP = 'drop',
  TREND_CHANGE = 'trend_change',
  SEASONAL_DEVIATION = 'seasonal_deviation',
  OUTLIER = 'outlier',
  PATTERN_BREAK = 'pattern_break',
  VOLATILITY = 'volatility'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface PossibleCause {
  description: string;
  probability: number;
  evidence: string[];
  relatedMetrics: string[];
}

export interface TrendContext {
  periodBefore: TrendPeriod;
  periodAfter: TrendPeriod;
  overallTrend: ChangeDirection;
  acceleration: number;
}

export interface TrendPeriod {
  startDate: Date;
  endDate: Date;
  average: number;
  variance: number;
  dataPoints: number;
}

export interface HistoricalSimilarity {
  date: Date;
  similarity: number;
  cause: string;
  resolution: string;
  duration: number;
}

export interface ResolutionInfo {
  resolvedBy: string;
  resolvedAt: Date;
  resolutionType: ResolutionType;
  description: string;
  rootCause: string;
  preventiveAction: string;
}

export enum ResolutionType {
  TRUE_POSITIVE = 'true_positive',
  FALSE_POSITIVE = 'false_positive',
  EXPECTED_BEHAVIOR = 'expected_behavior',
  EXTERNAL_FACTOR = 'external_factor',
  DATA_ERROR = 'data_error'
}

export interface ObjectiveTrackingReport {
  period: TimeRange;
  objectives: ObjectiveProgress[];
  summary: ProgressSummary;
  alignmentAnalysis: AlignmentAnalysis;
  riskAssessment: ObjectiveRiskAssessment[];
  recommendations: ObjectiveRecommendation[];
  generatedAt: Date;
}

export interface ObjectiveProgress {
  id: string;
  title: string;
  owner: string;
  department: string;
  target: number;
  current: number;
  progress: number;
  status: ObjectiveStatus;
  trend: KPITrend;
  keyResults: KeyResultProgress[];
  milestones: MilestoneProgress[];
  blockers: Blocker[];
  supportNeeded: SupportNeed[];
  lastUpdated: Date;
  nextReviewDate: Date;
}

export interface KeyResultProgress {
  id: string;
  description: string;
  target: number;
  current: number;
  progress: number;
  status: KRStatus;
  confidence: ConfidenceLevel;
  updatedAt: Date;
  forecast?: ForecastData;
}

export interface ForecastData {
  projectedValue: number;
  probabilityOfAchievement: number;
  estimatedCompletionDate: Date;
  factors: ForecastFactor[];
  methodology: string;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface ForecastFactor {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative';
  certainty: number;
}

export interface MilestoneProgress {
  id: string;
  name: string;
  dueDate: Date;
  status: MilestoneStatus;
  completedDate?: Date;
  delayDays: number;
  deliverables: DeliverableProgress[];
}

export enum MilestoneStatus {
  UPCOMING = 'upcoming',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  AT_RISK = 'at_risk',
  CANCELLED = 'cancelled'
}

export interface DeliverableProgress {
  name: string;
  status: DeliverableStatus;
  quality: QualityRating;
  feedback?: string;
}

export enum QualityRating {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  SATISFACTORY = 'satisfactory',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  UNSATISFACTORY = 'unsatisfactory'
}

export interface Blocker {
  id: string;
  description: string;
  severity: Severity;
  reportedBy: string;
  reportedAt: Date;
  status: ObstacleStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Date;
  impact: string;
}

export interface SupportNeed {
  type: SupportType;
  description: string;
  requestedFrom: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
}

export enum SupportType {
  RESOURCE = 'resource',
  EXPERTISE = 'expertise',
  APPROVAL = 'approval',
  COLLABORATION = 'collaboration',
  BUDGET = 'budget',
  TOOLS = 'tools',
  TRAINING = 'training'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RequestStatus {
  REQUESTED = 'requested',
  IN_PROGRESS = 'in_progress',
  FULFILLED = 'fulfilled',
  DECLINED = 'declined',
  CANCELLED = 'cancelled'
}

export interface ProgressSummary {
  totalObjectives: number;
  onTrackCount: number;
  atRiskCount: number;
  offTrackCount: number;
  achievedCount: number;
  notStartedCount: number;
  averageProgress: number;
  healthScore: number;
  trend: OverallTrend;
}

export enum OverallTrend {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  VOLATILE = 'volatile'
}

export interface AlignmentAnalysis {
  companyAlignment: AlignmentScore;
  departmentAlignment: DepartmentAlignment[];
  crossFunctionalAlignment: CrossFunctionalAlignment[];
  gaps: AlignmentGap[];
  recommendations: AlignmentRecommendation[];
}

export interface AlignmentScore {
  score: number;
  maxScore: number;
  percentage: number;
  grade: Grade;
  trend: ChangeDirection;
}

export enum Grade {
  A_PLUS = 'a_plus',
  A = 'a',
  A_MINUS = 'a_minus',
  B_PLUS = 'b_plus',
  B = 'b',
  B_MINUS = 'b_minus',
  C_PLUS = 'c_plus',
  C = 'c',
  C_MINUS = 'c_minus',
  D = 'd',
  F = 'f'
}

export interface DepartmentAlignment {
  department: string;
  score: AlignmentScore;
  objectiveCount: number;
  alignedCount: number;
  misalignedObjectives: MisalignedObjective[];
}

export interface MisalignedObjective {
  objectiveId: string;
  objectiveTitle: string;
  gap: number;
  reason: string;
}

export interface CrossFunctionalAlignment {
  departments: string[];
  sharedObjectives: number;
  collaborationScore: number;
  frictionPoints: FrictionPoint[];
  opportunities: CollaborationOpportunity[];
}

export interface FrictionPoint {
  description: string;
  impact: number;
  involvedDepartments: string[];
  suggestedResolution: string;
}

export interface CollaborationOpportunity {
  description: string;
  potentialBenefit: string;
  requiredActions: string[];
  easeOfImplementation: number;
}

export interface AlignmentGap {
  area: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  priority: Priority;
  rootCauses: string[];
  remediationPlan: string;
}

export interface AlignmentRecommendation {
  id: string;
  title: string;
  description: string;
  impactArea: string;
  expectedImprovement: number;
  effort: EffortLevel;
  priority: Priority;
  stakeholders: string[];
  timeline: string;
}

export interface ObjectiveRiskAssessment {
  objectiveId: string;
  objectiveTitle: string;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  contingencyPlans: ContingencyPlan[];
  earlyWarningIndicators: EarlyWarningIndicator[];
  owner: string;
  lastReviewed: Date;
  nextReview: Date;
}

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface RiskFactor {
  factor: string;
  probability: Probability;
  impact: Impact;
  score: number;
  category: RiskFactorCategory;
  isInternal: boolean;
  detectable: boolean;
}

export enum Probability {
  RARE = 'rare',
  UNLIKELY = 'unlikely',
  POSSIBLE = 'possible',
  LIKELY = 'likely',
  ALMOST_CERTAIN = 'almost_certain'
}

export enum Impact {
  NEGLIGIBLE = 'negligible',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SEVERE = 'severe'
}

export enum RiskFactorCategory {
  RESOURCE = 'resource',
  TECHNICAL = 'technical',
  EXTERNAL = 'external',
  ORGANIZATIONAL = 'organizational',
  DEPENDENCY = 'dependency',
  TIMELINE = 'timeline',
  SCOPE = 'scope',
  QUALITY = 'quality'
}

export interface MitigationStrategy {
  strategy: string;
  owner: string;
  status: MitigationStatus;
  effectiveness: number;
  implementedAt?: Date;
  evidence: string;
}

export enum MitigationStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  IMPLEMENTED = 'implemented',
  EFFECTIVE = 'effective',
  INEFFECTIVE = 'ineffective'
}

export interface ContingencyPlan {
  triggerCondition: string;
  actions: ContingencyAction[];
  owner: string;
  estimatedCost: number;
  timeline: string;
  lastUpdated: Date;
}

export interface ContingencyAction {
  action: string;
  sequence: number;
  dependencies: string[];
  resources: string[];
  duration: string;
}

export interface EarlyWarningIndicator {
  indicator: string;
  threshold: number;
  currentValue: number;
  status: IndicatorStatus;
  trend: ChangeDirection;
  lastChecked: Date;
  nextCheck: Date;
  responsible: string;
}

export enum IndicatorStatus {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export interface ObjectiveRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  targetObjectives: string[];
  rationale: string;
  expectedOutcome: string;
  implementationApproach: string;
  priority: Priority;
  effort: EffortLevel;
  timeline: string;
  stakeholders: string[];
  successMetrics: string[];
}
