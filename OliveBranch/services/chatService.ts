/**
 * services/chatService.ts
 * Stub chat service interface for future AI/LLM integration.
 * Currently non-functional and disabled by default (see docs/DEVELOPING.md).
 */

import type { ApiResponse } from '@/types';

export interface ChatRequest {
  prompt: string;
  context?: Record<string, unknown>;
}

export interface ChatResult {
  id?: string;
  text?: string;
  meta?: Record<string, unknown>;
}

const AI_USAGE_ENABLED = process.env.AI_USAGE_ENABLED === 'true';

export async function sendChat(_req: ChatRequest): Promise<ApiResponse<ChatResult>> {
  if (!AI_USAGE_ENABLED) {
    return {
      success: false,
      error: { code: 'AI_DISABLED', message: 'AI features are disabled in this environment.' },
    };
  }

  // Placeholder: integration to be implemented when AI provider and policy are approved.
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Chat service not implemented in MVP.' },
  };
}
