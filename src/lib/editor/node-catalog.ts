import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Crop,
  FileText,
  Frame,
  ImagePlus,
  Video,
} from "lucide-react";

export type QuickNodeType =
  | "text"
  | "upload-image"
  | "upload-video"
  | "run-llm"
  | "crop-image"
  | "extract-frame";

export type QuickNodeDefinition = {
  type: QuickNodeType;
  label: string;
  description: string;
  accent: string;
  icon: LucideIcon;
};

export const quickNodeCatalog: QuickNodeDefinition[] = [
  {
    type: "text",
    label: "Text",
    description: "Static prompts, system messages, and parameter text.",
    accent: "from-sky-500 to-cyan-400",
    icon: FileText,
  },
  {
    type: "upload-image",
    label: "Upload Image",
    description: "Upload a product photo and emit an image URL.",
    accent: "from-amber-500 to-orange-400",
    icon: ImagePlus,
  },
  {
    type: "upload-video",
    label: "Upload Video",
    description: "Upload a video and feed frame extraction workflows.",
    accent: "from-fuchsia-500 to-rose-400",
    icon: Video,
  },
  {
    type: "run-llm",
    label: "Run Any LLM",
    description: "Gemini-powered multimodal node executed via Trigger.dev.",
    accent: "from-violet-500 to-indigo-400",
    icon: Bot,
  },
  {
    type: "crop-image",
    label: "Crop Image",
    description: "FFmpeg crop pipeline with URL output.",
    accent: "from-emerald-500 to-lime-400",
    icon: Crop,
  },
  {
    type: "extract-frame",
    label: "Extract Frame",
    description: "Grab a still image from an uploaded video.",
    accent: "from-pink-500 to-red-400",
    icon: Frame,
  },
];

export const quickNodeTypes = quickNodeCatalog.map((node) => node.type);

export function isQuickNodeType(value: string): value is QuickNodeType {
  return quickNodeTypes.includes(value as QuickNodeType);
}
