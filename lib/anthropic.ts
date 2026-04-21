import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "missing-key",
});

export const MODEL_DRAFT = "claude-sonnet-4-6";
export const MODEL_VALIDATE = "claude-opus-4-7";
export const MODEL_PARSE = "claude-sonnet-4-6";
