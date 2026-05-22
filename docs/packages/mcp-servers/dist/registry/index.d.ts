import { MCPServerDefinition, MCPTool } from '../types/index.js';

declare const SERVER_DEFINITIONS: MCPServerDefinition[];
declare function getServerDefinition(id: string): MCPServerDefinition | undefined;
declare function getServersByCategory(category: MCPServerDefinition["category"]): MCPServerDefinition[];
declare function getAllTools(): MCPTool[];
declare function getToolByName(toolName: string): MCPTool | undefined;

export { SERVER_DEFINITIONS, getAllTools, getServerDefinition, getServersByCategory, getToolByName };
