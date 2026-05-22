export enum BusinessDimension {
  JING = 'jing',       // 经营 (Strategic Management)
  GUAN = 'guan',      // 管理 (Organizational Management)
  YUN = 'yun',        // 运营 (Operations)
  WEI = 'wei',        // 维护 (Maintenance & Support)
  XIAO = 'xiao'       // 销售 (Sales & Marketing)
}

export enum EnablementDimension {
  SHU = 'shu',        // 数据化 (Data Enablement)
  ZHI = 'zhi',        // 智能化 (Intelligence & Automation)
  XIE = 'xie',        // 协同化 (Collaboration)
  ZHUAN = 'zhuan'     // 转型赋能 (Transformation)
}

export interface CrossArchitectureCell {
  business: BusinessDimension;
  enablement: EnablementDimension;
  moduleName: string;
  description: string;
  capabilities: string[];
  maturityLevel: MaturityLevel;
  priority: Priority;
}

export enum MaturityLevel {
  LEVEL_0 = 'level_0',
  LEVEL_1 = 'level_1',
  LEVEL_2 = 'level_2',
  LEVEL_3 = 'level_3',
  LEVEL_4 = 'level_4',
  LEVEL_5 = 'level_5'
}

export enum Priority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3'
}

export interface TransformationRoadmap {
  currentMatrix: CrossArchitectureCell[][];
  targetMatrix: CrossArchitectureCell[][];
  phases: TransformationPhase[];
  timeline: Timeline;
  resources: ResourceAllocation;
  kpis: KPI[];
}

export interface TransformationPhase {
  id: string;
  name: string;
  description: string;
  duration: Duration;
  objectives: Objective[];
  deliverables: Deliverable[];
  dependencies: string[];
  risks: Risk[];
}

export interface Duration {
  start: Date;
  end: Date;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  measurableOutcome: string;
  targetValue: number;
  currentValue?: number;
  unit: string;
  deadline: Date;
  owner: string;
  status: ObjectiveStatus;
  progress: number;
}

export enum ObjectiveStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  AT_RISK = 'at_risk',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Deliverable {
  id: string;
  name: string;
  type: DeliverableType;
  description: string;
  acceptanceCriteria: string[];
  status: DeliverableStatus;
  assignee: string;
  dueDate: Date;
  completedDate?: Date;
  artifacts: Artifact[];
}

export enum DeliverableType {
  SOFTWARE = 'software',
  DOCUMENTATION = 'documentation',
  PROCESS = 'process',
  TRAINING = 'training',
  INFRASTRUCTURE = 'infrastructure'
}

export enum DeliverableStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

export interface Artifact {
  id: string;
  name: string;
  type: ArtifactType;
  url: string;
  version: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ArtifactType {
  CODE = 'code',
  DOCUMENT = 'document',
  DIAGRAM = 'diagram',
  CONFIGURATION = 'configuration',
  DATA = 'data'
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  probability: RiskProbability;
  impact: RiskImpact;
  score: number;
  mitigationStrategy: string;
  contingencyPlan: string;
  owner: string;
  status: RiskStatus;
  identifiedAt: Date;
  lastReviewedAt?: Date;
}

export enum RiskProbability {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum RiskImpact {
  NEGLIGIBLE = 'negligible',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SEVERE = 'severe'
}

export enum RiskStatus {
  OPEN = 'open',
  MITIGATING = 'mitigating',
  MONITORING = 'monitoring',
  CLOSED = 'closed',
  OCCURRED = 'occurred'
}

export interface ResourceAllocation {
  humanResources: HumanResource[];
  budget: Budget;
  technology: TechnologyStack;
  externalPartners: ExternalPartner[];
}

export interface HumanResource {
  id: string;
  role: Role;
  name: string;
  department: string;
  allocationPercentage: number;
  startDate: Date;
  endDate: Date;
  costPerMonth: number;
  skills: string[];
  availability: AvailabilityStatus;
}

export enum Role {
  PRODUCT_MANAGER = 'product_manager',
  SOLUTION_ARCHITECT = 'solution_architect',
  FRONTEND_DEVELOPER = 'frontend_developer',
  BACKEND_DEVELOPER = 'backend_developer',
  AI_ENGINEER = 'ai_engineer',
  DATA_ENGINEER = 'data_engineer',
  QA_ENGINEER = 'qa_engineer',
  DEVOPS_ENGINEER = 'devops_engineer',
  UI_UX_DESIGNER = 'ui_ux_designer',
  PROJECT_MANAGER = 'project_manager',
  BUSINESS_ANALYST = 'business_analyst',
  SALES_ENGINEER = 'sales_engineer',
  CUSTOMER_SUCCESS_MANAGER = 'customer_success_manager'
}

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  PARTIALLY_AVAILABLE = 'partially_available',
  UNAVAILABLE = 'unavailable',
  TO_BE_HIRED = 'to_be_hired'
}

export interface Budget {
  totalAmount: number;
  currency: Currency;
  breakdown: BudgetItem[];
  contingencyReserve: number;
  spentAmount: number;
  remainingAmount: number;
}

export enum Currency {
  CNY = 'CNY',
  USD = 'USD',
  EUR = 'EUR'
}

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  description: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  status: BudgetStatus;
}

export enum BudgetCategory {
  PERSONNEL = 'personnel',
  TECHNOLOGY = 'technology',
  INFRASTRUCTURE = 'infrastructure',
  TRAINING = 'training',
  CONSULTING = 'consulting',
  MARKETING = 'marketing',
  CONTINGENCY = 'contingency',
  OTHER = 'other'
}

export enum BudgetStatus {
  PLANNED = 'planned',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVER_BUDGET = 'over_budget',
  CANCELLED = 'cancelled'
}

export interface TechnologyStack {
  frontend: TechnologyComponent[];
  backend: TechnologyComponent[];
  database: TechnologyComponent[];
  infrastructure: TechnologyComponent[];
  ai_ml: TechnologyComponent[];
  integrations: TechnologyComponent[];
}

export interface TechnologyComponent {
  name: string;
  version: string;
  purpose: string;
  license: LicenseType;
  supportLevel: SupportLevel;
  riskAssessment: TechRiskAssessment;
}

export enum LicenseType {
  OPEN_SOURCE = 'open_source',
  COMMERCIAL = 'commercial',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

export enum SupportLevel {
  COMMUNITY = 'community',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  PREMIUM = 'premium'
}

export interface TechRiskAssessment {
  maturityScore: number;
  communityActivity: CommunityActivity;
  vendorStability: VendorStability;
  securityPosture: SecurityPosture;
  overallRisk: OverallTechRisk;
  recommendations: string[];
}

export enum CommunityActivity {
  VERY_ACTIVE = 'very_active',
  ACTIVE = 'active',
  MODERATE = 'moderate',
  LOW = 'low',
  DORMANT = 'dormant'
}

export enum VendorStability {
  ESTABLISHED = 'established',
  GROWING = 'growing',
  STARTUP = 'startup',
  UNCERTAIN = 'uncertain'
}

export enum SecurityPosture {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  ADEQUATE = 'adequate',
  CONCERNING = 'concerning',
  POOR = 'poor'
}

export enum OverallTechRisk {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ExternalPartner {
  id: string;
  name: string;
  type: PartnerType;
  scopeOfWork: string;
  contractValue: number;
  startDate: Date;
  endDate: Date;
  contactPerson: string;
  performanceRating?: number;
  status: PartnerStatus;
}

export enum PartnerType {
  ISV = 'isv',
  SI = 'si',
  CONSULTANT = 'consultant',
  AGENCY = 'agency',
  TECHNOLOGY_VENDOR = 'technology_vendor',
  CLOUD_PROVIDER = 'cloud_provider'
}

export enum PartnerStatus {
  PROSPECTIVE = 'prospective',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  TERMINATED = 'terminated'
}

export interface Timeline {
  phases: PhaseTimeline[];
  milestones: Milestone[];
  criticalPath: CriticalPathItem[];
  slack: SlackAnalysis;
}

export interface PhaseTimeline {
  phaseId: string;
  phaseName: string;
  start: Date;
  end: Date;
  duration: number;
  dependencies: string[];
  status: PhaseStatus;
  progress: number;
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  date: Date;
  type: MilestoneType;
  status: MilestoneStatus;
  deliverables: string[];
  owner: string;
  criteria: string;
}

export enum MilestoneType {
  GATE_REVIEW = 'gate_review',
  DELIVERY = 'delivery',
  DECISION_POINT = 'decision_point',
  EXTERNAL = 'external',
  INTERNAL = 'internal'
}

export enum MilestoneStatus {
  UPCOMING = 'upcoming',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled'
}

export interface CriticalPathItem {
  id: string;
  taskName: string;
  duration: number;
  earliestStart: Date;
  latestFinish: Date;
  slack: number;
  isCritical: boolean;
  predecessors: string[];
  successors: string[];
  resource: string;
}

export interface SlackAnalysis {
  totalSlack: number;
  averageSlack: number;
  itemsWithNoSlack: string[];
  recommendations: string[];
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  category: KPICategory;
  unit: string;
  baseline: number;
  target: number;
  current?: number;
  measurementFrequency: MeasurementFrequency;
  dataSource: string;
  owner: string;
  trend: KPITrend;
  status: KPIStatus;
  lastUpdated: Date;
}

export enum KPICategory {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  CUSTOMER = 'customer',
  LEARNING_GROWTH = 'learning_growth',
  PROCESS = 'process',
  TECHNOLOGY = 'technology'
}

export enum MeasurementFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export enum KPITrend {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  VOLATILE = 'volatile',
  UNKNOWN = 'unknown'
}

export enum KPIStatus {
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  OFF_TRACK = 'off_track',
  ACHIEVED = 'achieved',
  NOT_MEASURED = 'not_measured'
}
