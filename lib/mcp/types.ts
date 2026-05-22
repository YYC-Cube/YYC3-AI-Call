export enum MCPMessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error',
}

export enum MCPRole {
  CLIENT = 'client',
  SERVER = 'server',
}

export interface MCPMessage {
  id: string;
  type: MCPMessageType;
  role: MCPRole;
  timestamp: Date;
  payload: any;
  metadata?: {
    source: string;
    destination?: string;
    correlationId?: string;
    priority?: number;
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
  };
  tools?: MCPToolDefinition[];
  resources?: MCPResource[];
}

export interface MCPClientConfig {
  serverUrl: string;
  timeout?: number;
  retryCount?: number;
  auth?: {
    type: 'bearer' | 'api_key' | 'basic';
    credentials: string;
  };
}
