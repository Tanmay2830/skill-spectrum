
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { SkillNode } from '../types';
import { Rocket, X, Orbit, TriangleAlert, Zap, Search as SearchIcon, Info, Activity, Thermometer } from 'lucide-react';

interface UniverseViewProps {
  data: SkillNode[];
  onNodeClick: (node: SkillNode) => void;
  width: number;
  height: number;
  highlightedSkillName?: string;
}

export interface UniverseViewHandle {
  focusOnSkill: (skillName: string) => void;
}

const UniverseView = forwardRef<UniverseViewHandle, UniverseViewProps>(({ data, onNodeClick, width, height, highlightedSkillName }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<{ x: number, y: number, data: SkillNode } | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity.translate(width / 2, height / 2).scale(0.6));
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  const DEFAULT_SCALE = 0.6;

  useImperativeHandle(ref, () => ({
    focusOnSkill: (skillName: string) => {
      const node = data.find(n => n.name.toLowerCase().includes(skillName.toLowerCase()));
      if (node) handleOrbitToggle(node);
    }
  }));

  const getNodeRadius = (node: SkillNode) => {
    const demandFactor = 1 + (node.demand / 200); 
    return node.radius * demandFactor;
  };

  const handleOrbitToggle = (node: SkillNode) => {
    if (focusedNodeId === node.id) {
      handleExitOrbit();
    } else {
      setFocusedNodeId(node.id);
      // Dynamic scale: smaller nodes get higher zoom, larger nodes get less zoom
      const dynamicScale = Math.min(5, Math.max(2, 100 / getNodeRadius(node)));
      const x = -(node.x || 0) * dynamicScale + width / 2;
      const y = -(node.y || 0) * dynamicScale + height / 2;
      const transform = d3.zoomIdentity.translate(x, y).scale(dynamicScale);
      
      if (svgSelectionRef.current && zoomBehaviorRef.current) {
        svgSelectionRef.current.transition().duration(1200).ease(d3.easeCubicOut)
          .call(zoomBehaviorRef.current.transform, transform);
      }
    }
  };

  const handleExitOrbit = () => {
    setFocusedNodeId(null);
    const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(DEFAULT_SCALE);
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
      svgSelectionRef.current.transition().duration(1000).call(zoomBehaviorRef.current.transform, t);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const node = data.find(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (node) {
      handleOrbitToggle(node);
    }
  };

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svgSelectionRef.current = svg;
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    data.forEach(d => {
      const grad = defs.append("radialGradient")
        .attr("id", `grad-${d.id}`)
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%");
      grad.append("stop").attr("offset", "0%").attr("stop-color", "#fff").attr("stop-opacity", 0.6);
      grad.append("stop").attr("offset", "100%").attr("stop-color", d.color);

      defs.append("filter")
        .attr("id", `glow-${d.id}`)
        .append("feGaussianBlur")
        .attr("stdDeviation", d.demand > 80 ? 6 : 3)
        .attr("result", "blur");
    });

    const bgLayer = svg.append("g").attr("class", "parallax-bg");
    const createStars = (count: number, r: number, opacity: number, className: string) => {
      const g = bgLayer.append("g").attr("class", className);
      for (let i = 0; i < count; i++) {
        g.append("circle")
          .attr("cx", Math.random() * 8000 - 4000)
          .attr("cy", Math.random() * 8000 - 4000)
          .attr("r", Math.random() * r)
          .attr("fill", "white")
          .attr("opacity", Math.random() * opacity);
      }
      return g;
    };
    createStars(600, 1, 0.2, "stars-deep");
    createStars(400, 1.5, 0.4, "stars-mid");
    createStars(150, 2, 0.6, "stars-near");

    const container = svg.append("g").attr("class", "universe-content");
    const simulation = d3.forceSimulation(data)
      .force("link", d3.forceLink().id((d: any) => d.id).distance(300))
      .force("charge", d3.forceManyBody().strength(-1200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => getNodeRadius(d) + 120));

    const orbitGroup = container.append("g").attr("class", "orbits");
    const link = container.append("g")
      .attr("class", "links")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.15)
      .selectAll("line")
      .data(data.filter(d => d.parentId).map(d => ({ source: d.id, target: d.parentId })))
      .join("line")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "4,4");

    const nodeGroup = container.append("g").selectAll("g")
      .data(data)
      .join("g")
      .attr("class", d => `node-group type-${d.type.toLowerCase()}`)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        handleOrbitToggle(d);
      })
      .on("mouseenter", (event, d) => setHoveredNode({ x: event.clientX, y: event.clientY, data: d }))
      .on("mousemove", (event) => {
         setHoveredNode(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
      })
      .on("mouseleave", () => setHoveredNode(null));

    // Initial Appearance Animation
    nodeGroup.attr("opacity", 0)
      .attr("transform", (d: any) => `translate(${d.x},${d.y}) scale(0)`)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr("opacity", 1)
      .attr("transform", (d: any) => `translate(${d.x},${d.y}) scale(1)`);

    // Decay Indicator Pulse (if decay > 50)
    nodeGroup.filter(d => (d.decay || 0) > 50)
      .append("circle")
      .attr("r", d => getNodeRadius(d) + 10)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5)
      .attr("class", "decay-pulse");

    // Priority Highlight Ring
    nodeGroup.filter((d: SkillNode) => !!(highlightedSkillName && d.name.toLowerCase().includes(highlightedSkillName.toLowerCase())))
      .append("circle")
      .attr("r", d => getNodeRadius(d) * 2.5)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0.8)
      .attr("class", "priority-ring")
      .style("animation", "spin 10s linear infinite");

    nodeGroup.append("circle")
      .attr("r", d => getNodeRadius(d) * 1.8)
      .attr("fill", d => d.color)
      .attr("opacity", 0.1)
      .attr("filter", d => `url(#glow-${d.id})`);

    nodeGroup.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => `url(#grad-${d.id})`)
      .attr("stroke", d => d.demand > 80 ? "#ffffff" : "none")
      .attr("stroke-width", 1.5)
      .attr("class", d => (d.decay || 0) > 50 ? 'decay-tint' : '');

    nodeGroup.append("text")
      .text(d => d.name)
      .attr("y", d => getNodeRadius(d) + 30)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .attr("letter-spacing", "1px");

    simulation.on("tick", () => {
      const parentNodes = new Map<string, SkillNode>(data.map(d => [d.id, d]));
      orbitGroup.selectAll(".orbit-path").remove();
      data.filter(d => d.parentId).forEach(d => {
        const parent = parentNodes.get(d.parentId!);
        if (parent) {
          const px = parent.x ?? 0, py = parent.y ?? 0;
          const dx = (d.x ?? 0) - px, dy = (d.y ?? 0) - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          orbitGroup.append("ellipse").attr("class", "orbit-path").attr("cx", px).attr("cy", py).attr("rx", dist).attr("ry", dist * 0.5).attr("fill", "none").attr("stroke", "#475569").attr("stroke-opacity", 0.1);
        }
      });
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        container.attr("transform", event.transform);
        const { x, y, k } = event.transform;
        bgLayer.select(".stars-deep").attr("transform", `translate(${x * 0.05}, ${y * 0.05}) scale(${k})`);
        bgLayer.select(".stars-mid").attr("transform", `translate(${x * 0.15}, ${y * 0.15}) scale(${k})`);
        bgLayer.select(".stars-near").attr("transform", `translate(${x * 0.3}, ${y * 0.3}) scale(${k})`);
      });
    zoomBehaviorRef.current = zoom;
    svg.call(zoom).call(zoom.transform, transformRef.current);

    return () => { simulation.stop(); };
  }, [data, width, height, focusedNodeId, highlightedSkillName]);

  const focusedNode = data.find(d => d.id === focusedNodeId);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden perspective-1000">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#000000_100%)] opacity-50" />
      
      {/* Search Bar Overlay */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md pointer-events-none">
        <form onSubmit={handleSearch} className="pointer-events-auto group">
           <div className="relative">
             <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
             <input 
               type="text" 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               placeholder="Locate skill protocols..."
               className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-600"
             />
           </div>
        </form>
      </div>

      <div className="w-full h-full transform-style-3d rotate-x-10 transition-transform duration-1000">
        <svg ref={svgRef} width={width} height={height} className="block w-full h-full cursor-move" />
      </div>

      {/* Tooltip Overlay */}
      {hoveredNode && !focusedNodeId && (
        <div 
          className="absolute z-[70] pointer-events-none transition-all duration-200"
          style={{ left: hoveredNode.x + 20, top: hoveredNode.y + 20 }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px] animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-between mb-2">
               <span className="text-xs font-black text-white uppercase tracking-tighter">{hoveredNode.data.name}</span>
               <div className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                 hoveredNode.data.type === 'GALAXY' ? 'bg-indigo-600' : 'bg-blue-600'
               }`}>{hoveredNode.data.type}</div>
             </div>
             <p className="text-[10px] text-slate-400 mb-3 italic line-clamp-2">"{hoveredNode.data.description}"</p>
             <div className="flex gap-4">
               <div className="flex flex-col">
                 <span className="text-[8px] font-bold text-slate-500 uppercase">Readiness</span>
                 <span className="text-xs font-mono text-blue-400">{hoveredNode.data.readiness}%</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] font-bold text-slate-500 uppercase">Gravity</span>
                 <span className="text-xs font-mono text-purple-400">{hoveredNode.data.demand}%</span>
               </div>
               {(hoveredNode.data.decay || 0) > 0 && (
                 <div className="flex flex-col">
                   <span className="text-[8px] font-bold text-red-500 uppercase">Decay</span>
                   <span className="text-xs font-mono text-red-400">{hoveredNode.data.decay}%</span>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {focusedNode && (
        <div className="absolute top-24 right-8 w-80 z-40 animate-in slide-in-from-right-20 duration-500">
           <div className="bg-slate-900/95 backdrop-blur-3xl border border-blue-500/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
              <button onClick={handleExitOrbit} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"><X className="w-5 h-5" /></button>
              
              <div className="relative mb-6">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase relative z-10 leading-none">{focusedNode.name}</h2>
                <div className="text-[10px] font-mono text-blue-500 mt-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> ORBIT ESTABLISHED
                </div>
              </div>

              <p className="text-slate-400 text-xs mb-6 font-light italic leading-relaxed">"{focusedNode.description}"</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Maturity</div>
                    <div className="text-xl font-mono text-blue-400">{focusedNode.readiness}%</div>
                 </div>
                 <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Gravity</div>
                    <div className="text-xl font-mono text-purple-400">{focusedNode.demand}%</div>
                 </div>
              </div>

              {(focusedNode.decay || 0) > 50 && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 animate-pulse">
                  <Thermometer className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Skill Decaying</div>
                    <div className="text-[9px] text-red-400/60 font-mono">Immediate refresh protocol recommended.</div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => onNodeClick(focusedNode)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 group uppercase tracking-widest text-xs"
              >
                <Rocket className="w-4 h-4" />
                Start Preparation
              </button>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes decayPulse { 
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0.2; }
        }
        .decay-pulse {
          animation: decayPulse 2s ease-in-out infinite;
        }
        .decay-tint {
          filter: saturate(0.2) brightness(0.8) contrast(1.2);
        }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-x-10 { transform: rotateX(15deg); }
      `}</style>
    </div>
  );
});

export default UniverseView;
