export enum ChannelType {
  WEB_CHAT = 'web_chat',
  MOBILE_APP = 'mobile_app',
  WECHAT = 'wechat',
  WECHAT_WORK = 'wechat_work',
  DINGTALK = 'dingtalk',
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  VIDEO_CALL = 'video_call',
  SOCIAL_MEDIA = 'social_media',
  IOT_DEVICE = 'iot_device',
  API = 'api'
}

export enum CustomerIntent {
  PRODUCT_INQUIRY = 'product_inquiry',
  PRICE_INQUIRY = 'price_inquiry',
  ORDER_STATUS = 'order_status',
  TECHNICAL_SUPPORT = 'technical_support',
  COMPLAINT = 'complaint',
  RETURN_REFUND = 'return_refund',
  ACCOUNT_ISSUE = 'account_issue',
  BILLING_INQUIRY = 'billing_inquiry',
  GENERAL_QUESTION = 'general_question',
  FEEDBACK = 'feedback',
  PARTNERSHIP = 'partnership',
  APPOINTMENT = 'appointment',
  CUSTOM = 'custom'
}

export enum ConversationStatus {
  ACTIVE = 'active',
  WAITING = 'waiting',
  BOT_HANDLING = 'bot_handling',
  AGENT_HANDLING = 'agent_handling',
  TRANSFERRING = 'transferring',
  ON_HOLD = 'on_hold',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
  ABANDONED = 'abandoned',
  TIMEOUT = 'timeout'
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  SYSTEM = 'system',
  INTERNAL = 'internal'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  CONTACT_CARD = 'contact_card',
  RICH_TEXT = 'rich_text',
  TEMPLATE = 'template',
  QUICK_REPLY = 'quick_reply',
  CAROUSEL = 'carousel',
  FORM = 'form',
  BUTTON = 'button',
  VOICE_NOTE = 'voice_note',
  STICKER = 'sticker',
  SYSTEM_NOTIFICATION = 'system_notification',
  TYPING_INDICATOR = 'typing_indicator'
}

export enum AgentStatus {
  ONLINE = 'online',
  BUSY = 'busy',
  AWAY = 'away',
  OFFLINE = 'offline',
  IN_BREAK = 'in_break',
  IN_TRAINING = 'in_training',
  DO_NOT_DISTURB = 'do_not_disturb'
}

export enum PriorityLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  VIP = 'vip'
}

export interface Conversation {
  id: string;
  conversationNumber: string;
  channelId: string;
  channelType: ChannelType;
  customerId: string;
  customerInfo: CustomerProfile;
  status: ConversationStatus;
  priority: PriorityLevel;
  subject?: string;
  tags: string[];
  category: ConversationCategory;
  subcategory?: string;
  queueId?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  teamId?: string;
  departmentId?: string;
  slaSettings: SLAConfig;
  slaStatus: SLAStatus;
  messages: Message[];
  summary: ConversationSummary;
  sentiment: SentimentAnalysis;
  satisfactionScore?: number;
  npsScore?: number;
  csatDetails?: CSATDetail;
  metadata: ConversationMetadata;
  customFields: CustomFieldData[];
  relatedOrders?: string[];
  relatedTickets?: string[];
  previousConversations?: string[];
  context: ConversationContext;
  aiAssistData: AIAssistData;
  transferHistory: TransferRecord[];
  surveyResults?: SurveyResult[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  firstResponseTime?: number;
  resolutionTime?: number;
  version: number;
}

export interface CustomerProfile {
  id: string;
  externalId?: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  company?: string;
  position?: string;
  vipLevel: VIPLevel;
  customerSegment: CustomerSegment;
  language: string;
  timezone: string;
  location?: GeoLocation;
  preferences: CustomerPreferences;
  interactionHistory: InteractionSummary;
  purchaseHistory: PurchaseSummary;
  supportHistory: SupportSummary;
  riskProfile: RiskProfile;
  lifetimeValue: number;
  churnRisk: ChurnRiskLevel;
  tags: string[];
  customAttributes: Record<string, unknown>;
  mergedProfiles?: string[];
  lastInteractionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum VIPLevel {
  REGULAR = 'regular',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

export enum CustomerSegment {
  NEW = 'new',
  RECURRING = 'recurring',
  LOYAL = 'loyal',
  AT_RISK = 'at_risk',
  CHURNED = 'churned',
  VIP = 'vip',
  ENTERPRISE = 'enterprise',
  SMB = 'smb'
}

export interface CustomerPreferences {
  preferredChannel: ChannelType;
  preferredLanguage: string;
  contactTimePreference: TimePreference;
  communicationFrequency: FrequencyPreference;
  marketingOptIn: boolean;
  notificationPreferences: NotificationPreference;
  accessibilityNeeds?: AccessibilityNeed[];
}

export enum TimePreference {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  ANYTIME = 'anytime'
}

export enum FrequencyPreference {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  IMPORTANT_ONLY = 'important_only',
  NEVER = 'never'
}

export interface NotificationPreference {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  voice: boolean;
}

export enum AccessibilityNeed {
  SCREEN_READER = 'screen_reader',
  HIGH_CONTRAST = 'high_contrast',
  LARGE_TEXT = 'large_text',
  CAPTIONS = 'captions',
  SIGN_LANGUAGE = 'sign_language'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  ip?: string;
}

export interface InteractionSummary {
  totalInteractions: number;
  last30Days: number;
  last90Days: number;
  averageResponseTime: number;
  preferredChannels: ChannelType[];
  peakHours: number[];
  satisfactionTrend: TrendData;
}

export interface PurchaseSummary {
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate?: Date;
  favoriteCategories: string[];
  purchaseFrequency: string;
  customerLifetime: number;
}

export interface SupportSummary {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  csatScore: number;
  topIssues: string[];
  escalationRate: number;
  repeatContactRate: number;
}

export interface RiskProfile {
  creditRisk: RiskLevel;
  paymentRisk: RiskLevel;
  fraudRisk: RiskLevel;
  complianceRisk: RiskLevel;
  overallScore: number;
  factors: RiskFactor[];
}

export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface RiskFactor {
  factor: string;
  level: RiskLevel;
  weight: number;
  description: string;
  lastUpdated: Date;
}

export enum ChurnRiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Message {
  id: string;
  conversationId: string;
  messageId: string;
  direction: MessageDirection;
  type: MessageType;
  senderId: string;
  senderName: string;
  senderType: SenderType;
  content: MessageContent;
  attachments: Attachment[];
  reactions: Reaction[];
  replyToMessageId?: string;
  quotedMessage?: MessagePreview;
  metadata: MessageMetadata;
  processingInfo: ProcessingInfo;
  sentiment?: SentimentScore;
  intent?: DetectedIntent;
  entities?: ExtractedEntity[];
  translation?: TranslationResult;
  moderationResult?: ModerationResult;
  timestamp: Date;
  deliveredAt?: Date;
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  isDeleted: boolean;
  isEncrypted: boolean;
  version: number;
}

export enum SenderType {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  BOT = 'bot',
  SYSTEM = 'system',
  SUPERVISOR = 'supervisor'
}

export interface MessageContent {
  text?: string;
  html?: string;
  markdown?: string;
  richContent?: RichContent;
  media?: MediaContent;
  structured?: StructuredContent;
}

export interface RichContent {
  type: 'card' | 'list' | 'table' | 'form' | 'widget';
  data: Record<string, unknown>;
  style?: Record<string, unknown>;
}

export interface MediaContent {
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
}

export interface StructuredContent {
  type: 'quick_replies' | 'carousel' | 'template' | 'form' | 'button_group';
  items: StructuredItem[];
  metadata?: Record<string, unknown>;
}

export interface StructuredItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  actions?: ActionItem[];
  metadata?: Record<string, unknown>;
}

export interface ActionItem {
  type: 'postback' | 'url' | 'phone' | 'location' | 'custom';
  label: string;
  value: string;
  icon?: string;
  style?: ActionStyle;
}

export enum ActionStyle {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  SUCCESS = 'success'
}

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  virusScanStatus: VirusScanStatus;
  uploadedBy: string;
  uploadedAt: Date;
  expirationDate?: Date;
}

export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  ARCHIVE = 'archive',
  CODE = 'code',
  OTHER = 'other'
}

export enum VirusScanStatus {
  PENDING = 'pending',
  SCANNING = 'scanning',
  CLEAN = 'clean',
  INFECTED = 'infected',
  ERROR = 'error',
  SKIPPED = 'skipped'
}

export interface Reaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface MessagePreview {
  messageId: string;
  senderName: string;
  previewText: string;
  type: MessageType;
  timestamp: Date;
}

export interface MessageMetadata {
  sourceChannel: ChannelType;
  originalMessageId?: string;
  correlationId?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  location?: GeoLocation;
  campaignId?: string;
  utmParameters?: UTMMetrics;
  customAttributes: Record<string, unknown>;
}

export interface DeviceInfo {
  type: DeviceType;
  os: string;
  browser?: string;
  appVersion?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  SMART_TV = 'smart_tv',
  WEARABLE = 'wearable',
  OTHER = 'other'
}

export interface UTMMetrics {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface ProcessingInfo {
  processedBy: ProcessingSource;
  processingTime: number;
  confidence: number;
  modelVersion?: string;
  featuresUsed: string[];
  errors?: ProcessingError[];
}

export enum ProcessingSource {
  AI_MODEL = 'ai_model',
  RULE_ENGINE = 'rule_engine',
  HUMAN_AGENT = 'human_agent',
  HYBRID = 'hybrid'
}

export interface ProcessingError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  retryCount: number;
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SentimentScore {
  overall: number;
  positive: number;
  negative: number;
  neutral: number;
  confidence: number;
  emotions: EmotionScores;
  aspectBasedSentiment?: AspectSentiment[];
}

export interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  trust: number;
  anticipation: number;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: number;
  keywords: string[];
  confidence: number;
}

export interface DetectedIntent {
  primaryIntent: CustomerIntent;
  confidence: number;
  alternativeIntents: IntentAlternative[];
  slots: IntentSlot[];
  context: IntentContext;
  requiresClarification: boolean;
  clarificationQuestions?: string[];
}

export interface IntentAlternative {
  intent: CustomerIntent;
  confidence: number;
  reasons: string[];
}

export interface IntentSlot {
  name: string;
  value: string;
  entityType: string;
  confidence: number;
  required: boolean;
  filled: boolean;
  prompt?: string;
  validation?: SlotValidation;
}

export interface SlotValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
  customValidator?: string;
}

export interface IntentContext {
  previousIntents: CustomerIntent[];
  conversationPhase: ConversationPhase;
  userGoal: string;
  businessContext: BusinessContext;
}

export enum ConversationPhase {
  GREETING = 'greeting',
  IDENTIFICATION = 'identification',
  NEED_ASSESSMENT = 'need_assessment',
  SOLUTION_PRESENTATION = 'solution_presentation',
  OBJECTION_HANDLING = 'objection_handling',
  NEGOTIATION = 'negotiation',
  CLOSING = 'closing',
  FOLLOW_UP = 'follow_up'
}

export interface BusinessContext {
  productCategory?: string;
  priceRange?: PriceRange;
  urgency?: UrgencyLevel;
  budget?: number;
  decisionMaker?: string;
  timeline?: TimelineInfo;
  competitors?: string[];
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  IMMEDIATE = 'immediate'
}

export interface TimelineInfo {
  start?: Date;
  end?: Date;
  flexibility: FlexibilityLevel;
  milestones?: Milestone[];
}

export enum FlexibilityLevel {
  FLEXIBLE = 'flexible',
  MODERATELY_FLEXIBLE = 'moderately_flexible',
  FIXED = 'fixed',
  URGENT = 'urgent'
}

export interface Milestone {
  date: Date;
  description: string;
  importance: ImportanceLevel;
}

export enum ImportanceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  startPosition: number;
  endPosition: number;
  normalizedValue?: string;
  metadata?: Record<string, unknown>;
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  TIME = 'time',
  MONEY = 'money',
  PERCENTAGE = 'percentage',
  PRODUCT = 'product',
  ORDER_ID = 'order_id',
  PHONE_NUMBER = 'phone_number',
  EMAIL = 'email',
  URL = 'url',
  QUANTITY = 'quantity',
  CUSTOM = 'custom'
}

export interface TranslationResult {
  originalLanguage: string;
  targetLanguage: string;
  translatedText: string;
  confidence: number;
  serviceUsed: string;
  processingTime: number;
}

export interface ModerationResult {
  isFlagged: boolean;
  category: ModerationCategory;
  severity: ModerationSeverity;
  confidence: number;
  actionTaken: ModerationAction;
  details: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export enum ModerationCategory {
  PROFANITY = 'profanity',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  PERSONAL_INFO = 'personal_info',
  VIOLENCE = 'violence',
  SELF_HARM = 'self_harm',
  SEXUAL_CONTENT = 'sexual_content',
  HATE_SPEECH = 'hate_speech',
  MISINFORMATION = 'misinformation',
  CUSTOM = 'custom'
}

export enum ModerationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ModerationAction {
  NONE = 'none',
  WARN = 'warn',
  HIDE = 'hide',
  BLOCK = 'block',
  FLAG_FOR_REVIEW = 'flag_for_review',
  AUTO_RESPOND = 'auto_respond',
  ESCALATE = 'escalate'
}

export interface ConversationCategory {
  primary: string;
  secondary?: string;
  tertiary?: string;
  confidence: number;
}

export interface SLAConfig {
  firstResponseTime: SLATarget;
  resolutionTime: SLATarget;
  nextResponseTime: SLATarget;
  workingHoursOnly: boolean;
  holidaysIncluded: boolean;
  pauseConditions: SLAPauseCondition[];
  breachActions: BreachAction[];
}

export interface SLATarget {
  targetSeconds: number;
  warningThreshold: number;
  businessPriority: PriorityLevel;
}

export interface SLAPauseCondition {
  condition: string;
  autoPause: boolean;
  maxPauseDuration: number;
  requireApproval: boolean;
}

export interface BreachAction {
  triggerPoint: number;
  action: SLABreachAction;
  notifications: NotificationConfig[];
  autoEscalate: boolean;
  supervisorAlert: boolean;
}

export enum SLABreachAction {
  WARNING = 'warning',
  ESCALATE = 'escalate',
  AUTO_ASSIGN = 'auto_assign',
  NOTIFY_MANAGER = 'notify_manager',
  SURVEY_TRIGGER = 'survey_trigger'
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  template: string;
  delayMinutes: number;
  recipients: string[];
  includeDetails: boolean;
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  WECHAT = 'wechat',
  DINGTALK = 'dingtalk'
}

export interface SLAStatus {
  currentPhase: SLAPhase;
  firstResponseMet: boolean;
  firstResponseTime?: number;
  firstResponseTarget: number;
  resolutionMet: boolean;
  resolutionTime?: number;
  resolutionTarget: number;
  breaches: SLABreach[];
  pauses: SLAPause[];
  currentTimer: number;
  isPaused: boolean;
  nextMilestone?: SLAMilestone;
}

export enum SLAPhase {
  WAITING_FIRST_RESPONSE = 'waiting_first_response',
  WAITING_RESOLUTION = 'waiting_resolution',
  MET = 'met',
  BREACHED = 'breached',
  PAUSED = 'paused'
}

export interface SLABreach {
  breachId: string;
  type: SLABreachType;
  breachedAt: Date;
  targetTime: number;
  actualTime: number;
  actionTaken: SLABreachAction;
  resolvedAt?: Date;
  notifiedUsers: string[];
}

export enum SLABreachType {
  FIRST_RESPONSE = 'first_response',
  RESOLUTION = 'resolution',
  NEXT_RESPONSE = 'next_response'
}

export interface SLAPause {
  pauseId: string;
  startedAt: Date;
  endedAt?: Date;
  reason: string;
  initiatedBy: string;
  duration: number;
  approvedBy?: string;
}

export interface SLAMilestone {
  milestone: string;
  targetTime: Date;
  remainingTime: number;
  isAtRisk: boolean;
}

export interface ConversationSummary {
  autoGenerated: boolean;
  title: string;
  keyPoints: SummaryPoint[];
  outcome: ConversationOutcome;
  actionItems: ActionItem[];
  followUpRequired: boolean;
  followUpActions: FollowUpAction[];
  customerSentiment: SentimentOverview;
  agentPerformance: PerformanceMetric;
  knowledgeArticlesUsed: string[];
  tagsSuggested: string[];
  generatedAt: Date;
  lastUpdated: Date;
}

export interface SummaryPoint {
  point: string;
  importance: ImportanceLevel;
  category: string;
  evidence: string[];
}

export enum ConversationOutcome {
  RESOLVED = 'resolved',
  PARTIALLY_RESOLVED = 'partially_resolved',
  UNRESOLVED = 'unresolved',
  ESCALATED = 'escalated',
  TRANSFERRED = 'transferred',
  ABANDONED = 'abandoned',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred'
}

export interface FollowUpAction {
  actionId: string;
  description: string;
  assignee: string;
  dueDate: Date;
  priority: PriorityLevel;
  status: FollowUpStatus;
  completedAt?: Date;
}

export enum FollowUpStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

export interface SentimentOverview {
  overall: SentimentLabel;
  trend: TrendDirection;
  keyMoments: SentimentMoment[];
  averageScore: number;
  peakPositive?: SentimentMoment;
  peakNegative?: SentimentMoment;
}

export enum SentimentLabel {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  MIXED = 'mixed'
}

export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  FLUCTUATING = 'fluctuating'
}

export interface SentimentMoment {
  timestamp: Date;
  score: number;
  label: SentimentLabel;
  trigger: string;
  messageId: string;
}

export interface PerformanceMetric {
  responseTime: ResponseTimeMetric;
  qualityScore: number;
  efficiency: EfficiencyMetric;
  adherence: AdherenceMetric;
  customerFeedback: FeedbackMetric;
}

export interface ResponseTimeMetric {
  firstResponse: number;
  averageResponse: number;
  maxResponse: number;
  target: number;
  achievement: number;
}

export interface EfficiencyMetric {
  messagesPerHour: number;
  concurrentChats: number;
  handleTime: number;
  afterCallWork: number;
  utilization: number;
}

export interface AdherenceMetric {
  scheduleAdherence: number;
  breakCompliance: number;
  statusAccuracy: number;
  protocolCompliance: number;
}

export interface FeedbackMetric {
  csatScore: number;
  npsScore: number;
  positiveRating: number;
  negativeRating: number;
  responseCount: number;
}

export interface SentimentAnalysis {
  current: SentimentScore;
  trend: TrendData;
  aspects: AspectAnalysis[];
  emotionalJourney: EmotionalJourneyPoint[];
  triggers: SentimentTrigger[];
  predictions: SentimentPrediction;
}

export interface AspectAnalysis {
  aspect: string;
  scores: SentimentScore;
  keywords: string[];
  frequency: number;
  impact: ImpactLevel;
  improvementSuggestions: string[];
}

export interface EmotionalJourneyPoint {
  timestamp: Date;
  emotion: string;
  intensity: number;
  cause: string;
  messageId: string;
}

export interface SentimentTrigger {
  trigger: string;
  type: TriggerType;
  impact: number;
  frequency: number;
  suggestedResponse: string;
}

export interface SentimentPrediction {
  predictedOutcome: ConversationOutcome;
  confidence: number;
  riskFactors: string[];
  interventionPoints: InterventionPoint[];
  recommendedActions: string[];
}

export interface InterventionPoint {
  timestamp: Date;
  reason: string;
  suggestedAction: string;
  priority: PriorityLevel;
  automatedPossible: boolean;
}

export interface CSATDetail {
  rating: number;
  maxRating: number;
  categories: CSATCategory[];
  comments: string;
  respondedAt: Date;
  followUpInitiated: boolean;
}

export interface CSATCategory {
  category: string;
  rating: number;
  weight: number;
  comment?: string;
}

export interface SurveyResult {
  surveyId: string;
  surveyType: SurveyType;
  responses: SurveyResponse[];
  score: number;
  maxScore: number;
  completedAt: Date;
  sentAt: Date;
  reminderCount: number;
}

export enum SurveyType {
  CSAT = 'csat',
  NPS = 'nps',
  CES = 'ces',
  CUSTOM = 'custom'
}

export interface SurveyResponse {
  questionId: string;
  question: string;
  answer: SurveyAnswer;
  skipped: boolean;
  timestamp: Date;
}

export interface SurveyAnswer {
  type: 'rating' | 'text' | 'multiple_choice' | 'single_choice';
  value: number | string | string[];
  metadata?: Record<string, unknown>;
}

export interface ConversationMetadata {
  source: SourceType;
  campaign?: CampaignInfo;
  referrer?: ReferrerInfo;
  session: SessionInfo;
  device: DeviceContext;
  location: LocationContext;
  utm: UTMMetrics;
  customAttributes: Record<string, unknown>;
  integrationContext?: IntegrationContext;
}

export enum SourceType {
  WEB = 'web',
  MOBILE_APP = 'mobile_app',
  SOCIAL_MEDIA = 'social_media',
  API = 'api',
  EMAIL = 'email',
  PHONE = 'phone',
  CHATBOT = 'chatbot',
  IOT = 'iot',
  THIRD_PARTY = 'third_party'
}

export interface CampaignInfo {
  campaignId: string;
  campaignName: string;
  source: string;
  medium: string;
  content?: string;
  keyword?: string;
}

export interface ReferrerInfo {
  url: string;
  domain: string;
  searchQuery?: string;
  pagePath?: string;
}

export interface SessionInfo {
  sessionId: string;
  pageUrl: string;
  pageViews: number;
  timeOnSite: number;
  entryPage: string;
  exitPage?: string;
  bounce: boolean;
  userAgent: string;
}

export interface DeviceContext {
  type: DeviceType;
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

export interface LocationContext {
  country: string;
  region: string;
  city: string;
  timezone: string;
  ip: string;
  isp?: string;
}

export interface IntegrationContext {
  system: string;
  integrationId: string;
  externalConversationId?: string;
  syncStatus: SyncStatus;
  lastSyncAt?: Date;
  errorLog?: string;
}

export interface CustomFieldData {
  fieldId: string;
  fieldName: string;
  fieldType: FieldType;
  value: unknown;
  isVisible: boolean;
  isSearchable: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  TEXTAREA = 'textarea',
  RICH_TEXT = 'rich_text',
  FILE = 'file',
  USER = 'user',
  ORGANIZATION = 'organization',
  CALCULATED = 'calculated'
}

export interface ConversationContext {
  currentPage?: PageContext;
  shoppingCart?: CartContext;
  browsingHistory: BrowsingHistoryItem[];
  previousConversations: PreviousConversationSummary[];
  customerJourneyStage: JourneyStage;
  intentProgression: IntentProgressionItem[];
  businessRulesApplied: AppliedRule[];
  personalizationData: PersonalizationData;
}

export interface PageContext {
  url: string;
  title: string;
  timeOnPage: number;
  scrollDepth: number;
  clicks: ClickEvent[];
  formInteractions: FormInteraction[];
}

export interface ClickEvent {
  element: string;
  timestamp: Date;
  coordinates: { x: number; y: number };
  pageUrl: string;
}

export interface FormInteraction {
  formId: string;
  field: string;
  action: FormAction;
  value?: string;
  timestamp: Date;
}

export enum FormAction {
  FOCUS = 'focus',
  BLUR = 'blur',
  INPUT = 'input',
  SUBMIT = 'submit',
  VALIDATE = 'validate',
  ERROR = 'error'
}

export interface CartContext {
  itemCount: number;
  totalValue: number;
  currency: string;
  items: CartItem[];
  abandonedAt?: Date;
  recoveryEmailSent: boolean;
  couponApplied?: string;
  discountAmount?: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  variant?: string;
  imageUrl?: string;
  addedAt: Date;
}

export interface BrowsingHistoryItem {
  url: string;
  title: string;
  visitedAt: Date;
  timeOnPage: number;
  actions: string[];
  interests: string[];
}

export interface PreviousConversationSummary {
  conversationId: string;
  date: Date;
  subject: string;
  outcome: ConversationOutcome;
  summary: string;
  satisfactionScore?: number;
  agentName?: string;
}

export enum JourneyStage {
  AWARENESS = 'awareness',
  CONSIDERATION = 'consideration',
  DECISION = 'decision',
  PURCHASE = 'purchase',
  RETENTION = 'retention',
  ADVOCACY = 'advocacy'
}

export interface IntentProgressionItem {
  timestamp: Date;
  intent: CustomerIntent;
  confidence: number;
  context: string;
  triggeredBy: string;
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  condition: string;
  action: string;
  appliedAt: Date;
  result: RuleResult;
}

export enum RuleResult {
  SUCCESS = 'success',
  SKIPPED = 'skipped',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

export interface PersonalizationData {
  segments: string[];
  preferences: Record<string, unknown>;
  recommendations: RecommendationItem[];
  dynamicContent: DynamicContentRule[];
  behavioralTriggers: BehavioralTrigger[];
}

export interface RecommendationItem {
  itemId: string;
  itemType: string;
  title: string;
  relevanceScore: number;
  reason: string;
  imageUrl?: string;
  actionUrl?: string;
}

export interface DynamicContentRule {
  ruleId: string;
  contentType: string;
  conditions: RuleCondition[];
  content: unknown;
  priority: number;
  fallbackContent?: unknown;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface BehavioralTrigger {
  triggerId: string;
  event: string;
  conditions: RuleCondition[];
  actions: TriggerAction[];
  cooldown: number;
  lastTriggered?: Date;
}

export interface TriggerAction {
  type: string;
  parameters: Record<string, unknown>;
  delay?: number;
}

export interface AIAssistData {
  suggestions: AISuggestion[];
  drafts: DraftMessage[];
  knowledgeSearches: KnowledgeSearchResult[];
  translations: TranslationCache[];
  sentimentAlerts: SentimentAlert[];
  automationTriggers: AutomationTrigger[];
  performanceInsights: PerformanceInsight[];
  coachingTips: CoachingTip[];
}

export interface AISuggestion {
  suggestionId: string;
  type: SuggestionType;
  content: string;
  confidence: number;
  sources: SourceReference[];
  context: SuggestionContext;
  isAccepted: boolean;
  acceptedAt?: Date;
  rejectedReason?: string;
  generatedAt: Date;
}

export enum SuggestionType {
  RESPONSE_SUGGESTION = 'response_suggestion',
  KNOWLEDGE_ARTICLE = 'knowledge_article',
  MACRO_SUGGESTION = 'macro_suggestion',
  SENTIMENT_GUIDANCE = 'sentiment_guidance',
  NEXT_BEST_ACTION = 'next_best_action',
  UPSELL_CROSS_SELL = 'upsell_cross_sell',
  PROACTIVE_MESSAGE = 'proactive_message',
  ESCALATION_RECOMMENDATION = 'escalation_recommendation'
}

export interface SourceReference {
  type: SourceType;
  id: string;
  title: string;
  url?: string;
  relevance: number;
  snippet?: string;
}

export interface SuggestionContext {
  conversationPhase: ConversationPhase;
  customerIntent: CustomerIntent;
  messageHistory: string[];
  customerProfile: Partial<CustomerProfile>;
  businessRules: string[];
  timeConstraints?: TimeConstraint;
}

export interface TimeConstraint {
  maxResponseTime: number;
  urgency: UrgencyLevel;
  deadline?: Date;
}

export interface DraftMessage {
  draftId: string;
  content: string;
  type: MessageType;
  channel: ChannelType;
  tone: ToneStyle;
  personalizationLevel: PersonalizationLevel;
  variables: TemplateVariable[];
  preview: string;
  createdAt: Date;
  lastModified: Date;
  isAutoSaved: boolean;
}

export enum ToneStyle {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  EMPATHETIC = 'empathetic',
  FORMAL = 'formal',
  CASUAL = 'casual',
  CONFIDENT = 'confident',
  APOLOGETIC = 'apologetic'
}

export enum PersonalizationLevel {
  NONE = 'none',
  BASIC = 'basic',
  MODERATE = 'moderate',
  HIGH = 'high',
  HYPER_PERSONALIZED = 'hyper_personalized'
}

export interface TemplateVariable {
  name: string;
  value: string;
  type: VariableType;
  isRequired: boolean;
  defaultValue?: string;
  validation?: ValidationRule;
}

export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  CUSTOM = 'custom'
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowedValues?: string[];
  errorMessage: string;
}

export interface KnowledgeSearchResult {
  searchId: string;
  query: string;
  results: KnowledgeArticle[];
  totalCount: number;
  searchTime: number;
  filtersApplied: FilterApplied[];
  relevanceThreshold: number;
  usedForResponse: boolean;
  feedback?: SearchFeedback;
}

export interface KnowledgeArticle {
  articleId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  confidence: number;
  lastUpdated: Date;
  version: number;
  author: string;
  status: ArticleStatus;
  language: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedArticles: string[];
  attachments: string[];
  metadata: Record<string, unknown>;
}

export enum ArticleStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated'
}

export interface FilterApplied {
  field: string;
  value: string;
  operator: string;
}

export interface SearchFeedback {
  wasHelpful: boolean;
  selectedArticleId?: string;
  comment?: string;
  submittedAt: Date;
}

export interface TranslationCache {
  cacheId: string;
  originalText: string;
  originalLanguage: string;
  translatedText: string;
  targetLanguage: string;
  service: string;
  cachedAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastUsedAt: Date;
}

export interface SentimentAlert {
  alertId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  score: number;
  threshold: number;
  trend: TrendDirection;
  suggestedAction: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  triggeredAt: Date;
}

export enum AlertType {
  SENTIMENT_DROP = 'sentiment_drop',
  NEGATIVE_SPIKE = 'negative_spike',
  FRUSTRATION_DETECTED = 'frustration_detected',
  CHURN_RISK = 'churn_rISK',
  VIP_ALERT = 'vip_alert',
  COMPLAINT_KEYWORD = 'complaint_keyword',
  COMPETITOR_MENTION = 'competitor_mention',
  LEGAL_RISK = 'legal_risk'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface AutomationTrigger {
  triggerId: string;
  name: string;
  type: AutomationType;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  status: AutomationStatus;
  lastTriggered?: Date;
  executionCount: number;
  successRate: number;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export enum AutomationType {
  MESSAGE_BASED = 'message_based',
  TIME_BASED = 'time_based',
  EVENT_BASED = 'event_based',
  BEHAVIORAL = 'behavioral',
  EXTERNAL = 'external'
}

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicOperator: LogicOperator;
}

export interface AutomationAction {
  type: ActionType;
  parameters: Record<string, unknown>;
  order: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export enum ActionType {
  SEND_MESSAGE = 'send_message',
  ASSIGN_AGENT = 'assign_agent',
  CHANGE_PRIORITY = 'change_priority',
  ADD_TAG = 'add_tag',
  UPDATE_FIELD = 'update_field',
  TRIGGER_WEBHOOK = 'trigger_webhook',
  CREATE_TICKET = 'create_ticket',
  SEND_EMAIL = 'send_email',
  UPDATE_CRM = 'update_crm',
  CALL_API = 'call_api',
  EXECUTE_MACRO = 'execute_macro',
  ROUTE_TO_QUEUE = 'route_to_queue',
  SET_VARIABLE = 'set_variable'
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export enum AutomationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  ERROR = 'error'
}

export interface PerformanceInsight {
  insightId: string;
  category: InsightCategory;
  title: string;
  description: string;
  metric: MetricReference;
  benchmark: BenchmarkData;
  trend: TrendData;
  recommendation: string;
  impact: ImpactAssessment;
  priority: PriorityLevel;
  actionable: boolean;
  generatedAt: Date;
  validUntil: Date;
}

export enum InsightCategory {
  RESPONSE_TIME = 'response_time',
  QUALITY = 'quality',
  EFFICIENCY = 'efficiency',
  SATISFACTION = 'satisfaction',
  ADHERENCE = 'adherence',
  COACHING = 'coaching',
  FORECASTING = 'forecasting',
  ANOMALY = 'anomaly'
}

export interface MetricReference {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  period: Period;
}

export enum Period {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface BenchmarkData {
  teamAverage: number;
  topPerformer: number;
  industryAverage: number;
  historicalBest: number;
  percentile: number;
}

export interface CoachingTip {
  tipId: string;
  category: CoachingCategory;
  title: string;
  description: string;
  example: string;
  bestPractice: string;
  commonMistake: string;
  resources: ResourceLink[];
  difficulty: DifficultyLevel;
  estimatedImprovement: ImprovementEstimate;
  applicableRoles: string[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export enum CoachingCategory {
  COMMUNICATION = 'communication',
  EMPATHY = 'empathy',
  PRODUCT_KNOWLEDGE = 'product_knowledge',
  EFFICIENCY = 'efficiency',
  PROBLEM_SOLVING = 'problem_solving',
  UPSELLING = 'upselling',
  DE_ESCALATION = 'de_escalation',
  ACTIVE_LISTENING = 'active_listening',
  TIME_MANAGEMENT = 'time_management',
  WRITING_SKILLS = 'writing_skills'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface ImprovementEstimate {
  metric: string;
  current_value: number;
  potential_improvement: number;
  timeframe: string;
  confidence: ConfidenceLevel;
}

export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface ResourceLink {
  title: string;
  url: string;
  type: ResourceType;
  duration?: number;
  description?: string;
}

export enum ResourceType {
  ARTICLE = 'article',
  VIDEO = 'video',
  COURSE = 'course',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  INTERACTIVE = 'interactive',
  EXTERNAL = 'external'
}

export interface TransferRecord {
  transferId: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  reason: TransferReason;
  notes: string;
  timestamp: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  warmTransfer: boolean;
  contextShared: boolean;
}

export enum TransferReason {
  SPECIALIST_NEEDED = 'specialist_needed',
  WORKLOAD_BALANCING = 'workload_balancing',
  LANGUAGE_PREFERENCE = 'language_preference',
  AUTHORIZATION_REQUIRED = 'authorization_required',
  TECHNICAL_ISSUE = 'technical_issue',
  CUSTOMER_REQUEST = 'customer_request',
  ESCALATION = 'escalation',
  SHIFT_END = 'shift_end',
  OTHER = 'other'
}
