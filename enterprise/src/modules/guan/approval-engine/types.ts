export enum ApprovalType {
  EXPENSE_REIMBURSEMENT = 'expense_reimbursement',
  LEAVE_REQUEST = 'leave_request',
  PURCHASE_ORDER = 'purchase_order',
  BUDGET_APPROVAL = 'budget_approval',
  CONTRACT_SIGNING = 'contract_signing',
  HIRING_REQUEST = 'hiring_request',
  SALARY_ADJUSTMENT = 'salary_adjustment',
  PROMOTION = 'promotion',
  ASSET_REQUEST = 'asset_request',
  TRAVEL_REQUEST = 'travel_request',
  OVERTIME_REQUEST = 'overtime_request',
  WORK_FROM_HOME = 'work_from_home',
  DOCUMENT_APPROVAL = 'document_approval',
  POLICY_EXCEPTION = 'policy_exception',
  CUSTOM = 'custom'
}

export enum ApprovalStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  EXPIRED = 'expired',
  WITHDRAWN = 'withdrawn'
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum UrgencyLevel {
  ROUTINE = 'routine',
  STANDARD = 'standard',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface ApprovalRequest {
  id: string;
  requestNumber: string;
  type: ApprovalType;
  title: string;
  description: string;
  submitterId: string;
  submitterName: string;
  submitterDepartment: string;
  submitterPosition: string;
  organizationId: string;
  amount?: number;
  currency?: string;
  priority: Priority;
  urgency: UrgencyLevel;
  status: ApprovalStatus;
  currentStep: number;
  totalSteps: number;
  currentApproverIds: string[];
  route: ApprovalRoute;
  attachments: Attachment[];
  formData: FormDataField[];
  customFields: CustomField[];
  metadata: RequestMetadata;
  complianceInfo: ComplianceCheckResult;
  auditTrail: AuditTrailEntry[];
  comments: Comment[];
  deadline?: Date;
  submittedAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
  estimatedCompletionTime?: number;
  actualProcessingTime?: number;
  version: number;
  parentRequestId?: string;
  childRequests?: string[];
  tags: string[];
  category?: string;
  costCenter?: string;
  projectCode?: string;
  budgetCode?: string;
  relatedDocuments?: string[];
  externalReferences?: ExternalReference[];
}

export interface ApprovalRoute {
  id: string;
  name: string;
  type: RouteType;
  steps: ApprovalStep[];
  isParallelAllowed: boolean;
  isConditionalRouting: boolean;
  escalationRules: EscalationRule[];
  slaSettings: SLASetting;
  version: number;
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
}

export enum RouteType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  HIERARCHICAL = 'hierarchical',
  MATRIX = 'matrix',
  CONDITIONAL = 'conditional',
  HYBRID = 'hybrid'
}

export interface ApprovalStep {
  stepNumber: number;
  stepType: StepType;
  approverType: ApproverType;
  approvers: ApproverAssignment[];
  actionRequired: ActionRequired;
  conditions?: StepCondition[];
  timeoutHours: number;
  escalationAction?: EscalationAction;
  canDelegate: boolean;
  canAddApprover: boolean;
  requireComment: boolean;
  requireAttachment: boolean;
  notificationSettings: StepNotification;
  slaTarget: number;
  isOptional: boolean;
  skipCondition?: SkipCondition;
}

export enum StepType {
  REVIEW = 'review',
  APPROVE = 'approve',
  NOTIFY = 'notify',
  SIGN = 'sign',
  COUNTER_SIGN = 'counter_sign',
  FYI = 'fyi',
  CONSULT = 'consult',
  AUTO_APPROVE = 'auto_approve'
}

export enum ApproverType {
  SPECIFIC_USER = 'specific_user',
  ROLE = 'role',
  POSITION = 'position',
  DEPARTMENT_HEAD = 'department_head',
  MANAGER = 'manager',
  DYNAMIC = 'dynamic',
  SYSTEM = 'system',
  EXTERNAL = 'external'
}

export interface ApproverAssignment {
  id: string;
  type: ApproverType;
  referenceId: string;
  name: string;
  isPrimary: boolean;
  isBackup: boolean;
  order: number;
  weight: number;
  delegationInfo?: DelegationInfo;
  availability: AvailabilityStatus;
  workload: WorkloadInfo;
}

export interface DelegationInfo {
  delegatedFrom: string;
  delegatedTo: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  isPermanent: boolean;
  scope: DelegationScope;
}

export enum DelegationScope {
  ALL_APPROVALS = 'all_approvals',
  SPECIFIC_TYPES = 'specific_types',
  SPECIFIC_AMOUNTS = 'specific_amounts',
  DEPARTMENT_ONLY = 'department_only'
}

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OUT_OF_OFFICE = 'out_of_office',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive'
}

export interface WorkloadInfo {
  pendingApprovals: number;
  averageProcessingTime: number;
  utilizationRate: number;
  lastProcessedAt?: Date;
}

export enum ActionRequired {
  APPROVE_OR_REJECT = 'approve_or_reject',
  REVIEW_AND_FORWARD = 'review_and_forward',
  COMMENT_ONLY = 'comment_only',
  ACKNOWLEDGE = 'acknowledge',
  PROVIDE_INPUT = 'provide_input',
  VERIFY = 'verify',
  ENDORSE = 'endorse'
}

export interface StepCondition {
  id: string;
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicOperator: LogicOperator;
  description: string;
}

export enum ConditionType {
  AMOUNT = 'amount',
  CATEGORY = 'category',
  DEPARTMENT = 'department',
  SUBMITTER_ROLE = 'submitter_role',
  URGENCY = 'urgency',
  CUSTOM_FIELD = 'custom_field',
  TIME_BASED = 'time_based',
  APPROVAL_HISTORY = 'approval_history'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IN = 'in',
  NOT_IN = 'not_in',
  BETWEEN = 'between',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex'
}

export enum LogicOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

export interface SkipCondition {
  type: SkipType;
  condition: StepCondition;
  skipToStep?: number;
  autoApprove?: boolean;
  notifySkippedApprovers: boolean;
}

export enum SkipType {
  ALWAYS_SKIP = 'always_skip',
  CONDITIONAL_SKIP = 'conditional_skip',
  PREVIOUSLY_APPROVED = 'previously_approved',
  BELOW_THRESHOLD = 'below_threshold'
}

export interface EscalationRule {
  ruleId: string;
  triggerCondition: TriggerCondition;
  escalateTo: EscalationTarget;
  action: EscalationAction;
  notificationTemplate: string;
  isActive: boolean;
}

export interface TriggerCondition {
  type: TriggerType;
  threshold: number;
  unit: TimeUnit;
  includeNonWorkingHours: boolean;
}

export enum TriggerType {
  TIMEOUT = 'timeout',
  NO_RESPONSE = 'no_response',
  STEP_STUCK = 'step_stuck',
  MANUAL_TRIGGER = 'manual_trigger'
}

export enum TimeUnit {
  HOURS = 'hours',
  DAYS = 'days',
  BUSINESS_DAYS = 'business_days'
}

export interface EscalationTarget {
  type: EscalationTargetType;
  targetId: string;
  targetName: string;
  backupTargets?: EscalationTarget[];
}

export enum EscalationTargetType {
  MANAGER = 'manager',
  DEPARTMENT_HEAD = 'department_head',
  ROLE = 'role',
  SPECIFIC_USER = 'specific_user',
  ADMIN = 'admin',
  ESCALATION_COMMITTEE = 'escalation_committee'
}

export enum EscalationAction {
  REASSIGN = 'reassign',
  ADD_APPROVER = 'add_approver',
  AUTO_APPROVE = 'auto_approve',
  AUTO_REJECT = 'auto_reject',
  ESCALATE_TO_MANAGER = 'escalate_to_manager',
  NOTIFY_ADMIN = 'notify_admin',
  CANCEL_REQUEST = 'cancel_request'
}

export interface SLASetting {
  overallSLA: number;
  perStepSLA: Record<number, number>;
  workingHoursOnly: boolean;
  holidaysIncluded: boolean;
  gracePeriod: number;
  breachActions: BreachAction[];
}

export interface BreachAction {
  triggerPoint: number;
  action: BreachActionType;
  notifications: NotificationConfig[];
  autoEscalate: boolean;
}

export enum BreachActionType {
  WARNING = 'warning',
  ESCALATE = 'escalate',
  AUTO_DECISION = 'auto_decision',
  NOTIFY_MANAGER = 'notify_manager',
  SUSPEND = 'suspend'
}

export interface StepNotification {
  onAssignment: NotificationConfig;
  onReminder: NotificationConfig;
  onOverdue: NotificationConfig;
  onComplete: NotificationConfig;
  onEscalation: NotificationConfig;
  customNotifications?: CustomNotification[];
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  template: string;
  delayMinutes: number;
  repeatInterval?: number;
  maxRetries: number;
  includeDetails: boolean;
  ccRecipients?: string[];
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SMS = 'sms',
  WECHAT = 'wechat',
  SLACK = 'slack',
  WEBHOOK = 'webhook'
}

export interface CustomNotification {
  trigger: CustomNotificationTrigger;
  config: NotificationConfig;
}

export enum CustomNotificationTrigger {
  ON_STATUS_CHANGE = 'on_status_change',
  ON_COMMENT = 'on_comment',
  ON_ATTACHMENT = 'on_attachment',
  ON_DEADLINE_APPROACHING = 'on_deadline_approaching',
  CUSTOM_EVENT = 'custom_event'
}

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  size: number;
  mimeType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  version: number;
  isRequired: boolean;
  status: AttachmentStatus;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadCount: number;
  virusScanStatus: VirusScanStatus;
  retentionPolicy: RetentionPolicy;
}

export enum AttachmentType {
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  ID_DOCUMENT = 'id_document',
  PHOTO = 'photo',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other'
}

export enum AttachmentStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  AVAILABLE = 'available',
  ERROR = 'error',
  DELETED = 'deleted',
  QUARANTINED = 'quarantined'
}

export enum VirusScanStatus {
  PENDING = 'pending',
  SCANNING = 'scanning',
  CLEAN = 'clean',
  INFECTED = 'infected',
  ERROR = 'error',
  SKIPPED = 'skipped'
}

export interface RetentionPolicy {
  retainAfterApproval: boolean;
  retainAfterRejection: number;
  autoArchive: boolean;
  archiveAfterDays: number;
  deleteAfterDays: number;
  legalHold: boolean;
}

export interface FormDataField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  value: unknown;
  defaultValue?: unknown;
  required: boolean;
  readonly: boolean;
  visible: boolean;
  validation: FieldValidation;
  options?: FieldOption[];
  conditionalVisibility?: ConditionalVisibility;
  calculationFormula?: string;
  dataSource?: string;
  helpText?: string;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  dependsOn?: string[];
}

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  CURRENCY = 'currency',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  FILE_UPLOAD = 'file_upload',
  SIGNATURE = 'signature',
  RICH_TEXT = 'rich_text',
  USER_SELECTOR = 'user_selector',
  ORGANIZATION_SELECTOR = 'organization_selector',
  CALCULATED = 'calculated',
  HIDDEN = 'hidden',
  SECTION_HEADER = 'section_header'
}

export interface FieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
  errorMessage?: string;
}

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: string;
  color?: string;
}

export interface ConditionalVisibility {
  showWhen: ConditionalRule[];
  logicOperator: LogicOperator;
}

export interface ConditionalRule {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  value: unknown;
  label: string;
  category: string;
  isSearchable: boolean;
  isFilterable: boolean;
  isVisibleInList: boolean;
  validation: FieldValidation;
  options?: FieldOption[];
}

export interface RequestMetadata {
  source: RequestSource;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  location?: GeoLocation;
  session_id?: string;
  correlationId?: string;
  tags: string[];
  customAttributes: Record<string, unknown>;
}

export enum RequestSource {
  WEB_PORTAL = 'web_portal',
  MOBILE_APP = 'mobile_app',
  API = 'api',
  EMAIL = 'email',
  INTEGRATION = 'integration',
  BATCH_IMPORT = 'batch_import',
  VOICE_COMMAND = 'voice_command',
  CHATBOT = 'chatbot',
  IOT_DEVICE = 'iot_device'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
  SMART_TV = 'smart_tv',
  OTHER = 'other'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  accuracy?: number;
}

export interface ComplianceCheckResult {
  isChecked: boolean;
  status: ComplianceStatus;
  score: number;
  checks: ComplianceCheck[];
  violations: ComplianceViolation[];
  remediationActions: RemediationAction[];
  approvedBy?: string;
  approvedAt?: Date;
  nextReviewDate?: Date;
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review',
  EXCEPTION_GRANTED = 'exception_granted',
  WAIVED = 'waived',
  NOT_APPLICABLE = 'not_applicable'
}

export interface ComplianceCheck {
  checkId: string;
  name: string;
  category: ComplianceCategory;
  description: string;
  severity: ComplianceSeverity;
  status: CheckStatus;
  result: CheckResult;
  details: string;
  evidence?: string;
  checkedAt: Date;
  checkedBy: string;
  referenceDocument?: string;
}

export enum ComplianceCategory {
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  REGULATORY = 'regulatory',
  OPERATIONAL = 'operational',
  SECURITY = 'security',
  PRIVACY = 'privacy',
  ENVIRONMENTAL = 'environmental',
  ETHICS = 'ethics',
  INDUSTRY_SPECIFIC = 'industry_specific',
  INTERNAL_POLICY = 'internal_policy'
}

export enum ComplianceSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFORMATIONAL = 'informational'
}

export enum CheckStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  SKIPPED = 'skipped',
  ERROR = 'error',
  PENDING = 'pending'
}

export interface CheckResult {
  passed: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  findings: Finding[];
  recommendations: string[];
}

export interface Finding {
  id: string;
  type: FindingType;
  severity: ComplianceSeverity;
  description: string;
  evidence: string;
  location: string;
  remediation: string;
  owner: string;
  dueDate?: Date;
  status: FindingStatus;
}

export enum FindingType {
  VIOLATION = 'violation',
  OBSERVANCE = 'observance',
  GAP = 'gap',
  RISK = 'risk',
  OPPORTUNITY = 'opportunity'
}

export enum FindingStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  REMEDIATED = 'remediated',
  ACCEPTED_RISK = 'accepted_risk',
  FALSE_POSITIVE = 'false_positive',
  DEFERRED = 'deferred'
}

export interface ComplianceViolation {
  violationId: string;
  ruleId: string;
  ruleName: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  impact: ImpactAssessment;
  detectedAt: Date;
  reportedBy: string;
  status: ViolationStatus;
  resolution?: ViolationResolution;
  penalties?: Penalty[];
  auditTrail: ViolationAuditEntry[];
}

export interface ImpactAssessment {
  financialImpact: number;
  reputationalImpact: ImpactLevel;
  operationalImpact: ImpactLevel;
  legalImpact: ImpactLevel;
  overallRiskScore: number;
}

export enum ImpactLevel {
  NEGLIGIBLE = 'negligible',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SEVERE = 'severe',
  CATASTROPHIC = 'catastrophic'
}

export enum ViolationStatus {
  OPEN = 'open',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  DISMISSED = 'dismissed',
  APPEALED = 'appealed'
}

export interface ViolationResolution {
  resolvedBy: string;
  resolvedAt: Date;
  resolutionType: ResolutionType;
  description: string;
  correctiveActions: CorrectiveAction[];
  preventiveMeasures: PreventiveMeasure[];
  effectiveness: EffectivenessLevel;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export enum ResolutionType {
  IMMEDIATE_CORRECTION = 'immediate_correction',
  PROCESS_CHANGE = 'process_change',
  SYSTEM_UPDATE = 'system_update',
  TRAINING = 'training',
  POLICY_UPDATE = 'policy_update',
  EXCEPTION_GRANTED = 'exception_granted',
  PENALTY_APPLIED = 'penalty_applied'
}

export interface CorrectiveAction {
  actionId: string;
  description: string;
  owner: string;
  dueDate: Date;
  status: ActionItemStatus;
  completedAt?: Date;
  evidence?: string;
}

export interface PreventiveMeasure {
  measureId: string;
  description: string;
  owner: string;
  implementationDate: Date;
  effectiveness: EffectivenessLevel;
  monitoringFrequency: string;
}

export enum EffectivenessLevel {
  HIGHLY_EFFECTIVE = 'highly_effective',
  EFFECTIVE = 'effective',
  PARTIALLY_EFFECTIVE = 'partially_effective',
  INEFFECTIVE = 'ineffective',
  UNKNOWN = 'unknown'
}

export interface Penalty {
  penaltyId: string;
  type: PenaltyType;
  amount: number;
  currency: string;
  description: string;
  appliedBy: string;
  appliedAt: Date;
  appealable: boolean;
  appealDeadline?: Date;
  status: PenaltyStatus;
}

export enum PenaltyType {
  FINE = 'fine',
  WARNING = 'warning',
  SUSPENSION = 'suspENSION',
  REVOCATION = 'revocation',
  DEMOTION = 'demotion',
  TERMINATION = 'termination',
  OTHER = 'other'
}

export enum PenaltyStatus {
  APPLIED = 'applied',
  APPEALED = 'appealed',
  REDUCED = 'reduced',
  WAIVED = 'waived',
  OVERTURNED = 'overturned'
}

export interface ViolationAuditEntry {
  entryId: string;
  timestamp: Date;
  action: AuditAction;
  performedBy: string;
  details: string;
  previousStatus: ViolationStatus;
  newStatus: ViolationStatus;
  attachments?: string[];
}

export interface RemediationAction {
  actionId: string;
  priority: Priority;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: RemediationStatus;
  progress: number;
  estimatedEffort: EffortEstimate;
  dependencies: string[];
  resources: ResourceAllocation[];
}

export enum RemediationStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred'
}

export interface EffortEstimate {
  minHours: number;
  maxHours: number;
  confidence: ConfidenceLevel;
  skillRequired: SkillRequirement[];
}

export interface SkillRequirement {
  skill: string;
  proficiency: ProficiencyLevel;
  isMandatory: boolean;
}

export interface ResourceAllocation {
  type: ResourceType;
  name: string;
  quantity: number;
  allocatedTo: string;
  startDate: Date;
  endDate: Date;
  cost: number;
  status: AllocationStatus;
}

export enum AllocationStatus {
  PLANNED = 'planned',
  ALLOCATED = 'allocated',
  IN_USE = 'in_use',
  RELEASED = 'released',
  OVERALLOCATED = 'overallocated',
  CANCELLED = 'cancelled'
}

export interface AuditTrailEntry {
  entryId: string;
  timestamp: Date;
  action: TrailAction;
  performedBy: string;
  performerRole: string;
  performerDepartment: string;
  previousStatus: ApprovalStatus;
  newStatus: ApprovalStatus;
  stepNumber: number;
  comment?: string;
  attachmentIds?: string[];
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  systemNotes?: string;
  externalSystemReference?: string;
  metadata?: Record<string, unknown>;
}

export enum TrailAction {
  CREATED = 'created',
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  VIEWED = 'viewed',
  REVIEW_STARTED = 'review_started',
  COMMENTED = 'commented',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  FORWARDED = 'forwarded',
  DELEGATED = 'delegated',
  ESCALATED = 'escalated',
  REASSIGNED = 'reassigned',
  CANCELLED = 'cancelled',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  RESTORED = 'restored',
  EXPORTED = 'exported',
  PRINTED = 'printed',
  SIGNED = 'signed',
  COUNTER_SIGNED = 'counter_signed',
  SYSTEM_ACTION = 'system_action'
}

export interface Comment {
  commentId: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  contentType: ContentType;
  isPrivate: boolean;
  isInternal: boolean;
  mentions: string[];
  attachments: string[];
  parentId?: string;
  replies: string[];
  reactions: Reaction[];
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedBy?: string;
  deletedAt?: Date;
}

export enum ContentType {
  TEXT = 'text',
  RICH_TEXT = 'rich_text',
  CODE = 'code',
  QUOTE = 'quote'
}

export interface Reaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface ExternalReference {
  referenceId: string;
  systemName: string;
  systemType: SystemType;
  externalId: string;
  externalUrl: string;
  syncStatus: SyncStatus;
  lastSyncedAt: Date;
  mapping: FieldMapping[];
  errorLog?: string;
}

export enum SystemType {
  ERP = 'erp',
  CRM = 'crm',
  HRMS = 'hrms',
  FINANCIAL = 'financial',
  PROCUREMENT = 'procurement',
  PROJECT_MANAGEMENT = 'project_management',
  DOCUMENT_MANAGEMENT = 'document_management',
  EMAIL = 'email',
  CUSTOM = 'custom'
}

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CONFLICT = 'conflict'
}

export interface FieldMapping {
  localField: string;
  externalField: string;
  transformation?: TransformationRule;
  isRequired: boolean;
}

export interface TransformationRule {
  type: TransformationType;
  parameters: Record<string, unknown>;
  validation?: ValidationRule;
}

export enum TransformationType {
  DIRECT_MAPPING = 'direct_mapping',
  FORMAT_CONVERSION = 'format_conversion',
  VALUE_MAPPING = 'value_mapping',
  CALCULATION = 'calculation',
  CONCATENATION = 'concatenation',
  CONDITIONAL = 'conditional',
  LOOKUP = 'lookup',
  CUSTOM_FUNCTION = 'custom_function'
}

export interface ValidationRule {
  type: ValidationType;
  parameters: Record<string, unknown>;
  errorMessage: string;
}

export enum ValidationType {
  REQUIRED = 'required',
  TYPE_CHECK = 'type_check',
  RANGE_CHECK = 'range_check',
  PATTERN_MATCH = 'pattern_match',
  CUSTOM = 'custom'
}
