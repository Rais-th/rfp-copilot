import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey && process.env.NODE_ENV === "production") {
  throw new Error("ANTHROPIC_API_KEY is required in production");
}

export const anthropic = new Anthropic({
  apiKey: apiKey ?? "missing-key",
});

export const MODEL_DRAFT = "claude-sonnet-4-6";
export const MODEL_VALIDATE = "claude-opus-4-7";
export const MODEL_PARSE = "claude-sonnet-4-6";
