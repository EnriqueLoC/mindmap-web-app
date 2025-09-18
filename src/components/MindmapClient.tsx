'use client'
import React, { useEffect, useRef, useState } from 'react';
import '../app/mindmap.css';

// modified types: add shape property and extend Action definition
type NodeItem = { id: number; x: number; y: number; w: number; h: number; title: string; description: string; shape?: 'rect' | 'rounded' | 'ellipse' | 'diamond' };
type EdgeItem = { fromId: number; toId: number };
type Action = { type: 'add-edge'; edge: EdgeItem } | { type: 'remove-edges'; edges: EdgeItem[] };

export default function MindmapClient({ onClose }: { onClose?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const DPR = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

  // mutable refs for performance
  const nodesRef = useRef<NodeItem[]>([]);
  const edgesRef = useRef<EdgeItem[]>([]);
  const nextIdRef = useRef(1);
  const draggingRef = useRef<NodeItem | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  // connect handles drag state (source node id + handle index + current mouse)
  const connectDraggingRef = useRef<{ fromId: number; fromHandle: number; x: number; y: number } | null>(null);

  // action stack + undo state
  const actionStackRef = useRef<Action[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // selected connection (if any)
  const [selectedEdge, setSelectedEdge] = useState<EdgeItem | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null); // for showing handles on hover
  // add hoveredHandleRef to precisely track the handle under the pointer
  const hoveredHandleRef = useRef<{ nodeId: number; handleIndex: number } | null>(null);

  const [tick, setTick] = useState(0); // force redraw when needed
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');

  // active shape selected from left palette
  const [activeShape, setActiveShape] = useState<NodeItem['shape']>('rounded');

  // utilities
  const getCtx = () => canvasRef.current?.getContext('2d') as CanvasRenderingContext2D | null;

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    // initial sample
    addNodeAt(200, 120, 'Central Idea', 'A short description');
    addNodeAt(420, 260, 'First Branch', 'Details about branch');
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => draw(), [tick]);

  function resize() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * DPR);
    canvas.height = Math.floor(rect.height * DPR);
    const ctx = getCtx();
    if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    draw();
  }

  function forceRedraw() {
    setTick(t => t + 1);
  }

  // addNodeAt now accepts optional shape
  function addNodeAt(x: number, y: number, title = 'New Node', description = '', shape: NodeItem['shape'] = 'rounded') {
    const w = shape === 'ellipse' ? 160 : 180;
    const h = shape === 'ellipse' ? 60 : 70;
    const node: NodeItem = { id: nextIdRef.current++, x: x - w / 2, y: y - h / 2, w, h, title, description, shape };
    nodesRef.current.push(node);
    selectNode(node);
    forceRedraw();
  }

  function findNodeAt(x: number, y: number) {
    const arr = nodesRef.current;
    for (let i = arr.length - 1; i >= 0; i--) {
      const n = arr[i];
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) return n;
    }
    return null;
  }

  function selectNode(n: NodeItem | null) {
    setSelectedId(n ? n.id : null);
    setNodeTitle(n ? n.title : '');
    setNodeDesc(n ? n.description : '');
    forceRedraw();
  }

  // compute 4 handle positions (N, E, S, W)
  function getHandlePositions(n: NodeItem) {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    return [
      { x: cx, y: n.y }, // top
      { x: n.x + n.w, y: cy }, // right
      { x: cx, y: n.y + n.h }, // bottom
      { x: n.x, y: cy } // left
    ];
  }
  // slightly larger for easier interaction
  const HANDLE_RADIUS = 8;

  // find if (x,y) is on a handle; returns node and handle index
  function findHandleAt(x: number, y: number): { node: NodeItem; handleIndex: number } | null {
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      const handles = getHandlePositions(n);
      for (let hi = 0; hi < handles.length; hi++) {
        const h = handles[hi];
        const dx = x - h.x, dy = y - h.y;
        // expand detection area a bit
        if (dx * dx + dy * dy <= (HANDLE_RADIUS + 6) * (HANDLE_RADIUS + 6)) {
          return { node: n, handleIndex: hi };
        }
      }
    }
    return null;
  }

  // find an edge near (x,y) by checking distance to straight segment between node centers
  function findEdgeAt(x: number, y: number): { edge: EdgeItem; index: number } | null {
    const edges = edgesRef.current;
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i];
      const a = nodesRef.current.find(n => n.id === e.fromId);
      const b = nodesRef.current.find(n => n.id === e.toId);
      if (!a || !b) continue;
      const ax = a.x + a.w / 2;
      const ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;
      // distance from point to segment
      const vx = bx - ax, vy = by - ay;
      const wx = x - ax, wy = y - ay;
      const c1 = vx * wx + vy * wy;
      const c2 = vx * vx + vy * vy;
      const t = c2 === 0 ? 0 : Math.max(0, Math.min(1, c1 / c2));
      const px = ax + vx * t;
      const py = ay + vy * t;
      const dx = x - px, dy = y - py;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= (HANDLE_RADIUS + 6) * (HANDLE_RADIUS + 6)) {
        return { edge: e, index: i };
      }
    }
    return null;
  }

  // updated draw() to render shapes and handles + preview line
  function draw() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // edges (draw and highlight selected)
    edgesRef.current.forEach(e => {
      const a = nodesRef.current.find(n => n.id === e.fromId);
      const b = nodesRef.current.find(n => n.id === e.toId);
      if (!a || !b) return;
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2, by = b.y + b.h / 2;
      ctx.beginPath();
      const mx = (ax + bx) / 2;
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(mx, (ay + by) / 2, bx, by);
      // highlight if selected
      if (selectedEdge && selectedEdge.fromId === e.fromId && selectedEdge.toId === e.toId) {
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4a5568';
      }
      ctx.stroke();
    });

    // nodes - draw by shape
    nodesRef.current.forEach(n => {
      ctx.beginPath();
      if (n.shape === 'ellipse') {
        ctx.ellipse(n.x + n.w / 2, n.y + n.h / 2, n.w / 2, n.h / 2, 0, 0, Math.PI * 2);
      } else if (n.shape === 'diamond') {
        const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
        ctx.moveTo(cx, n.y);
        ctx.lineTo(n.x + n.w, cy);
        ctx.lineTo(cx, n.y + n.h);
        ctx.lineTo(n.x, cy);
        ctx.closePath();
      } else {
        // rect or rounded
        const r = n.shape === 'rounded' ? 10 : 0;
        roundRect(ctx, n.x, n.y, n.w, n.h, r);
      }
      ctx.fillStyle = (selectedId && selectedId === n.id) ? '#e6f0ff' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = (selectedId && selectedId === n.id) ? 2.5 : 1.2;
      ctx.strokeStyle = '#2d3748';
      ctx.stroke();

      // title
      ctx.fillStyle = '#0f1724';
      ctx.font = 'bold 14px system-ui,Segoe UI,Roboto';
      wrapTextLimited(ctx, n.title, n.x + 10, n.y + 20, n.w - 20, 18, 2);
      // description
      ctx.fillStyle = '#334155';
      ctx.font = '13px system-ui,Segoe UI,Roboto';
      wrapTextLimited(ctx, n.description, n.x + 10, n.y + 40, n.w - 20, 16, 3);
    });

    // If dragging a connection, show handles for every node.
    if (connectDraggingRef.current) {
      const srcId = connectDraggingRef.current.fromId;
      nodesRef.current.forEach(n => {
        const hs = getHandlePositions(n);
        hs.forEach(h => {
          // emphasize source node handles a bit differently
          if (n.id === srcId) {
            // source: slightly brighter ring
            ctx.beginPath();
            ctx.lineWidth = 2.4;
            ctx.strokeStyle = 'rgba(37,99,235,0.98)';
            ctx.fillStyle = 'rgba(255,255,255,0.98)';
            ctx.arc(h.x, h.y, HANDLE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = '#1e40af';
            ctx.arc(h.x, h.y, Math.max(3, Math.floor(HANDLE_RADIUS / 2)), 0, Math.PI * 2);
            ctx.fill();
          } else {
            // other nodes: subtle handles
            ctx.beginPath();
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = 'rgba(96,165,250,0.9)';
            ctx.fillStyle = 'rgba(255,255,255,0.98)';
            ctx.arc(h.x, h.y, HANDLE_RADIUS - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = '#2563eb';
            ctx.arc(h.x, h.y, Math.max(2, Math.floor((HANDLE_RADIUS - 2) / 2)), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
    } else {
      // draw handles on hovered handle or hovered/selected node (outer ring + inner dot)
      const targetHandle = hoveredHandleRef.current;
      let targetIdToShow = targetHandle ? targetHandle.nodeId : (hoveredId ?? selectedId);
      if (targetIdToShow) {
        const target = nodesRef.current.find(n => n.id === targetIdToShow);
        if (target) {
          const hs = getHandlePositions(target);
          hs.forEach(h => {
            // outer ring
            ctx.beginPath();
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = 'rgba(37,99,235,0.95)';
            ctx.fillStyle = 'rgba(255,255,255,0.98)';
            ctx.arc(h.x, h.y, HANDLE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // inner dot
            ctx.beginPath();
            ctx.fillStyle = '#2563eb';
            ctx.arc(h.x, h.y, Math.max(3, Math.floor(HANDLE_RADIUS / 2)), 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
    }

    // draw preview connection if dragging from a handle (kept at the end so it overlays handles)
    if (connectDraggingRef.current) {
      const cd = connectDraggingRef.current;
      // find origin handle position
      const fromNode = nodesRef.current.find(n => n.id === cd.fromId);
      if (fromNode) {
        const hpos = getHandlePositions(fromNode)[cd.fromHandle];
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        const mx = (hpos.x + cd.x) / 2;
        ctx.moveTo(hpos.x, hpos.y);
        ctx.quadraticCurveTo(mx, (hpos.y + cd.y) / 2, cd.x, cd.y);
        ctx.stroke();
      }
    }
  }

  // drawing helpers
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // limited lines wrapper
  function wrapTextLimited(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    let lineCount = 0;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[n] + ' ';
        yy += lineHeight;
        lineCount++;
        if (lineCount >= maxLines - 1) {
          // render remainder truncated
          const remainder = words.slice(n).join(' ');
          let truncated = remainder;
          while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          ctx.fillText(truncated + '...', x, yy);
          return;
        }
      } else {
        line = test;
      }
    }
    if (lineCount < maxLines) ctx.fillText(line.trim(), x, yy);
  }

  // canvas event handlers
  function onDoubleClick(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addNodeAt(x, y, 'New Node', '', activeShape);
  }

  function onMouseDown(e: React.MouseEvent) {
	const canvas = canvasRef.current;
	if (!canvas) return;
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	// 1) If clicked a handle, start a connection (handles should always win)
	const h = findHandleAt(x, y);
	if (h) {
		connectDraggingRef.current = { fromId: h.node.id, fromHandle: h.handleIndex, x: x, y: y };
		selectNode(h.node);
		canvas.style.cursor = 'crosshair';
		forceRedraw();
		return;
	}

	// 2) If clicked on a node, select / start dragging it (nodes take precedence over edges)
	const n = findNodeAt(x, y);
	if (n) {
		draggingRef.current = n;
		offsetRef.current.x = x - n.x;
		offsetRef.current.y = y - n.y;
		selectNode(n);
		// clear any edge selection because node is on top
		if (selectedEdge) setSelectedEdge(null);
		return;
	}

	// 3) Otherwise, try selecting an edge (only when not inside a node)
	const hitEdge = findEdgeAt(x, y);
	if (hitEdge) {
		setSelectedEdge(hitEdge.edge);
		setSelectedId(null);
		forceRedraw();
		return;
	}

	// clicked empty space: clear node selection
	selectNode(null);
}

  function onMouseMove(e: React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // if dragging a connection, update preview point
    if (connectDraggingRef.current) {
      connectDraggingRef.current.x = x;
      connectDraggingRef.current.y = y;
      forceRedraw();
      return;
    }

    // dragging node
    if (draggingRef.current) {
      draggingRef.current.x = x - offsetRef.current.x;
      draggingRef.current.y = y - offsetRef.current.y;
      forceRedraw();
      return;
    }

    // detect handle under pointer
    const hh = findHandleAt(x, y);
    if (hh) {
      // update only when changed
      if (!hoveredHandleRef.current || hoveredHandleRef.current.nodeId !== hh.node.id || hoveredHandleRef.current.handleIndex !== hh.handleIndex) {
        hoveredHandleRef.current = { nodeId: hh.node.id, handleIndex: hh.handleIndex };
        setHoveredId(hh.node.id);
        // show more explicit cursor for handles
        canvas.style.cursor = 'crosshair';
        forceRedraw();
      }
      return;
    }

    // not over handle: clear hoveredHandleRef and fallback to node hover
    const hoveredNode = findNodeAt(x, y);
    const newHoverId = hoveredNode ? hoveredNode.id : null;
    if (hoveredHandleRef.current || hoveredId !== newHoverId) {
      hoveredHandleRef.current = null;
      setHoveredId(newHoverId);
      canvas.style.cursor = newHoverId ? 'grab' : 'default';
      forceRedraw();
    }
  }

  function onMouseUp(e?: React.MouseEvent | MouseEvent) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect) {
      draggingRef.current = null;
      connectDraggingRef.current = null;
      return;
    }
    // if we were dragging a connection, try to finish it
    if (connectDraggingRef.current) {
      const mouseX = (e instanceof MouseEvent ? e.clientX : (e as React.MouseEvent).clientX) - rect.left;
      const mouseY = (e instanceof MouseEvent ? e.clientY : (e as React.MouseEvent).clientY) - rect.top;
      const targetHandle = findHandleAt(mouseX, mouseY);
      const src = connectDraggingRef.current;
      if (targetHandle && targetHandle.node.id !== src.fromId) {
        const newEdge: EdgeItem = { fromId: src.fromId, toId: targetHandle.node.id };
        edgesRef.current.push(newEdge);
        actionStackRef.current.push({ type: 'add-edge', edge: newEdge });
        setCanUndo(actionStackRef.current.length > 0);
      }
      connectDraggingRef.current = null;
      if (canvas) canvas.style.cursor = 'default';
      forceRedraw();
      return;
    }

    draggingRef.current = null;
  }

  function onDeleteClick() {
    if (selectedEdge) {
      // delete selected edge
      edgesRef.current = edgesRef.current.filter(e => !(e.fromId === selectedEdge.fromId && e.toId === selectedEdge.toId));
      actionStackRef.current.push({ type: 'add-edge', edge: selectedEdge }); // allow undo by removing edge: we push add-edge? (keeps simple)
      setCanUndo(actionStackRef.current.length > 0);
      setSelectedEdge(null);
      forceRedraw();
      return;
    }
    if (!selectedId) return;
    // remove edges attached to the node
    edgesRef.current = edgesRef.current.filter(e => e.fromId !== selectedId && e.toId !== selectedId);
    nodesRef.current = nodesRef.current.filter(n => n.id !== selectedId);
    selectNode(null);
    forceRedraw();
  }

  function onDeleteConnection() {
    if (!selectedEdge) return;
    edgesRef.current = edgesRef.current.filter(e => !(e.fromId === selectedEdge.fromId && e.toId === selectedEdge.toId));
    actionStackRef.current.push({ type: 'add-edge', edge: selectedEdge });
    setCanUndo(actionStackRef.current.length > 0);
    setSelectedEdge(null);
    forceRedraw();
  }

  function onClearClick() {
    if (!confirm('Clear all nodes and edges?')) return;
    nodesRef.current = [];
    edgesRef.current = [];
    nextIdRef.current = 1;
    selectNode(null);
    forceRedraw();
  }

  function onSaveClick() {
    // ensure we serialize the shape property as well
    const data = {
      nodes: nodesRef.current.map(n => ({ ...n })),
      edges: edgesRef.current,
      nextId: nextIdRef.current
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function onLoadClick() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        // backward compatibility: if nodes used "text" previously, map it
        const rawNodes = data.nodes || [];
        // Preserve shape if present; default to 'rounded' for older files.
        nodesRef.current = rawNodes.map((n: any) => {
          const base = {
            id: n.id,
            x: n.x,
            y: n.y,
            w: n.w,
            h: n.h,
            title: n.title ?? n.text ?? '',
            description: n.description ?? ''
          };
          // preserve shape when available; default to 'rounded'
          return { ...base, shape: n.shape ?? 'rounded' } as NodeItem;
        });
        edgesRef.current = data.edges || [];
        nextIdRef.current = data.nextId || (nodesRef.current.reduce((m, n) => Math.max(m, n.id), 0) + 1);
        selectNode(null);
        forceRedraw();
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(f);
    e.currentTarget.value = '';
  }

  function onExportClick() {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = rect.width * DPR;
    exportCanvas.height = rect.height * DPR;
    const ex = exportCanvas.getContext('2d')!;
    ex.setTransform(DPR, 0, 0, DPR, 0, 0);

    // draw edges (unchanged)
    ex.lineWidth = 2;
    ex.strokeStyle = '#4a5568';
    edgesRef.current.forEach(e => {
      const a = nodesRef.current.find(n => n.id === e.fromId);
      const b = nodesRef.current.find(n => n.id === e.toId);
      if (!a || !b) return;
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2, by = b.y + b.h / 2;
      ex.beginPath();
      const mx = (ax + bx) / 2;
      ex.moveTo(ax, ay);
      ex.quadraticCurveTo(mx, (ay + by) / 2, bx, by);
      ex.stroke();
    });

    // draw nodes according to their shape
    nodesRef.current.forEach(n => {
      ex.beginPath();
      if (n.shape === 'ellipse') {
        ex.ellipse(n.x + n.w / 2, n.y + n.h / 2, n.w / 2, n.h / 2, 0, 0, Math.PI * 2);
      } else if (n.shape === 'diamond') {
        const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
        ex.moveTo(cx, n.y);
        ex.lineTo(n.x + n.w, cy);
        ex.lineTo(cx, n.y + n.h);
        ex.lineTo(n.x, cy);
        ex.closePath();
      } else {
        // rect or rounded
        const r = (n.shape === 'rounded') ? 8 : 0;
        roundedRectPath(ex, n.x, n.y, n.w, n.h, r);
      }
      ex.fillStyle = '#ffffff';
      ex.fill();
      ex.lineWidth = 1.2;
      ex.strokeStyle = '#2d3748';
      ex.stroke();

      ex.fillStyle = '#0f1724';
      ex.font = 'bold 14px system-ui,Segoe UI,Roboto';
      drawWrappedTextLimited(ex, n.title, n.x + 10, n.y + 20, n.w - 20, 18, 2);

      ex.fillStyle = '#334155';
      ex.font = '13px system-ui,Segoe UI,Roboto';
      drawWrappedTextLimited(ex, n.description, n.x + 10, n.y + 40, n.w - 20, 16, 3);
    });

    const url = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.png';
    document.body.appendChild(a);
    a.click();
    a.remove();

    function roundedRectPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function drawWrappedTextLimited(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
      const words = text.split(' ');
      let line = '';
      let yy = y;
      let lineCount = 0;
      for (let n = 0; n < words.length; n++) {
        const test = line + words[n] + ' ';
        const metrics = c.measureText(test);
        if (metrics.width > maxWidth && n > 0) {
          c.fillText(line.trim(), x, yy);
          line = words[n] + ' ';
          yy += lineHeight;
          lineCount++;
          if (lineCount >= maxLines - 1) {
            const remainder = words.slice(n).join(' ');
            let truncated = remainder;
            while (c.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
              truncated = truncated.slice(0, -1);
            }
            c.fillText(truncated + '...', x, yy);
            return;
          }
        } else {
          line = test;
        }
      }
      if (lineCount < maxLines) c.fillText(line.trim(), x, yy);
    }
  }

  function onNodeTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNodeTitle(e.target.value);
    if (!selectedId) return;
    const n = nodesRef.current.find(n => n.id === selectedId);
    if (n) n.title = e.target.value;
    forceRedraw();
  }

  function onNodeDescChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNodeDesc(e.target.value);
    if (!selectedId) return;
    const n = nodesRef.current.find(n => n.id === selectedId);
    if (n) n.description = e.target.value;
    forceRedraw();
  }

  function onListItemClick(n: NodeItem) {
    selectNode(n);
  }

  // drag start from palette (moved here so handlers exist at render time)
  function onShapeDragStart(e: React.DragEvent, shape: NodeItem['shape']) {
    try {
      e.dataTransfer?.setData('application/x-shape', shape ?? 'rounded');
      // optional: set a simple drag image (browser default is fine)
    } catch (err) {
      // ignore
    }
  }

  // allow drop on canvas container
  function onCanvasDragOver(e: React.DragEvent) {
    // required to allow drop
    e.preventDefault();
  }

  function onCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const shape = (e.dataTransfer?.getData('application/x-shape') as NodeItem['shape']) || activeShape;
    addNodeAt(x, y, 'New Node', '', shape);
  }
  
  // Undo handler (extended to restore removed edges)
  function onUndoClick() {
    const act = actionStackRef.current.pop();
    if (!act) return;
    if (act.type === 'add-edge') {
      edgesRef.current = edgesRef.current.filter(
        e => !(e.fromId === act.edge.fromId && e.toId === act.edge.toId)
      );
    } else if (act.type === 'remove-edges') {
      // restore removed edges
      // avoid duplicating edges that might exist already by checking presence
      act.edges.forEach(edge => {
        const exists = edgesRef.current.some(e => e.fromId === edge.fromId && e.toId === edge.toId);
        if (!exists) edgesRef.current.push(edge);
      });
    }
    setCanUndo(actionStackRef.current.length > 0);
    forceRedraw();
  }

  // keyboard shortcut (Ctrl/Cmd+Z)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        onUndoClick();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // compute whether selected node has connections (for button enabled state)
  const selectedHasConnections = selectedId !== null && edgesRef.current.some(e => e.fromId === selectedId || e.toId === selectedId);

  // render includes left palette now
  return (
    <div className="mm-root" style={{height:'100%'}}>
      <header className="mm-toolbar" style={{display:'flex',alignItems:'center',justifyContent:'flex-start',gap:8}}>
        <div style={{display:'flex',gap:8,alignItems:'center',flex:1}}>
          <button onClick={onClearClick}>Clear</button>
          <button onClick={onSaveClick}>Save JSON</button>
          <button onClick={onLoadClick}>Load JSON</button>
          <button onClick={onExportClick}>Export PNG</button>
          <button onClick={onUndoClick} disabled={!canUndo} title="Undo last action (Ctrl/Cmd+Z)">
            Undo
          </button>
          <span className="hint" style={{marginLeft:8}}>Hover nodes to show connectors. Drag connectors to create links.</span>
        </div>

        {/* render Close button when used as a window */}
        {onClose && (
          <div style={{marginLeft:12}}>
            <button onClick={onClose} style={{padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff'}}>Close</button>
          </div>
        )}
      </header>

      <main className="mm-main" style={{flex:1, minHeight:0, display:'flex', alignItems:'stretch', position:'relative'}}>
        {/* left palette with shapes */}
        <div className="mm-palette card" role="list">
          <div style={{fontWeight:700, marginBottom:8}}>Shapes</div>

          {/* Rounded */}
          <div
            className={`mm-shape-item ${activeShape === 'rounded' ? 'active' : ''}`}
            draggable
            onDragStart={(e) => onShapeDragStart(e, 'rounded')}
            onClick={() => setActiveShape('rounded')}
            role="listitem"
            title="Rounded"
          >
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="28" height="24" rx="6" fill="#fff" stroke="#2563eb" strokeWidth="1.5"/></svg>
            <span>Rounded</span>
          </div>

          {/* Rectangle */}
          <div
            className={`mm-shape-item ${activeShape === 'rect' ? 'active' : ''}`}
            draggable
            onDragStart={(e) => onShapeDragStart(e, 'rect')}
            onClick={() => setActiveShape('rect')}
            role="listitem"
            title="Rectangle"
          >
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="24" height="24" fill="#fff" stroke="#10b981" strokeWidth="1.5"/></svg>
            <span>Rectangle</span>
          </div>

          {/* Ellipse */}
          <div
            className={`mm-shape-item ${activeShape === 'ellipse' ? 'active' : ''}`}
            draggable
            onDragStart={(e) => onShapeDragStart(e, 'ellipse')}
            onClick={() => setActiveShape('ellipse')}
            role="listitem"
            title="Ellipse"
          >
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="18" cy="18" rx="12" ry="8" fill="#fff" stroke="#f59e0b" strokeWidth="1.5"/></svg>
            <span>Ellipse</span>
          </div>

          {/* Diamond */}
          <div
            className={`mm-shape-item ${activeShape === 'diamond' ? 'active' : ''}`}
            draggable
            onDragStart={(e) => onShapeDragStart(e, 'diamond')}
            onClick={() => setActiveShape('diamond')}
            role="listitem"
            title="Diamond"
          >
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6 L30 18 L18 30 L6 18 Z" fill="#fff" stroke="#ef4444" strokeWidth="1.5"/></svg>
            <span>Diamond</span>
          </div>

          <div style={{marginTop:10,fontSize:12,color:'#64748b'}}>Drag a shape onto the canvas or click then double-click canvas to add</div>
        </div>

        {/* canvas container now accepts drops */}
        <div style={{flex:1, position:'relative', minHeight:0}} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}>
          <canvas
            ref={canvasRef}
            id="mindmap"
            onDoubleClick={onDoubleClick}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Right sidebar: always render aside so layout is stable.
            Show controls only when a node is selected; otherwise keep it blank */}
        <aside className="mm-sidebar">
          {selectedEdge !== null ? (
            // connection selected view
            <>
              <div style={{marginBottom:8,fontWeight:700}}>Connection</div>
              <div style={{marginBottom:8}}>From: {selectedEdge.fromId} → To: {selectedEdge.toId}</div>
              <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
                <button
                  onClick={onDeleteConnection}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Delete Connection
                </button>
                <button onClick={() => setSelectedEdge(null)} style={{padding:'8px 10px',borderRadius:8}}>Deselect</button>
              </div>
            </>
          ) : selectedId !== null ? (
             <>
               <label>Title</label>
               <input value={nodeTitle} onChange={onNodeTitleChange} placeholder="Node title" />
               <label>Description</label>
               <textarea value={nodeDesc} onChange={onNodeDescChange} placeholder="Node description" />
              <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
                <button
                  onClick={onDeleteClick}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                  title="Delete selected node"
                >
                  Delete
                </button>
                <button onClick={() => selectNode(null)} style={{padding:'8px 10px',borderRadius:8}}>Deselect</button>
              </div>
 
               <label style={{marginTop:12}}>Nodes</label>
               <ul className="mm-nodes-list">
                 {nodesRef.current.map(n => (
                   <li key={n.id} className={selectedId === n.id ? 'selected' : ''} onClick={() => onListItemClick(n)}>
                     {n.title || `Node ${n.id}`}
                   </li>
                 ))}
               </ul>
             </>
           ) : (
             // blank content when no node selected
             <div style={{height:'100%'}} />
           )}
        </aside>
      </main>

      <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onFileChange} />
    </div>
  );

  // ...existing helper functions...
}
