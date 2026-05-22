import * as react_jsx_runtime from 'react/jsx-runtime';
import { AgentDefinition } from '@yyc3/core/ai-family';

interface AIFamilyPanelProps {
    className?: string;
    showHeader?: boolean;
    defaultView?: 'home' | 'members' | 'settings';
}
declare function AIFamilyPanel({ className, showHeader, defaultView }: AIFamilyPanelProps): react_jsx_runtime.JSX.Element;

interface FamilyLayoutProps {
    showHeader?: boolean;
    defaultView?: 'home' | 'members' | 'settings';
}
declare function FamilyLayout({ showHeader, defaultView }: FamilyLayoutProps): react_jsx_runtime.JSX.Element;

declare function FamilyHome(): react_jsx_runtime.JSX.Element;

declare function FamilyMembers(): react_jsx_runtime.JSX.Element;

interface AgentCardProps {
    agent: AgentDefinition;
    onClick?: () => void;
    showCapabilities?: boolean;
}
declare function AgentCard({ agent, onClick, showCapabilities }: AgentCardProps): react_jsx_runtime.JSX.Element;

interface AgentStatusInfo {
    id: string;
    name: string;
    status: 'idle' | 'busy' | 'error';
    currentTask?: string;
    lastActivity?: Date;
}
declare function AgentStatus(): react_jsx_runtime.JSX.Element;

export { AIFamilyPanel, type AIFamilyPanelProps, AgentCard, type AgentCardProps, AgentStatus, type AgentStatusInfo, FamilyHome, FamilyLayout, type FamilyLayoutProps, FamilyMembers };
