import { createUserContent, GoogleGenAI } from "@google/genai";
import { task } from "@trigger.dev/sdk/v3";

import {
  llmNodeTaskPayloadSchema,
  remoteNodeTaskResultSchema,
  type LlmNodeTaskPayload,
} from "../shared/contracts";
import { resolveGeminiModelId } from "../shared/gemini-models";
import { resolveMediaReference } from "../shared/media";

export const llmNodeTask = task({
  id: "llm-node-task",
  run: async (payload: LlmNodeTaskPayload) => {
    const startedAt = Date.now();
    const input = llmNodeTaskPayloadSchema.parse(payload);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing for the LLM Trigger.dev task.");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const imageParts = await Promise.all(
      input.imageInputs.map(async (reference) => {
        const media = await resolveMediaReference(reference, "image/png");

        return {
          inlineData: {
            data: media.buffer.toString("base64"),
            mimeType: media.mimeType,
          },
        };
      }),
    );

    const response = await ai.models.generateContent({
      config: input.systemPrompt
        ? {
            systemInstruction: input.systemPrompt,
          }
        : undefined,
      contents: createUserContent([
        ...imageParts,
        {
          text: input.userMessage,
        },
      ]),
      model: resolveGeminiModelId(input.modelId),
    });

    const outputText = response.text?.trim() || "Gemini returned an empty response.";

    return remoteNodeTaskResultSchema.parse({
      dataPatch: {
        resultText: outputText,
      },
      durationMs: Date.now() - startedAt,
      inputSummary: `Model: ${resolveGeminiModelId(input.modelId)} | Images: ${input.imageInputs.length} | User message: ${input.userMessage}`,
      nodeId: input.nodeId,
      nodeTitle: input.nodeTitle,
      nodeType: "run-llm",
      outputSummary: outputText,
      outputValue: outputText,
      summary: input.systemPrompt
        ? `Generated text with ${input.imageInputs.length} image input(s) and a system prompt.`
        : `Generated text with ${input.imageInputs.length} image input(s).`,
    });
  },
});
