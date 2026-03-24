import {
  executionPlanSchema,
  workflowRunItemSchema,
} from "@/lib/execution/schemas";
import { formatDurationLabel } from "@/lib/execution/formatters";
import { getResolvedInputValue } from "@/lib/execution/node-inputs";
import { getExecutionBatches, resolveExecutionNodeIds } from "@/lib/editor/graph-utils";
import type { WorkflowEdge, WorkflowNode, WorkflowNodeData } from "@/types/editor";
import type {
  NodeRunRecord,
  WorkflowRunItem,
  WorkflowRunScope,
} from "@/types/workflow";

type NodeOutputValue = string | string[];

export type SimulatedNodeResult = {
  dataPatch?: Partial<WorkflowNodeData>;
  dependencyNodeIds?: string[];
  durationMs: number;
  errorMessage?: string;
  inputSummary?: string;
  outputValue?: NodeOutputValue;
  outputSummary?: string;
  status: "failed" | "success";
  summary: string;
};

type BuildExecutionPlanInput = {
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
  scope: WorkflowRunScope;
};

type SimulateNodeInput = {
  edges: WorkflowEdge[];
  node: WorkflowNode;
  outputs: Map<string, NodeOutputValue>;
};

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function createMockNodeDelay(kind: WorkflowNode["data"]["kind"]) {
  switch (kind) {
    case "crop-image":
    case "extract-frame":
      return 850;
    case "run-llm":
      return 1000;
    case "upload-image":
    case "upload-video":
      return 300;
    case "text":
      return 120;
  }
}

export function buildExecutionPlan({
  edges,
  nodes,
  scope,
}: BuildExecutionPlanInput) {
  const includedNodeIds = resolveExecutionNodeIds(nodes, edges, scope);
  const batches = getExecutionBatches(nodes, edges, includedNodeIds);

  return executionPlanSchema.parse({
    batches,
    includedNodeIds,
    scope,
  });
}

export async function simulateNodeExecution({
  edges,
  node,
  outputs,
}: SimulateNodeInput): Promise<SimulatedNodeResult> {
  const startedAt = performance.now();
  await wait(createMockNodeDelay(node.data.kind));

  switch (node.data.kind) {
    case "text": {
      const value = node.data.textValue?.trim() ?? "";
      return {
        durationMs: Math.round(performance.now() - startedAt),
        inputSummary: value ? `Text node emitted: "${value}"` : "No text provided.",
        outputSummary: value || "(blank text)",
        outputValue: value,
        status: "success",
        summary: value ? "Text value emitted." : "Blank text emitted.",
      };
    }
    case "upload-image": {
      const outputValue =
        node.data.mediaUrl ||
        node.data.mediaDataUrl ||
        node.data.previewUrl ||
        "mock://assets/product-image-placeholder.png";
      return {
        durationMs: Math.round(performance.now() - startedAt),
        inputSummary: node.data.mediaName
          ? `Selected file: ${node.data.mediaName}`
          : "No local image selected.",
        outputSummary: outputValue,
        outputValue,
        status: "success",
        summary: node.data.previewUrl
          ? "Local image prepared for downstream nodes."
          : "Mock product image emitted for local execution.",
      };
    }
    case "upload-video": {
      const outputValue =
        node.data.mediaUrl ||
        node.data.mediaDataUrl ||
        node.data.previewUrl ||
        "mock://assets/product-video-placeholder.mp4";
      return {
        durationMs: Math.round(performance.now() - startedAt),
        inputSummary: node.data.mediaName
          ? `Selected file: ${node.data.mediaName}`
          : "No local video selected.",
        outputSummary: outputValue,
        outputValue,
        status: "success",
        summary: node.data.previewUrl
          ? "Local video prepared for downstream nodes."
          : "Mock product video emitted for local execution.",
      };
    }
    case "crop-image": {
      const imageInput = getResolvedInputValue(node, "image_url", edges, outputs);

      if (!imageInput) {
        return {
          durationMs: Math.round(performance.now() - startedAt),
          errorMessage: "Crop Image requires an image input.",
          inputSummary: "No image input was connected or entered.",
          status: "failed",
          summary: "Crop Image requires an image input.",
        };
      }

      const x = getResolvedInputValue(node, "x_percent", edges, outputs) ?? "0";
      const y = getResolvedInputValue(node, "y_percent", edges, outputs) ?? "0";
      const width =
        getResolvedInputValue(node, "width_percent", edges, outputs) ?? "100";
      const height =
        getResolvedInputValue(node, "height_percent", edges, outputs) ?? "100";

      return {
        durationMs: Math.round(performance.now() - startedAt),
        inputSummary: `Image: ${String(imageInput)} | x:${x}, y:${y}, w:${width}, h:${height}`,
        outputSummary: `mock://assets/cropped-${node.id}.png`,
        outputValue: `mock://assets/cropped-${node.id}.png`,
        status: "success",
        summary: `Cropped image using x:${x}, y:${y}, w:${width}, h:${height}.`,
      };
    }
    case "extract-frame": {
      const videoInput = getResolvedInputValue(node, "video_url", edges, outputs);

      if (!videoInput) {
        return {
          durationMs: Math.round(performance.now() - startedAt),
          errorMessage: "Extract Frame requires a video input.",
          inputSummary: "No video input was connected or entered.",
          status: "failed",
          summary: "Extract Frame requires a video input.",
        };
      }

      const timestamp =
        getResolvedInputValue(node, "timestamp", edges, outputs) ?? "50%";

      return {
        durationMs: Math.round(performance.now() - startedAt),
        inputSummary: `Video: ${String(videoInput)} | timestamp: ${timestamp}`,
        outputSummary: `mock://assets/frame-${node.id}.png`,
        outputValue: `mock://assets/frame-${node.id}.png`,
        status: "success",
        summary: `Extracted a representative frame at ${timestamp}.`,
      };
    }
    case "run-llm": {
      const systemPrompt =
        getResolvedInputValue(node, "system_prompt", edges, outputs) ??
        node.data.systemPromptValue ??
        "";
      const userMessage =
        getResolvedInputValue(node, "user_message", edges, outputs) ??
        node.data.userMessageValue ??
        "";
      const images = getResolvedInputValue(node, "images", edges, outputs);
      const imageCount = Array.isArray(images)
        ? images.length
        : images
          ? 1
          : 0;

      if (!userMessage) {
        return {
          durationMs: Math.round(performance.now() - startedAt),
          errorMessage: "Run Any LLM requires a user message.",
          inputSummary: "No user_message input was available.",
          status: "failed",
          summary: "Run Any LLM requires a user message.",
        };
      }

      const outputValue =
        node.id === "llm-final"
          ? `Campaign line: Premium sound, polished visuals, and launch-ready energy in one workflow. Inputs: ${imageCount} image signals.`
          : `Premium copy: ${userMessage.slice(0, 88)}${userMessage.length > 88 ? "..." : ""}`;

      return {
        dataPatch: {
          resultText: outputValue,
        },
        durationMs: Math.round(performance.now() - startedAt),
        inputSummary: `Model: ${node.data.modelId ?? "gemini-fast"} | Images: ${imageCount} | User message: ${userMessage}`,
        outputSummary: outputValue,
        outputValue,
        status: "success",
        summary: systemPrompt
          ? `Generated text with ${imageCount} image input(s) and a system prompt.`
          : `Generated text with ${imageCount} image input(s).`,
      };
    }
  }
}

export function createNodeRunRecord({
  durationMs,
  node,
  result,
}: {
  durationMs: number;
  node: WorkflowNode;
  result: SimulatedNodeResult;
}): NodeRunRecord {
  return {
    durationLabel: formatDurationLabel(durationMs),
    durationMs,
    errorMessage: result.errorMessage,
    id: `${node.id}-${Date.now()}`,
    inputSummary: result.inputSummary,
    nodeId: node.id,
    nodeTitle: node.data.title,
    nodeType: node.data.kind,
    outputSummary: result.outputSummary,
    status: result.status,
    summary: result.summary,
    dependencyNodeIds: result.dependencyNodeIds,
  };
}

export function createWorkflowRunItem(input: WorkflowRunItem) {
  return workflowRunItemSchema.parse(input);
}
