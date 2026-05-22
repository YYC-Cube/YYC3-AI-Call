import { Currency, Priority, Objective, AvailabilityStatus } from './cross-architecture';

export enum Industry {
  ENTERPRISE_MANAGEMENT = 'enterprise_management',
  EDUCATION = 'education',
  RETAIL = 'retail',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  MANUFACTURING = 'manufacturing',
  GOVERNMENT = 'government',
  HOSPITALITY = 'hospitality'
}

export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise'
}

export interface Organization {
  id: string;
  name: string;
  industry: Industry;
  size: CompanySize;
  headquarters: Location;
  foundedYear: number;
  employeeCount: number;
  annualRevenue: number;
  currency: Currency;
  website: string;
  description: string;
  businessModel: BusinessModel;
  targetMarkets: MarketSegment[];
  competitiveAdvantages: string[];
  challenges: string[];
  digitalMaturityLevel: DigitalMaturityLevel;
  transformationGoals: TransformationGoal[];
  techStack: OrganizationTechStack;
  contacts: Contact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  country: string;
  state?: string;
  city: string;
  address: string;
  postalCode: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export enum BusinessModel {
  B2B = 'b2b',
  B2C = 'b2c',
  B2B2C = 'b2b2c',
  MARKETPLACE = 'marketplace',
  SUBSCRIPTION = 'subscription',
  FREEMIUM = 'freemium',
  TRANSACTIONAL = 'transactional'
}

export interface MarketSegment {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  marketSize: TAM_SAM_SOM;
  growthRate: number;
  competitionLevel: CompetitionLevel;
}

export interface TAM_SAM_SOM {
  tam: number;
  sam: number;
  som: number;
  currency: Currency;
}

export interface TAM_SAM_SOM {
  tam: number;
  sam: number;
  som: number;
  currency: Currency;
}

export enum CompetitionLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum DigitalMaturityLevel {
  LEVEL_1_INITIAL = 'level_1_initial',
  LEVEL_2_DEVELOPING = 'level_2_developing',
  LEVEL_3_DEFINED = 'level_3_defined',
  LEVEL_4_MANAGED = 'level_4_managed',
  LEVEL_5_OPTIMIZING = 'level_5_optimizing'
}

export interface TransformationGoal {
  id: string;
  title: string;
  description: string;
  category: TransformationCategory;
  priority: Priority;
  targetDate: Date;
  successMetrics: KPIReference[];
  status: GoalStatus;
  progress: number;
  owner: string;
  budgetAllocated: number;
  dependencies: string[];
}

export enum TransformationCategory {
  PROCESS_AUTOMATION = 'process_automation',
  DATA_DRIVEN_DECISION = 'data_driven_decision',
  CUSTOMER_EXPERIENCE = 'customer_experience',
  OPERATIONAL_EFFICIENCY = 'operational_efficiency',
  INNOVATION = 'innovation',
  TALENT_DEVELOPMENT = 'talent_development',
  DIGITAL_PRODUCTS = 'digital_products',
  ECOSYSTEM_INTEGRATION = 'ecosystem_integration'
}

export enum GoalStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface KPIReference {
  kpiId: string;
  name: string;
  targetValue: number;
  currentValue?: number;
  weight: number;
}

export interface OrganizationTechStack {
  erp?: string;
  crm?: string;
  hrms?: string;
  accounting?: string;
  collaboration?: string[];
  cloudProviders?: string[];
  databases?: string[];
  programmingLanguages?: string[];
  frameworks?: string[];
  ai_ml_tools?: string[];
  customApplications?: CustomApplication[];
}

export interface CustomApplication {
  name: string;
  purpose: string;
  technology: string;
  criticality: ApplicationCriticality;
  users: number;
  lastUpdated: Date;
}

export enum ApplicationCriticality {
  MISSION_CRITICAL = 'mission_critical',
  BUSINESS_CRITICAL = 'business_critical',
  OPERATIONAL = 'operational',
  SUPPORTIVE = 'supportive'
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: ContactRole;
  department?: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  preferences: ContactPreferences;
  lastContactDate?: Date;
  notes: string;
}

export enum ContactRole {
  CEO = 'ceo',
  CTO = 'cto',
  CFO = 'cfo',
  COO = 'coo',
  VP = 'vp',
  DIRECTOR = 'director',
  MANAGER = 'manager',
  SPECIALIST = 'specialist',
  EXECUTIVE_ASSISTANT = 'executive_assistant',
  OTHER = 'other'
}

export interface ContactPreferences {
  preferredLanguage: Language;
  preferredContactMethod: ContactMethod;
  preferredTimezone: string;
  bestContactTimes: TimeSlot[];
  communicationStyle: CommunicationStyle;
  doNotDisturb?: boolean;
}

export enum Language {
  ZH_CN = 'zh_cn',
  ZH_TW = 'zh_tw',
  EN_US = 'en_us',
  EN_GB = 'en_gb',
  JA = 'ja',
  KO = 'ko'
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  WECHAT = 'wechat',
  WHATSAPP = 'whatsapp',
  LINKEDIN = 'linkedin',
  VIDEO_CALL = 'video_call',
  IN_PERSON = 'in_person'
}

export interface TimeSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export enum CommunicationStyle {
  FORMAL = 'formal',
  SEMI_FORMAL = 'semi_formal',
  CASUAL = 'casual',
  TECHNICAL = 'technical',
  EXECUTIVE = 'executive'
}

export interface Employee {
  id: string;
  organizationId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: Department;
  position: Position;
  managerId?: string;
  directReports: string[];
  hireDate: Date;
  terminationDate?: Date;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  salary?: Compensation;
  skills: Skill[];
  certifications: Certification[];
  performanceReviews: PerformanceReview[];
  goals: EmployeeGoal[];
  activities: Activity[];
  documents: EmployeeDocument[];
  metadata: EmployeeMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  managerId?: string;
  headcount: number;
  budget: number;
  location: Location;
  description: string;
  objectives: Objective[];
}

export interface Position {
  id: string;
  title: string;
  level: PositionLevel;
  band: PayBand;
  reportsTo: string;
  directReports: string[];
  responsibilities: string[];
  requirements: Requirement[];
  isRemoteEligible: boolean;
  isCustomerFacing: boolean;
}

export enum PositionLevel {
  INDIVIDUAL_CONTRIBUTOR = 'individual_contributor',
  SENIOR = 'senior',
  STAFF = 'staff',
  PRINCIPAL = 'principal',
  MANAGER = 'manager',
  SENIOR_MANAGER = 'senior_manager',
  DIRECTOR = 'director',
  VICE_PRESIDENT = 'vice_president',
  SENIOR_VICE_PRESIDENT = 'senior_vice_president',
  C_LEVEL = 'c_level'
}

export interface PayBand {
  id: string;
  name: string;
  minSalary: number;
  maxSalary: number;
  midPoint: number;
  currency: Currency;
}

export interface Requirement {
  type: RequirementType;
  description: string;
  isRequired: boolean;
  proficiencyLevel?: ProficiencyLevel;
}

export enum RequirementType {
  SKILL = 'skill',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  CERTIFICATION = 'certification',
  LANGUAGE = 'language',
  SOFT_SKILL = 'soft_skill'
}

export enum ProficiencyLevel {
  NOVICE = 'novice',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  MASTER = 'master'
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  RETIRED = 'retired'
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  CONSULTANT = 'consultant',
  FREELANCE = 'freelance'
}

export interface Compensation {
  baseSalary: number;
  currency: Currency;
  payFrequency: PayFrequency;
  bonus?: BonusStructure;
  benefits?: BenefitPackage;
  stockOptions?: StockOptionGrant;
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export enum PayFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export interface BonusStructure {
  type: BonusType;
  targetPercentage: number;
  maxPercentage: number;
  metrics: PerformanceMetric[];
}

export enum BonusType {
  DISCRETIONARY = 'discretionary',
  PERFORMANCE_BASED = 'performance_based',
  PROFIT_SHARING = 'profit_sharing',
  COMMISSION = 'commission'
}

export interface PerformanceMetric {
  name: string;
  weight: number;
  target: number;
  current?: number;
}

export interface BenefitPackage {
  healthInsurance: HealthInsurancePlan;
  retirementPlan: RetirementPlan;
  paidTimeOff: PTOPolicy;
  otherBenefits: OtherBenefit[];
}

export interface HealthInsurancePlan {
  provider: string;
  planType: HealthPlanType;
  employeeContribution: number;
  employerContribution: number;
  coverageStartDate: Date;
}

export enum HealthPlanType {
  HMO = 'hmo',
  PPO = 'ppo',
  EPO = 'epo',
  HDHP = 'hdhp'
}

export interface RetirementPlan {
  type: RetirementPlanType;
  employerMatchPercentage: number;
  vestingSchedule: VestingSchedule;
  employeeContribution: number;
}

export enum RetirementPlanType {
  _401K = '401k',
  PENSION = 'pension',
  IRA = 'ira',
  Roth_IRA = 'roth_ira'
}

export interface VestingSchedule {
  type: VestingType;
  cliffPeriodMonths: number;
  vestingPeriodMonths: number;
}

export enum VestingType {
  CLIFF = 'cliff',
  GRADUAL = 'gradual',
  IMMEDIATE = 'immediate'
}

export interface PTOPolicy {
  vacationDays: number;
  sickDays: number;
  personalDays: number;
  holidays: number;
  carryoverPolicy: CarryoverPolicy;
}

export enum CarryoverPolicy {
  NONE = 'none',
  LIMITED = 'limited',
  UNLIMITED = 'unlimited'
}

export interface OtherBenefit {
  name: string;
  value: number;
  frequency: BenefitFrequency;
  description: string;
}

export enum BenefitFrequency {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  ANNUALLY = 'annually',
  AS_NEEDED = 'as_needed'
}

export interface StockOptionGrant {
  totalShares: number;
  vestedShares: number;
  exercisePrice: number;
  grantDate: Date;
  vestingSchedule: VestingSchedule;
  cliffDate: Date;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: ProficiencyLevel;
  yearsOfExperience: number;
  lastUsed: Date;
  verified: boolean;
  verificationSource?: string;
}

export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT_SKILL = 'soft_skill',
  LANGUAGE = 'language',
  DOMAIN = 'domain',
  TOOL = 'tool',
  CERTIFICATION = 'certification'
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialUrl?: string;
  verificationStatus: VerificationStatus;
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  EXPIRED = 'expired',
  NOT_VERIFIED = 'not_verified'
}

export interface PerformanceReview {
  id: string;
  period: ReviewPeriod;
  reviewerId: string;
  overallRating: Rating;
  scores: Score[];
  strengths: string[];
  areasForImprovement: string[];
  goalsForNextPeriod: string[];
  comments: string;
  status: ReviewStatus;
  submittedAt: Date;
  reviewedAt?: Date;
}

export interface ReviewPeriod {
  startDate: Date;
  endDate: Date;
  type: ReviewType;
}

export enum ReviewType {
  ANNUAL = 'annual',
  SEMI_ANNUAL = 'semi_annual',
  QUARTERLY = 'quarterly',
  PROJECT_BASED = 'project_based',
  PROBATIONARY = 'probationary',
  PROMOTION = 'promotion'
}

export enum Rating {
  EXCEPTIONAL = 'exceptional',
  EXCEEDS_EXPECTATIONS = 'exceeds_expectations',
  MEETS_EXPECTATIONS = 'meets_expectations',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  UNSATISFACTORY = 'unsatisfactory'
}

export interface Score {
  competency: Competency;
  rating: Rating;
  weight: number;
  comments: string;
  evidence: string[];
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  category: CompetencyCategory;
  behaviors: Behavior[];
}

export enum CompetencyCategory {
  LEADERSHIP = 'leadership',
  TECHNICAL = 'technical',
  COMMUNICATION = 'communication',
  COLLABORATION = 'collaboration',
  INNOVATION = 'innovation',
  CUSTOMER_FOCUS = 'customer_focus',
  RESULTS_ORIENTATION = 'results_orientation',
  ADAPTABILITY = 'adaptability'
}

export interface Behavior {
  description: string;
  proficiencyLevel: ProficiencyLevel;
}

export enum ReviewStatus {
  DRAFT = 'draft',
  SELF_ASSESSMENT = 'self_assessment',
  MANAGER_REVIEW = 'manager_review',
  CALIBRATION = 'calibration',
  EMPLOYEE_SIGN_OFF = 'employee_sign_off',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface EmployeeGoal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: Priority;
  startDate: Date;
  dueDate: Date;
  status: GoalStatus;
  progress: number;
  keyResults: KeyResult[];
  alignsWithDepartmentGoal?: string;
  alignsWithCompanyGoal?: string;
  mentorId?: string;
  checkIns: CheckIn[];
  resources: Resource[];
  obstacles: Obstacle[];
}

export enum GoalCategory {
  PERFORMANCE = 'performance',
  DEVELOPMENT = 'development',
  STRETCH = 'stretch',
  PERSONAL = 'personal',
  TEAM = 'team'
}

export interface KeyResult {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  confidence: ConfidenceLevel;
  status: KRStatus;
  updatedAt: Date;
}

export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum KRStatus {
  NOT_STARTED = 'not_started',
  BEHIND = 'behind',
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  ACHIEVED = 'achieved'
}

export interface CheckIn {
  id: string;
  date: Date;
  type: CheckInType;
  notes: string;
  progressUpdate: number;
  obstaclesIdentified: string[];
  supportNeeded: string[];
  nextSteps: string[];
  attendeeIds: string[];
}

export enum CheckInType {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  AD_HOC = 'ad_hoc'
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  availability: AvailabilityStatus;
  allocatedTo?: string;
  quantity?: number;
  cost?: number;
}

export enum ResourceType {
  BUDGET = 'budget',
  TIME = 'time',
  EQUIPMENT = 'equipment',
  SOFTWARE = 'software',
  TRAINING = 'training',
  MENTORSHIP = 'mentorship',
  PERSONNEL = 'personnel',
  OTHER = 'other'
}

export interface Obstacle {
  id: string;
  description: string;
  severity: Severity;
  status: ObstacleStatus;
  identifiedDate: Date;
  resolutionDate?: Date;
  resolutionStrategy?: string;
  owner: string;
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ObstacleStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  RESOLVED = 'resolved',
  DEFERRED = 'deferred'
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  participants: string[];
  status: ActivityStatus;
  outcome?: string;
  metadata: Record<string, unknown>;
}

export enum ActivityType {
  MEETING = 'meeting',
  TRAINING = 'training',
  PROJECT_WORK = 'project_work',
  TASK_COMPLETION = 'task_completion',
  MILESTONE = 'milestone',
  REVIEW = 'review',
  EVENT = 'event',
  TIME_OFF = 'time_off',
  OTHER = 'other'
}

export enum ActivityStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  expiresAt?: Date;
  isConfidential: boolean;
  accessLevel: AccessLevel;
  version: number;
  tags: string[];
}

export enum DocumentType {
  RESUME = 'resume',
  CONTRACT = 'contract',
  ID_DOCUMENT = 'id_document',
  EDUCATION_CERTIFICATE = 'education_certificate',
  PERFORMANCE_REVIEW = 'performance_review',
  TRAINING_RECORD = 'training_record',
  TAX_DOCUMENT = 'tax_document',
  BENEFIT_ENROLLMENT = 'benefit_enrollment',
  DISCIPLINARY_ACTION = 'disciplinary_action',
  RECOGNITION = 'recognition',
  OTHER = 'other'
}

export enum DocumentCategory {
  PERSONAL = 'personal',
  EMPLOYMENT = 'employment',
  PERFORMANCE = 'performance',
  DEVELOPMENT = 'development',
  BENEFITS = 'benefits',
  LEGAL = 'legal',
  TRAINING = 'training',
  OTHER = 'other'
}

export enum AccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export interface EmployeeMetadata {
  emergencyContact: EmergencyContact;
  workPreferences: WorkPreferences;
  accessibilityNeeds?: AccessibilityNeed[];
  customFields: Record<string, string | number | boolean>;
}

export interface EmergencyContact {
  name: string;
  relationship: Relationship;
  phone: string;
  email: string;
  alternatePhone?: string;
}

export enum Relationship {
  SPOUSE = 'spouse',
  PARTNER = 'partner',
  PARENT = 'parent',
  SIBLING = 'sibling',
  CHILD = 'child',
  FRIEND = 'friend',
  OTHER = 'other'
}

export interface WorkPreferences {
  preferredWorkHours: TimeSlot[];
  remoteWorkPreference: RemoteWorkPreference;
  communicationPreferences: CommunicationPreference[];
  meetingPreferences: MeetingPreference;
  notificationSettings: NotificationSetting[];
}

export enum RemoteWorkPreference {
  ON_SITE = 'on_site',
  HYBRID = 'hybrid',
  REMOTE = 'remote',
  FLEXIBLE = 'flexible'
}

export interface CommunicationPreference {
  channel: Channel;
  preference: ChannelPreference;
  responseTimeExpectation: ResponseTimeExpectation;
}

export enum Channel {
  EMAIL = 'email',
  SLACK = 'slack',
  TEAMS = 'teams',
  PHONE = 'phone',
  SMS = 'sms',
  IN_PERSON = 'in_person'
}

export enum ChannelPreference {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  AVOID = 'avoid'
}

export enum ResponseTimeExpectation {
  IMMEDIATE = 'immediate',
  WITHIN_1_HOUR = 'within_1_hour',
  WITHIN_4_HOURS = 'within_4_hours',
  SAME_DAY = 'same_day',
  NEXT_BUSINESS_DAY = 'next_business_day',
  WITHIN_WEEK = 'within_week',
  FLEXIBLE = 'flexible'
}

export interface MeetingPreference {
  preferredMeetingDays: DayOfWeek[];
  preferredMeetingTimes: TimeSlot[];
  maxMeetingsPerDay: number;
  bufferBetweenMeetings: number;
  defaultDuration: number;
  prefersVideoOn: boolean;
}

export interface NotificationSetting {
  category: NotificationCategory;
  enabled: boolean;
  channels: Channel[];
  quietHours?: TimeSlot;
  frequency: NotificationFrequency;
}

export enum NotificationCategory {
  TASK_ASSIGNMENTS = 'task_assignments',
  MEETING_INVITES = 'meeting_invites',
  DEADLINE_REMINDERS = 'deadline_reminders',
  UPDATES = 'updates',
  ANNOUNCEMENTS = 'announcements',
  URGENT = 'urgent',
  DIGESTS = 'digests',
  FEEDBACK = 'feedback',
  RECOGNITION = 'recognition',
  SYSTEM = 'system'
}

export enum NotificationFrequency {
  REALTIME = 'realtime',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  DIGEST = 'digest'
}

export interface AccessibilityNeed {
  type: AccessibilityType;
  description: string;
  accommodationsRequired: string[];
  providedAccommodations: string[];
  lastReviewed: Date;
  nextReview: Date;
}

export enum AccessibilityType {
  PHYSICAL = 'physical',
  VISUAL = 'visual',
  HEARING = 'hearing',
  COGNITIVE = 'cognitive',
  NEUROLOGICAL = 'neurological',
  MENTAL_HEALTH = 'mental_health',
  CHRONIC_CONDITION = 'chronic_condition',
  TEMPORARY = 'temporary',
  OTHER = 'other'
}
