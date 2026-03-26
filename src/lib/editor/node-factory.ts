import { quickNodeCatalog, type QuickNodeType } from "@/lib/editor/node-catalog";
import type {
  NewNodeOptions,
  NodePort,
  PortDataKind,
  StarterFlow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from "@/types/editor";

const catalogByType = Object.fromEntries(
  quickNodeCatalog.map((node) => [node.type, node]),
) as Record<QuickNodeType, (typeof quickNodeCatalog)[number]>;

function withDefinedOverrides<T extends object>(overrides?: Partial<T>) {
  if (!overrides) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function createNodeData(
  kind: QuickNodeType,
  overrides?: Partial<WorkflowNodeData>,
): WorkflowNodeData {
  const catalog = catalogByType[kind];
  const safeOverrides = withDefinedOverrides<WorkflowNodeData>(overrides);

  const shared = {
    kind,
    title: catalog.label,
    description: catalog.description,
    accent: catalog.accent,
    isExpanded: false,
  };

  switch (kind) {
    case "text":
      return {
        ...shared,
        implemented: true,
        helperText: "Text output is ready to feed prompt-style nodes.",
        inputPorts: [],
        outputPorts: [{ id: "text", label: "text", kind: "text" }],
        textValue: "You are a creative marketing assistant.",
        ...safeOverrides,
      };
    case "upload-image":
      return {
        ...shared,
        implemented: true,
        helperText:
          "Local preview plus a portable image payload for downstream Trigger.dev tasks.",
        inputPorts: [],
        outputPorts: [{ id: "image_url", label: "image_url", kind: "image" }],
        mediaAssetId: undefined,
        mediaName: "No image selected",
        mediaDataUrl: undefined,
        mediaMimeType: undefined,
        mediaUrl: undefined,
        ...safeOverrides,
      };
    case "upload-video":
      return {
        ...shared,
        implemented: true,
        helperText:
          "Local preview plus a portable video payload for downstream Trigger.dev tasks.",
        inputPorts: [],
        outputPorts: [{ id: "video_url", label: "video_url", kind: "video" }],
        mediaAssetId: undefined,
        mediaName: "No video selected",
        mediaDataUrl: undefined,
        mediaMimeType: undefined,
        mediaUrl: undefined,
        ...safeOverrides,
      };
    case "run-llm":
      return {
        ...shared,
        implemented: true,
        helperText:
          "Gemini runs through Trigger.dev and renders the result inline on this node.",
        inputPorts: [
          {
            id: "system_prompt",
            label: "system_prompt",
            kind: "text",
            accepts: ["text"],
          },
          {
            id: "user_message",
            label: "user_message",
            kind: "text",
            accepts: ["text"],
            required: true,
          },
          {
            id: "images",
            label: "images",
            kind: "image",
            accepts: ["image"],
            multiple: true,
          },
        ],
        outputPorts: [{ id: "output", label: "output", kind: "text" }],
        modelId: "gemini-fast",
        systemPromptValue: "You are a creative strategist. Keep the output concise.",
        userMessageValue: "Describe this product in a premium, social-ready tone.",
        resultText: "Inline LLM response will render here after execution is connected.",
        ...safeOverrides,
      };
    case "crop-image":
      return {
        ...shared,
        implemented: true,
        helperText:
          "Crop parameters feed an FFmpeg task running through Trigger.dev.",
        inputPorts: [
          {
            id: "image_url",
            label: "image_url",
            kind: "image",
            accepts: ["image"],
            required: true,
          },
          {
            id: "x_percent",
            label: "x_percent",
            kind: "number",
            accepts: ["text", "number"],
          },
          {
            id: "y_percent",
            label: "y_percent",
            kind: "number",
            accepts: ["text", "number"],
          },
          {
            id: "width_percent",
            label: "width_percent",
            kind: "number",
            accepts: ["text", "number"],
          },
          {
            id: "height_percent",
            label: "height_percent",
            kind: "number",
            accepts: ["text", "number"],
          },
        ],
        outputPorts: [{ id: "output", label: "output", kind: "image" }],
        xPercent: "0",
        yPercent: "0",
        widthPercent: "100",
        heightPercent: "100",
        ...safeOverrides,
      };
    case "extract-frame":
      return {
        ...shared,
        implemented: true,
        helperText:
          "Timestamp controls a Trigger.dev FFmpeg frame extraction task.",
        inputPorts: [
          {
            id: "video_url",
            label: "video_url",
            kind: "video",
            accepts: ["video"],
            required: true,
          },
          {
            id: "timestamp",
            label: "timestamp",
            kind: "number",
            accepts: ["text", "number"],
          },
        ],
        outputPorts: [{ id: "output", label: "output", kind: "image" }],
        timestampValue: "50%",
        ...safeOverrides,
      };
  }
}

export function createWorkflowNode(
  kind: QuickNodeType,
  options: NewNodeOptions,
): WorkflowNode {
  return {
    id: options.id ?? `${kind}-${crypto.randomUUID().slice(0, 8)}`,
    type: "workflow",
    position: options.position,
    data: createNodeData(kind, {
      title: options.title,
      isExpanded: options.isExpanded,
      textValue: options.textValue,
      mediaAssetId: options.mediaAssetId,
      mediaName: options.mediaName,
      mediaDataUrl: options.mediaDataUrl,
      mediaMimeType: options.mediaMimeType,
      mediaUrl: options.mediaUrl,
      previewUrl: options.previewUrl,
      helperText: options.helperText,
      modelId: options.modelId,
      systemPromptValue: options.systemPromptValue,
      userMessageValue: options.userMessageValue,
      resultText: options.resultText,
      xPercent: options.xPercent,
      yPercent: options.yPercent,
      widthPercent: options.widthPercent,
      heightPercent: options.heightPercent,
      timestampValue: options.timestampValue,
    }),
  };
}

export function getPortKind(
  node: WorkflowNode,
  portId: string,
  direction: "input" | "output",
): PortDataKind | null {
  const ports = direction === "input" ? node.data.inputPorts : node.data.outputPorts;
  return ports.find((port) => port.id === portId)?.kind ?? null;
}

export function getInputPort(
  node: WorkflowNode,
  portId: string,
): NodePort | undefined {
  return node.data.inputPorts.find((port) => port.id === portId);
}

export function createStarterFlow(): StarterFlow {
  const nodes: WorkflowNode[] = [
    createWorkflowNode("text", {
      id: "text-system",
      position: { x: 60, y: 70 },
      title: "System Prompt",
      textValue:
        "You are a product marketing copywriter. Keep the tone premium and concise.",
    }),
    createWorkflowNode("text", {
      id: "text-details",
      position: { x: 60, y: 280 },
      title: "Product Details",
      textValue:
        "Product: Wireless Bluetooth headphones. Features: ANC, 30-hour battery, foldable design.",
    }),
    createWorkflowNode("upload-image", {
      id: "image-product",
      position: { x: 60, y: 520 },
      title: "Product Image",
    }),
    createWorkflowNode("upload-video", {
      id: "video-demo",
      position: { x: 60, y: 760 },
      title: "Demo Video",
    }),
    createWorkflowNode("run-llm", {
      id: "llm-branch-a",
      position: { x: 520, y: 160 },
      title: "Generate Copy",
      resultText:
        "Branch A output placeholder. This will become the product description result.",
    }),
    createWorkflowNode("crop-image", {
      id: "crop-main",
      position: { x: 520, y: 520 },
      title: "Crop Hero Frame",
    }),
    createWorkflowNode("extract-frame", {
      id: "frame-main",
      position: { x: 520, y: 820 },
      title: "Extract Video Frame",
    }),
    createWorkflowNode("text", {
      id: "text-final-system",
      position: { x: 980, y: 70 },
      title: "Final Social Prompt",
      textValue:
        "You are a social media manager. Write a tweet-length campaign line from the product copy and visuals.",
    }),
    createWorkflowNode("run-llm", {
      id: "llm-final",
      position: { x: 1300, y: 280 },
      title: "Final Marketing Summary",
      resultText:
        "Convergence output placeholder. This node should wait for both branches.",
    }),
  ];

  const edges: WorkflowEdge[] = [
    {
      id: "edge-system-llm",
      source: "text-system",
      sourceHandle: "text",
      target: "llm-branch-a",
      targetHandle: "system_prompt",
      type: "smoothstep",
      animated: true,
      data: { kind: "text" },
      style: { stroke: "rgba(103, 232, 249, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-details-llm",
      source: "text-details",
      sourceHandle: "text",
      target: "llm-branch-a",
      targetHandle: "user_message",
      type: "smoothstep",
      animated: true,
      data: { kind: "text" },
      style: { stroke: "rgba(103, 232, 249, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-image-crop",
      source: "image-product",
      sourceHandle: "image_url",
      target: "crop-main",
      targetHandle: "image_url",
      type: "smoothstep",
      animated: true,
      data: { kind: "image" },
      style: { stroke: "rgba(245, 158, 11, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-crop-branch-a",
      source: "crop-main",
      sourceHandle: "output",
      target: "llm-branch-a",
      targetHandle: "images",
      type: "smoothstep",
      animated: true,
      data: { kind: "image" },
      style: { stroke: "rgba(245, 158, 11, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-video-frame",
      source: "video-demo",
      sourceHandle: "video_url",
      target: "frame-main",
      targetHandle: "video_url",
      type: "smoothstep",
      animated: true,
      data: { kind: "video" },
      style: { stroke: "rgba(244, 114, 182, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-final-system",
      source: "text-final-system",
      sourceHandle: "text",
      target: "llm-final",
      targetHandle: "system_prompt",
      type: "smoothstep",
      animated: true,
      data: { kind: "text" },
      style: { stroke: "rgba(103, 232, 249, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-branch-a-final",
      source: "llm-branch-a",
      sourceHandle: "output",
      target: "llm-final",
      targetHandle: "user_message",
      type: "smoothstep",
      animated: true,
      data: { kind: "text" },
      style: { stroke: "rgba(103, 232, 249, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-crop-final",
      source: "crop-main",
      sourceHandle: "output",
      target: "llm-final",
      targetHandle: "images",
      type: "smoothstep",
      animated: true,
      data: { kind: "image" },
      style: { stroke: "rgba(245, 158, 11, 0.95)", strokeWidth: 2.5 },
    },
    {
      id: "edge-frame-final",
      source: "frame-main",
      sourceHandle: "output",
      target: "llm-final",
      targetHandle: "images",
      type: "smoothstep",
      animated: true,
      data: { kind: "image" },
      style: { stroke: "rgba(245, 158, 11, 0.95)", strokeWidth: 2.5 },
    },
  ];

  return { nodes, edges };
}
