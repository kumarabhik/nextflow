"use client";

import { memo, type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Bot,
  Crop,
  FileText,
  Frame,
  ImagePlus,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";

import { uploadMediaAsset } from "@/lib/media/client";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import type { NodePort, WorkflowNode } from "@/types/editor";

const iconByKind = {
  "crop-image": Crop,
  "extract-frame": Frame,
  "run-llm": Bot,
  text: FileText,
  "upload-image": ImagePlus,
  "upload-video": Video,
};

const handleColorByKind = {
  image: "border-amber-300 bg-amber-400",
  number: "border-emerald-300 bg-emerald-400",
  text: "border-cyan-300 bg-cyan-300",
  video: "border-pink-300 bg-pink-400",
} as const;

type FieldShellProps = {
  children: ReactNode;
  connected?: boolean;
  connectionCount?: number;
  label: string;
};

function FieldShell({
  children,
  connected = false,
  connectionCount = 0,
  label,
}: FieldShellProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-3",
        connected && "border-cyan-300/20 bg-cyan-300/[0.05]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
          {label}
        </label>
        {connected ? (
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100">
            {connectionCount > 1
              ? `${connectionCount} inputs connected`
              : "Connected"}
          </span>
        ) : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

type PortBadgeProps = {
  connected?: boolean;
  port: NodePort;
  side: "input" | "output";
};

function PortBadge({ connected = false, port, side }: PortBadgeProps) {
  const isInput = side === "input";

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 transition",
        isInput ? "pl-8" : "pr-8 text-right",
        connected && "border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-100",
      )}
    >
      <Handle
        id={port.id}
        type={isInput ? "target" : "source"}
        position={isInput ? Position.Left : Position.Right}
        className={cn(
          "!top-1/2 !h-3.5 !w-3.5 !-translate-y-1/2 !border-2",
          handleColorByKind[port.kind],
          isInput ? "!left-0" : "!right-0",
        )}
      />
      <span>{port.label}</span>
    </div>
  );
}

type InputFieldProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

function InputField({
  disabled = false,
  onChange,
  placeholder,
  value,
}: InputFieldProps) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50",
        disabled &&
          "cursor-not-allowed border-cyan-300/20 bg-cyan-300/[0.08] text-slate-500",
      )}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

type TextAreaFieldProps = {
  disabled?: boolean;
  minHeightClassName?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

function TextAreaField({
  disabled = false,
  minHeightClassName = "min-h-28",
  onChange,
  placeholder,
  value,
}: TextAreaFieldProps) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-2xl border border-white/10 bg-[#0b0e13] px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/50",
        minHeightClassName,
        disabled &&
          "cursor-not-allowed border-cyan-300/20 bg-cyan-300/[0.08] text-slate-500",
      )}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPortOffset(index: number, total: number) {
  if (total <= 1) {
    return 50;
  }

  return 20 + (60 / (total - 1)) * index;
}

type CircleHandleProps = {
  index: number;
  port: NodePort;
  side: "input" | "output";
  total: number;
};

function CircleHandle({ index, port, side, total }: CircleHandleProps) {
  const isInput = side === "input";

  return (
    <Handle
      id={port.id}
      type={isInput ? "target" : "source"}
      position={isInput ? Position.Left : Position.Right}
      className={cn(
        "!h-3.5 !w-3.5 !border-2",
        handleColorByKind[port.kind],
        isInput ? "!-left-1.5" : "!-right-1.5",
      )}
      style={{
        top: `${getPortOffset(index, total)}%`,
        transform: "translateY(-50%)",
      }}
    />
  );
}

function PreviewPortPill({
  connected = false,
  label,
}: {
  connected?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400",
        connected && "border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-100",
      )}
    >
      {label}
    </div>
  );
}

function WorkflowNodeCardComponent({ id, data, selected }: NodeProps<WorkflowNode>) {
  const deleteNode = useEditorStore((state) => state.deleteNode);
  const nodeRuntime = useEditorStore((state) => state.nodeRuntime[id] ?? { status: "idle" });
  const updateNodeData = useEditorStore((state) => state.updateNodeData);
  const getIncomingConnectionCount = useEditorStore(
    (state) => state.getIncomingConnectionCount,
  );
  const isInputConnected = useEditorStore((state) => state.isInputConnected);
  const toggleNodeExpanded = useEditorStore((state) => state.toggleNodeExpanded);
  const Icon = iconByKind[data.kind];
  const isExpanded = data.isExpanded ?? false;

  const isPortConnected = (portId: string) => isInputConnected(id, portId);
  const connectionCount = (portId: string) =>
    getIncomingConnectionCount(id, portId);

  const updateField = (patch: Partial<typeof data>) => {
    updateNodeData(id, patch);
  };

  const onFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    const currentPreview = data.previewUrl;

    if (currentPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(currentPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    updateField({
      helperText: `Uploading ${file.name} for remote execution...`,
      mediaAssetId: undefined,
      mediaDataUrl: undefined,
      mediaMimeType: file.type,
      mediaName: file.name,
      mediaUrl: undefined,
      previewUrl,
    });

    try {
      const upload = await uploadMediaAsset(
        file,
        data.kind === "upload-image" ? "image" : "video",
      );

      URL.revokeObjectURL(previewUrl);

      updateField({
        helperText: `Stored at a persisted asset URL for Trigger.dev execution (${formatFileSize(upload.sizeBytes)}).`,
        mediaAssetId: upload.assetId,
        mediaDataUrl: undefined,
        mediaMimeType: upload.mimeType,
        mediaName: upload.fileName,
        mediaUrl: upload.assetUrl,
        previewUrl: upload.assetUrl,
      });
    } catch (error) {
      updateField({
        helperText:
          error instanceof Error
            ? `${error.message} Local preview was kept, but remote execution needs a successful upload.`
            : "Media upload failed. Local preview was kept, but remote execution needs a successful upload.",
      });
    }
  };

  const renderAvatar = () => {
    if (data.kind === "upload-image" && data.previewUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- Local or persisted preview URL inside node avatar.
        <img
          alt={data.mediaName ?? data.title}
          className="h-full w-full rounded-full object-cover"
          src={data.previewUrl}
        />
      );
    }

    if (data.kind === "upload-video" && data.previewUrl) {
      return (
        <video
          className="h-full w-full rounded-full object-cover"
          muted
          src={data.previewUrl}
        />
      );
    }

    return <Icon className="h-6 w-6" />;
  };

  if (!isExpanded) {
    return (
      <article className="group relative w-[88px]">
        {selected ? (
          <div className="absolute -top-4 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full border border-white/10 bg-[#0f131a]/96 px-2 py-2 shadow-xl shadow-black/30">
            <button
              className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-400/15"
              onClick={(event) => {
                event.stopPropagation();
                deleteNode(id);
              }}
              type="button"
            >
              <Trash2 className="mr-1.5 inline h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : null}

        <button
          className={cn(
            "relative grid h-[84px] w-[84px] place-items-center overflow-hidden rounded-full border bg-[#10131a]/96 text-white shadow-2xl shadow-black/30 transition",
            selected
              ? "border-cyan-300/70 shadow-cyan-500/15"
              : "border-white/10 hover:border-white/20",
            nodeRuntime.status === "queued" &&
              "nextflow-runtime-glow-queued border-cyan-300/60 shadow-cyan-500/10",
            nodeRuntime.status === "running" &&
              "nextflow-runtime-glow-running border-amber-300/70 shadow-amber-400/15",
            nodeRuntime.status === "success" && "border-emerald-300/35",
            nodeRuntime.status === "failed" && "border-red-300/45",
            nodeRuntime.status === "waiting" && "border-violet-300/45",
            nodeRuntime.status === "skipped" && "border-white/15 opacity-90",
          )}
          onClick={(event) => {
            event.stopPropagation();
            toggleNodeExpanded(id, true);
          }}
          type="button"
        >
          {data.inputPorts.map((port, index) => (
            <CircleHandle
              index={index}
              key={port.id}
              port={port}
              side="input"
              total={data.inputPorts.length}
            />
          ))}

          {data.outputPorts.map((port, index) => (
            <CircleHandle
              index={index}
              key={port.id}
              port={port}
              side="output"
              total={data.outputPorts.length}
            />
          ))}

          <div
            className={cn(
              "grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-full bg-gradient-to-br text-slate-950 shadow-lg",
              data.accent,
            )}
          >
            {renderAvatar()}
          </div>
        </button>

        <div className="pointer-events-none absolute left-[calc(100%+16px)] top-1/2 z-10 hidden -translate-y-1/2 group-hover:block">
          <div className="w-[172px] rounded-[26px] border border-white/10 bg-[#10131a]/96 p-3 text-white shadow-2xl shadow-black/35 backdrop-blur">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br text-slate-950 shadow-lg",
                  data.accent,
                )}
              >
                {renderAvatar()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white">
                  {data.title}
                </h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {data.kind}
                </p>
              </div>
            </div>

            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              {nodeRuntime.status === "idle"
                ? data.implemented
                  ? "Ready"
                  : "Next"
                : nodeRuntime.status}
            </div>

            {data.inputPorts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {data.inputPorts.map((port) => (
                  <PreviewPortPill
                    connected={isPortConnected(port.id)}
                    key={port.id}
                    label={port.label}
                  />
                ))}
              </div>
            ) : null}

            {data.outputPorts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {data.outputPorts.map((port) => (
                  <PreviewPortPill key={port.id} label={port.label} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative w-[340px] rounded-[28px] border bg-[#10131a]/95 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur transition",
        selected
          ? "border-cyan-300/70 shadow-cyan-500/15"
          : "border-white/10 hover:border-white/20",
        nodeRuntime.status === "queued" &&
          "nextflow-runtime-glow-queued border-cyan-300/60 shadow-cyan-500/10",
        nodeRuntime.status === "running" &&
          "nextflow-runtime-glow-running border-amber-300/70 shadow-amber-400/15",
        nodeRuntime.status === "success" && "border-emerald-300/35",
        nodeRuntime.status === "failed" && "border-red-300/45",
        nodeRuntime.status === "waiting" && "border-violet-300/45",
        nodeRuntime.status === "skipped" && "border-white/15 opacity-90",
      )}
    >
      {selected ? (
        <div className="absolute -top-4 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full border border-white/10 bg-[#0f131a]/96 px-2 py-2 shadow-xl shadow-black/30">
          <button
            className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-400/15"
            onClick={(event) => {
              event.stopPropagation();
              deleteNode(id);
            }}
            type="button"
          >
            <Trash2 className="mr-1.5 inline h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <button
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br text-slate-950 shadow-lg",
            data.accent,
          )}
          onClick={(event) => {
            event.stopPropagation();
            toggleNodeExpanded(id, false);
          }}
          type="button"
        >
          {renderAvatar()}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{data.title}</h3>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                {data.kind}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                nodeRuntime.status === "running"
                  ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
                  : nodeRuntime.status === "queued"
                    ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                    : nodeRuntime.status === "success"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                      : nodeRuntime.status === "failed"
                        ? "border-red-400/20 bg-red-400/10 text-red-100"
                        : nodeRuntime.status === "waiting"
                          ? "border-violet-400/20 bg-violet-400/10 text-violet-100"
                          : nodeRuntime.status === "skipped"
                            ? "border-white/10 bg-white/5 text-slate-300"
                            : data.implemented
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                              : "border-amber-400/20 bg-amber-400/10 text-amber-100",
              )}
            >
              {nodeRuntime.status === "idle"
                ? data.implemented
                  ? "interactive"
                  : "next"
                : nodeRuntime.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{data.description}</p>
        </div>
      </div>

      {nodeRuntime.status !== "idle" ? (
        <div
          className={cn(
            "mt-4 rounded-[24px] border p-3 text-sm",
            nodeRuntime.status === "running" &&
              "border-amber-400/15 bg-amber-400/10 text-amber-100",
            nodeRuntime.status === "success" &&
              "border-emerald-400/15 bg-emerald-400/10 text-emerald-100",
            nodeRuntime.status === "failed" &&
              "border-red-400/15 bg-red-400/10 text-red-100",
            nodeRuntime.status === "queued" &&
              "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-100",
            nodeRuntime.status === "waiting" &&
              "border-violet-400/15 bg-violet-400/[0.08] text-violet-100",
            nodeRuntime.status === "skipped" &&
              "border-white/10 bg-white/[0.04] text-slate-300",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium capitalize">{nodeRuntime.status}</span>
            {nodeRuntime.durationMs ? (
              <span className="text-xs uppercase tracking-[0.2em]">
                {(nodeRuntime.durationMs / 1000).toFixed(1)}s
              </span>
            ) : null}
          </div>
          <p className="mt-2 leading-6">
            {nodeRuntime.summary ?? nodeRuntime.errorMessage ?? "Awaiting execution."}
          </p>
        </div>
      ) : null}

      {data.kind === "text" ? (
        <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0b0e13] p-3">
          <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Text input
          </label>
          <textarea
            className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/50"
            onChange={(event) => updateField({ textValue: event.target.value })}
            value={data.textValue ?? ""}
          />
        </div>
      ) : null}

      {data.kind === "upload-image" ? (
        <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0b0e13] p-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Local image preview
            </span>
            <input
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                void onFileChange(event.target.files?.[0] ?? null);
              }}
              type="file"
            />
            <span className="mt-3 flex rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
              {data.mediaName ?? "Select image"}
            </span>
          </label>
          {data.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Blob previews are local browser URLs.
            <img
              alt={data.mediaName ?? "Selected image"}
              className="mt-3 h-36 w-full rounded-2xl object-cover"
              src={data.previewUrl}
            />
          ) : (
            <div className="mt-3 grid h-36 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-slate-500">
              Preview appears here
            </div>
          )}
        </div>
      ) : null}

      {data.kind === "upload-video" ? (
        <div className="mt-4 rounded-[24px] border border-white/10 bg-[#0b0e13] p-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Local video preview
            </span>
            <input
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              className="hidden"
              onChange={(event) => {
                void onFileChange(event.target.files?.[0] ?? null);
              }}
              type="file"
            />
            <span className="mt-3 flex rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
              {data.mediaName ?? "Select video"}
            </span>
          </label>
          {data.previewUrl ? (
            <video
              className="mt-3 h-36 w-full rounded-2xl object-cover"
              controls
              muted
              src={data.previewUrl}
            />
          ) : (
            <div className="mt-3 grid h-36 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-slate-500">
              Preview appears here
            </div>
          )}
        </div>
      ) : null}

      {data.kind === "run-llm" ? (
        <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-[#0b0e13] p-3">
          <FieldShell label="Model">
            <select
              className="w-full rounded-2xl border border-white/10 bg-[#0b0e13] px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50"
              onChange={(event) => updateField({ modelId: event.target.value })}
              value={data.modelId ?? "gemini-fast"}
            >
              <option value="gemini-fast">Gemini Fast</option>
              <option value="gemini-balanced">Gemini Balanced</option>
              <option value="gemini-quality">Gemini Quality</option>
            </select>
          </FieldShell>

          <FieldShell
            connected={isPortConnected("system_prompt")}
            connectionCount={connectionCount("system_prompt")}
            label="System prompt"
          >
            <TextAreaField
              disabled={isPortConnected("system_prompt")}
              minHeightClassName="min-h-24"
              onChange={(value) => updateField({ systemPromptValue: value })}
              value={data.systemPromptValue ?? ""}
            />
          </FieldShell>

          <FieldShell
            connected={isPortConnected("user_message")}
            connectionCount={connectionCount("user_message")}
            label="User message"
          >
            <TextAreaField
              disabled={isPortConnected("user_message")}
              minHeightClassName="min-h-24"
              onChange={(value) => updateField({ userMessageValue: value })}
              value={data.userMessageValue ?? ""}
            />
          </FieldShell>

          <FieldShell
            connected={isPortConnected("images")}
            connectionCount={connectionCount("images")}
            label="Images input"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0b0e13] px-3 py-3 text-sm leading-6 text-slate-400">
              {isPortConnected("images")
                ? `${connectionCount("images")} image connection(s) ready for multimodal prompting.`
                : "Connect one or more image outputs here for multimodal prompting."}
            </div>
          </FieldShell>

          <FieldShell label="Inline result">
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-3 text-sm leading-6 text-slate-200">
              {data.resultText}
            </div>
          </FieldShell>
        </div>
      ) : null}

      {data.kind === "crop-image" ? (
        <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-[#0b0e13] p-3">
          <FieldShell
            connected={isPortConnected("image_url")}
            connectionCount={connectionCount("image_url")}
            label="Image input"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0b0e13] px-3 py-3 text-sm leading-6 text-slate-400">
              {isPortConnected("image_url")
                ? "Source image is connected from an upstream node."
                : "Connect an image output here to drive the crop task."}
            </div>
          </FieldShell>

          <div className="grid grid-cols-2 gap-3">
            <FieldShell
              connected={isPortConnected("x_percent")}
              connectionCount={connectionCount("x_percent")}
              label="x %"
            >
              <InputField
                disabled={isPortConnected("x_percent")}
                onChange={(value) => updateField({ xPercent: value })}
                value={data.xPercent ?? "0"}
              />
            </FieldShell>
            <FieldShell
              connected={isPortConnected("y_percent")}
              connectionCount={connectionCount("y_percent")}
              label="y %"
            >
              <InputField
                disabled={isPortConnected("y_percent")}
                onChange={(value) => updateField({ yPercent: value })}
                value={data.yPercent ?? "0"}
              />
            </FieldShell>
            <FieldShell
              connected={isPortConnected("width_percent")}
              connectionCount={connectionCount("width_percent")}
              label="width %"
            >
              <InputField
                disabled={isPortConnected("width_percent")}
                onChange={(value) => updateField({ widthPercent: value })}
                value={data.widthPercent ?? "100"}
              />
            </FieldShell>
            <FieldShell
              connected={isPortConnected("height_percent")}
              connectionCount={connectionCount("height_percent")}
              label="height %"
            >
              <InputField
                disabled={isPortConnected("height_percent")}
                onChange={(value) => updateField({ heightPercent: value })}
                value={data.heightPercent ?? "100"}
              />
            </FieldShell>
          </div>
        </div>
      ) : null}

      {data.kind === "extract-frame" ? (
        <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-[#0b0e13] p-3">
          <FieldShell
            connected={isPortConnected("video_url")}
            connectionCount={connectionCount("video_url")}
            label="Video input"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0b0e13] px-3 py-3 text-sm leading-6 text-slate-400">
              {isPortConnected("video_url")
                ? "Source video is connected from an upstream node."
                : "Connect a video output here to drive frame extraction."}
            </div>
          </FieldShell>

          <FieldShell
            connected={isPortConnected("timestamp")}
            connectionCount={connectionCount("timestamp")}
            label="Timestamp"
          >
            <InputField
              disabled={isPortConnected("timestamp")}
              onChange={(value) => updateField({ timestampValue: value })}
              placeholder='Examples: "12" or "50%"'
              value={data.timestampValue ?? "50%"}
            />
          </FieldShell>
        </div>
      ) : null}

      {data.helperText ? (
        <div className="mt-4 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.06] p-3 text-sm text-cyan-50">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Build note
          </div>
          <p className="mt-2 leading-6 text-slate-300">{data.helperText}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {data.inputPorts.map((port) => (
          <PortBadge
            connected={isPortConnected(port.id)}
            key={port.id}
            port={port}
            side="input"
          />
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {data.outputPorts.map((port) => (
          <PortBadge key={port.id} port={port} side="output" />
        ))}
      </div>
    </article>
  );
}

export const WorkflowNodeCard = memo(WorkflowNodeCardComponent);
