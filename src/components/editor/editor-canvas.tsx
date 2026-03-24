"use client";

import { useEffect } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeTypes,
  useReactFlow,
} from "@xyflow/react";
import { PlaySquare, Sparkles } from "lucide-react";

import { isQuickNodeType } from "@/lib/editor/node-catalog";
import { isValidEditorConnection } from "@/lib/editor/connection-rules";
import { useEditorStore } from "@/stores/editor-store";
import type { WorkflowEdge, WorkflowNode } from "@/types/editor";

import { WorkflowNodeCard } from "./nodes/workflow-node-card";

const nodeTypes: NodeTypes = {
  workflow: WorkflowNodeCard,
};

const dragMimeType = "application/nextflow-node";

function FlowCanvasInner() {
  const addNode = useEditorStore((state) => state.addNode);
  const edges = useEditorStore((state) => state.edges);
  const nodes = useEditorStore((state) => state.nodes);
  const onConnect = useEditorStore((state) => state.onConnect);
  const onEdgesChange = useEditorStore((state) => state.onEdgesChange);
  const onNodesChange = useEditorStore((state) => state.onNodesChange);
  const { fitView, screenToFlowPosition } = useReactFlow<WorkflowNode, WorkflowEdge>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ duration: 450, padding: 0.18 });
    }, 40);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fitView]);

  return (
    <section className="relative min-h-[68vh] flex-1 overflow-hidden bg-[#0f1117] xl:min-h-0">
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-3 xl:inset-x-6 xl:top-4">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11141b]/88 px-3 py-2 text-sm text-slate-200 backdrop-blur">
          <PlaySquare className="h-4 w-4 text-cyan-200" />
          <span className="font-medium">Automation Canvas</span>
        </div>
        <div className="pointer-events-auto hidden items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-cyan-100 md:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          Sample automation loaded
        </div>
      </div>

      <div
        className="h-full w-full"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          event.preventDefault();

          const nodeType = event.dataTransfer.getData(dragMimeType);

          if (!isQuickNodeType(nodeType)) {
            return;
          }

          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });

          addNode(nodeType, position);
        }}
      >
        <ReactFlow
          colorMode="dark"
          connectionLineStyle={{ stroke: "rgba(103, 232, 249, 0.9)", strokeWidth: 2.5 }}
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2.5 },
            type: "smoothstep",
          }}
          deleteKeyCode={["Backspace", "Delete"]}
          edges={edges}
          fitView
          isValidConnection={(connection) =>
            isValidEditorConnection(connection, nodes, edges)
          }
          maxZoom={1.6}
          minZoom={0.25}
          multiSelectionKeyCode={["Meta", "Control"]}
          nodeTypes={nodeTypes}
          nodes={nodes}
          onConnect={onConnect}
          onEdgesChange={onEdgesChange}
          onNodesChange={onNodesChange}
          panOnDrag
          panOnScroll
          proOptions={{ hideAttribution: true }}
          selectionOnDrag
          snapGrid={[22, 22]}
          snapToGrid
        >
          <Background
            color="rgba(255,255,255,0.06)"
            gap={22}
            id="small-grid"
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Background
            color="rgba(103,232,249,0.08)"
            gap={110}
            id="large-grid"
            size={6}
            variant={BackgroundVariant.Cross}
          />
          <MiniMap
            bgColor="#0b0c10"
            maskColor="rgba(15,17,23,0.68)"
            nodeBorderRadius={12}
            nodeColor="#1f2937"
            nodeStrokeColor="#67e8f9"
            pannable
            zoomable
          />
          <Controls
            className="[&>button]:!border-white/10 [&>button]:!bg-[#11141b] [&>button]:!text-slate-300"
            position="bottom-left"
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </section>
  );
}

export function EditorCanvas() {
  return <FlowCanvasInner />;
}
