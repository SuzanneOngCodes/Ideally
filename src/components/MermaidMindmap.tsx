import { useEffect, useId, useMemo, useState } from 'react';
import type { MermaidMindmapActivity, MindMapNode, ReasoningMapUI } from '../utils/liveReasoningMap';

type MindmapDiagram = Pick<ReasoningMapUI, 'title' | 'mermaid' | 'mindmap_nodes'> | MermaidMindmapActivity;

type PositionedNode = MindMapNode & {
  x: number;
  y: number;
  width: number;
  height: number;
  lines: string[];
};

const COLORS = {
  background: '#F7F7F8',
  text: '#252525',
  rootBorder: '#B8A8F8',
  fallbackLine: '#A9A5B4',
};

const getStructuredNodes = (diagram: MindmapDiagram): MindMapNode[] => {
  if ('mindmap_nodes' in diagram) return diagram.mindmap_nodes || [];
  return (diagram as MermaidMindmapActivity).mindmapNodes || [];
};

const wrapLabel = (label: string, maxChars = 28): string[] => {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['To be determined'];
};

const measureText = (text: string, fontSize: number): number => {
  if (typeof document === 'undefined') return text.length * fontSize * 0.56;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return text.length * fontSize * 0.56;
  context.font = `${fontSize}px Inter, Arial, sans-serif`;
  return context.measureText(text).width;
};

const createLayout = (nodes: MindMapNode[], collapsedIds: Set<string>): { positioned: PositionedNode[]; width: number; height: number } => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const root = nodes.find((node) => !node.parent_id);
  if (!root) return { positioned: [], width: 960, height: 640 };

  const isVisible = (node: MindMapNode): boolean => {
    let parentId = node.parent_id;
    while (parentId) {
      if (collapsedIds.has(parentId)) return false;
      parentId = byId.get(parentId)?.parent_id || null;
    }
    return true;
  };

  const visible = nodes.filter(isVisible);
  const branches = visible.filter((node) => node.parent_id === root.id);
  const childNodes = (parentId: string) => visible.filter((node) => node.parent_id === parentId);
  const fontSize = (node: MindMapNode) => node.level === 0 ? 16 : node.level === 1 ? 15 : 13;
  const dimensions = (node: MindMapNode) => {
    const lines = wrapLabel(node.label, node.level === 0 ? 24 : 30);
    const width = Math.max(32, Math.min(260, Math.max(...lines.map((line) => measureText(line, fontSize(node)) + 8))));
    return { lines, width, height: lines.length * (node.level === 0 ? 22 : 19) };
  };

  const rootSize = dimensions(root);
  const branchInfo = branches.map((branch) => {
    const children = childNodes(branch.id);
    const branchSize = dimensions(branch);
    const childSizes = children.map((child) => ({ child, size: dimensions(child) }));
    const childHeight = childSizes.reduce((sum, item) => sum + item.size.height, 0) + Math.max(0, childSizes.length - 1) * 44;
    return {
      branch,
      branchSize,
      childSizes,
      subtreeHeight: Math.max(branchSize.height, childHeight),
      childWidth: Math.max(0, ...childSizes.map((item) => item.size.width)),
    };
  });
  const left = branchInfo.filter(({ branch }) => branch.side === 'left');
  const right = branchInfo.filter(({ branch }) => branch.side !== 'left');
  const sideHeight = (items: typeof branchInfo) => items.reduce((sum, item) => sum + item.subtreeHeight, 0) + Math.max(0, items.length - 1) * 80;
  const maxSideHeight = Math.max(520, sideHeight(left), sideHeight(right));
  const maxBranchExtent = Math.max(0, ...branchInfo.map((item) => item.branchSize.width / 2 + 140 + item.childWidth / 2));
  const horizontalPadding = 100;
  const width = Math.max(1120, rootSize.width + 2 * (horizontalPadding + maxBranchExtent));
  const height = maxSideHeight + horizontalPadding * 2;
  const rootX = width / 2;
  const rootY = height / 2;
  const positioned: PositionedNode[] = [{ ...root, x: rootX, y: rootY, ...rootSize }];

  const placeSide = (items: typeof branchInfo, side: 'left' | 'right') => {
    const total = sideHeight(items);
    let cursor = (height - total) / 2;
    const direction = side === 'left' ? -1 : 1;
    for (const item of items) {
      const branchY = cursor + item.subtreeHeight / 2;
      const branchX = rootX + direction * (rootSize.width / 2 + 140 + item.branchSize.width / 2);
      positioned.push({ ...item.branch, x: branchX, y: branchY, ...item.branchSize });
      const childTotal = item.childSizes.reduce((sum, child) => sum + child.size.height, 0) + Math.max(0, item.childSizes.length - 1) * 44;
      let childCursor = branchY - childTotal / 2;
      for (const child of item.childSizes) {
        const childX = branchX + direction * (item.branchSize.width / 2 + 160 + item.childWidth / 2);
        positioned.push({ ...child.child, x: childX, y: childCursor + child.size.height / 2, ...child.size });
        childCursor += child.size.height + 44;
      }
      cursor += item.subtreeHeight + 80;
    }
  };

  placeSide(left, 'left');
  placeSide(right, 'right');
  return { positioned, width, height };
};

const pathFor = (parent: PositionedNode, child: PositionedNode): string => {
  const direction = child.x < parent.x ? -1 : 1;
  const startX = parent.x + direction * parent.width / 2;
  const endX = child.x - direction * child.width / 2;
  const controlOffset = Math.max(48, Math.abs(endX - startX) * 0.42);
  return `M ${startX} ${parent.y} C ${startX + direction * controlOffset} ${parent.y}, ${endX - direction * controlOffset} ${child.y}, ${endX} ${child.y}`;
};

const renderMermaidFallback = async (source: string, id: string): Promise<string> => {
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    themeVariables: {
      background: COLORS.background,
      primaryColor: '#ffffff',
      primaryBorderColor: COLORS.rootBorder,
      primaryTextColor: COLORS.text,
      lineColor: COLORS.fallbackLine,
    },
  });
  const { svg } = await mermaid.render(id, source);
  return svg;
};

export function MermaidMindmap({ diagram }: { diagram: MindmapDiagram }) {
  const rawId = useId();
  const renderId = `mindmap-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const structuredNodes = getStructuredNodes(diagram);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fallbackSvg, setFallbackSvg] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const layout = useMemo(() => createLayout(structuredNodes, collapsedIds), [structuredNodes, collapsedIds]);
  const positionedById = useMemo(() => new Map(layout.positioned.map((node) => [node.id, node])), [layout.positioned]);
  const selectedNode = structuredNodes.find((node) => node.id === selectedId);

  useEffect(() => {
    if (structuredNodes.length || !diagram.mermaid?.trim()) return;
    let cancelled = false;
    setRenderError(null);
    void renderMermaidFallback(diagram.mermaid, renderId)
      .then((svg) => { if (!cancelled) setFallbackSvg(svg); })
      .catch(() => { if (!cancelled) setRenderError('Mind map could not be rendered.'); });
    return () => { cancelled = true; };
  }, [diagram.mermaid, renderId, structuredNodes.length]);

  if (!structuredNodes.length && !diagram.mermaid?.trim()) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-xs text-slate-500" role="status">Building a session mind map…</div>;
  }

  if (!structuredNodes.length) {
    return renderError ? (
      <details className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        <summary className="cursor-pointer font-semibold">{renderError}</summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-3 font-mono text-[10px] text-slate-700">{diagram.mermaid}</pre>
      </details>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-[#F7F7F8] p-3" role="img" aria-label={`${diagram.title}. Mermaid mindmap.`}>
        <div className="min-w-[620px] [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-none" dangerouslySetInnerHTML={{ __html: fallbackSvg }} />
      </div>
    );
  }

  const toggleCollapse = (node: MindMapNode) => {
    if (!node.children.length) return;
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
      return next;
    });
  };
  const selectNode = (node: MindMapNode) => setSelectedId(node.id);

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-lg bg-[#F7F7F8] p-2" role="img" aria-label={`${diagram.title}. Miro-style mind map.`}>
        <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="h-auto min-h-[420px] w-full min-w-[860px]" role="img">
          <title>{diagram.title}</title>
          {layout.positioned.map((node) => {
            if (!node.parent_id) return null;
            const parent = positionedById.get(node.parent_id);
            if (!parent) return null;
            return <path key={`edge-${node.id}`} d={pathFor(parent, node)} fill="none" stroke={node.branch_color || COLORS.fallbackLine} strokeWidth="1.4" strokeLinecap="round" />;
          })}
          {layout.positioned.map((node) => {
            const isRoot = node.level === 0;
            const isSelected = selectedId === node.id;
            const fontWeight = isSelected ? 600 : isRoot || node.level === 1 ? 500 : 400;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                tabIndex={0}
                role="button"
                aria-label={`${node.label}. ${node.description || 'No additional description.'}`}
                onClick={() => selectNode(node)}
                onDoubleClick={() => toggleCollapse(node)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') selectNode(node);
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') toggleCollapse(node);
                }}
              >
                {isRoot && <rect x={-node.width / 2 - 14} y={-node.height / 2 - 10} width={node.width + 28} height={node.height + 20} rx="24" fill="#ffffff" stroke={COLORS.rootBorder} strokeWidth="1.5" />}
                {node.lines.map((line, index) => (
                  <text key={`${node.id}-${index}`} x={0} y={(index - (node.lines.length - 1) / 2) * (isRoot ? 22 : 19)} textAnchor={isRoot ? 'middle' : node.side === 'left' ? 'end' : 'start'} fill={COLORS.text} fontFamily="Inter, Arial, sans-serif" fontSize={isRoot ? 16 : node.level === 1 ? 15 : 13} fontWeight={fontWeight}>{line}</text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      {selectedNode && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-slate-200 px-1 pt-3 text-xs text-slate-600">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{selectedNode.label}</p>
            <p className="mt-1 max-w-3xl leading-relaxed">{selectedNode.description || 'No additional description.'}</p>
          </div>
          {selectedNode.children.length > 0 && <button type="button" onClick={() => toggleCollapse(selectedNode)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50">{collapsedIds.has(selectedNode.id) ? 'Expand branch' : 'Collapse branch'}</button>}
        </div>
      )}
      <p className="text-[10px] text-slate-400">Click a concept to inspect details. Double-click a branch or use the control below to collapse it.</p>
    </div>
  );
}
