"use client";

import { useEffect, useRef } from "react";
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
  const { fitView, screenToFlowPosition, setCenter } =
    useReactFlow<WorkflowNode, WorkflowEdge>();
  const previousNodeCountRef = useRef(nodes.length);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ duration: 450, padding: 0.18 });
    }, 40);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fitView]);

  useEffect(() => {
    const previousCount = previousNodeCountRef.current;

    if (nodes.length > previousCount) {
      const selectedNode = nodes.find((node) => node.selected);

      if (selectedNode) {
        const centerX = selectedNode.position.x + (selectedNode.width ?? 84) / 2;
        const centerY = selectedNode.position.y + (selectedNode.height ?? 84) / 2;

        window.setTimeout(() => {
          void setCenter(centerX, centerY, {
            duration: 320,
            zoom: 0.92,
          });
        }, 40);
      }
    }

    previousNodeCountRef.current = nodes.length;
  }, [nodes, setCenter]);

  return (
    <section className="nextflow-editor-backdrop relative flex h-[68vh] min-h-[68vh] flex-1 overflow-hidden xl:h-full xl:min-h-0">
      <div className="nextflow-editor-orb nextflow-editor-orb--cyan absolute -left-16 top-14 h-44 w-44" />
      <div className="nextflow-editor-orb nextflow-editor-orb--violet absolute right-10 top-24 h-52 w-52" />
      <div className="nextflow-editor-orb nextflow-editor-orb--teal absolute bottom-10 left-1/3 h-40 w-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-36 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_66%)]" />
      
      <div className="pointer-events-none absolute bottom-10 right-10 z-0 h-32 w-32 opacity-40" style={{ perspective: "600px" }}>
        <div 
          className="h-full w-full rounded-2xl border border-cyan-400/20"
          style={{ 
            transform: "rotateX(60deg) rotateZ(45deg)",
            animation: "mesh-float 8s ease-in-out infinite"
          }}
        />
      </div>
      <div className="pointer-events-none absolute left-1/4 top-1/3 z-0 opacity-30" style={{ perspective: "800px" }}>
        <div 
          className="h-24 w-24 rounded-xl border border-emerald-400/20"
          style={{ 
            transform: "rotateY(45deg) translateZ(20px)",
            animation: "float-3d 10s ease-in-out infinite"
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3 xl:inset-x-6">
        <div className="pointer-events-auto inline-flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0d0f15]/90 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-xl shadow-xl shadow-black/20">
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-cyan-400/5">
            <PlaySquare className="h-3.5 w-3.5 text-cyan-300" />
          </div>
          <span>Automation Canvas</span>
        </div>
        <div className="pointer-events-auto hidden items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-cyan-300 shadow-lg shadow-cyan-500/10 md:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          Sample automation loaded
        </div>
      </div>

      <div
        className="relative z-10 h-full min-h-[68vh] w-full xl:min-h-0"
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
          className="[&_.react-flow__attribution]:hidden [&_.react-flow__edgelabel-renderer]:text-slate-200 [&_.react-flow__pane]:cursor-grab [&_.react-flow__pane.dragging]:cursor-grabbing"
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
            color="rgba(214, 224, 255, 0.065)"
            gap={24}
            id="small-grid"
            size={1.2}
            variant={BackgroundVariant.Dots}
          />
          <Background
            color="rgba(79, 209, 197, 0.09)"
            gap={128}
            id="large-grid"
            size={5}
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
