import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphLink } from '../types';

interface KnowledgeGraphProps {
  data: GraphData;
}

// Define extended types for D3 simulation
interface SimulationNode extends GraphNode, d3.SimulationNodeDatum { }

// FIX: Define a type for links after they have been processed by the simulation.
// 'source' and 'target' are now guaranteed to be SimulationNode objects.
interface ProcessedLink extends Omit<GraphLink, 'source' | 'target'> {
  source: SimulationNode;
  target: SimulationNode;
  index?: number;
}


export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeCategory10), []);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    // FIX: Explicitly type nodes and links after deep copy.
    const { nodes, links }: { nodes: SimulationNode[], links: GraphLink[] } = JSON.parse(JSON.stringify(data));
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);

    svg.selectAll("*").remove(); // Clear previous graph

    const g = svg.append("g");
    
    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      // FIX: Use the original GraphLink type for initialization. D3 will mutate the links array.
      .force("link", d3.forceLink<SimulationNode, GraphLink>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .on("tick", ticked);
      
    // Arrowhead marker
    g.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 19)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');

    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      // FIX: Type the selection and data with the ProcessedLink interface.
      .selectAll<SVGLineElement, ProcessedLink>("line")
      .data(links as unknown as ProcessedLink[])
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value))
      .attr('marker-end', 'url(#arrowhead)');

    const node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      // FIX: Explicitly type the selection data. This ensures 'd' is SimulationNode.
      .selectAll<SVGCircleElement, SimulationNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.group === 'paper' ? 12 : 8)
      .attr("fill", d => colorScale(d.group))
      .call(drag(simulation));

    const labels = g.append("g")
      // FIX: Explicitly type the selection data.
      .selectAll<SVGTextElement, SimulationNode>("text")
      .data(nodes)
      .join("text")
      .text(d => d.label)
      .attr('x', 12)
      .attr('y', 4)
      .style('font-size', '10px')
      .style('fill', '#333')
      .style('paint-order', 'stroke')
      .style('stroke', 'white')
      .style('stroke-width', '2px');
      
    // FIX: With selections correctly typed, 'd' is inferred correctly in these callbacks.
    node.append("title").text(d => `${d.group.toUpperCase()}: ${d.label}`);
    link.append("title").text(d => d.label);
    
    function ticked() {
      link
        // FIX: 'd.source' and 'd.target' are now correctly typed as SimulationNode.
        .attr("x1", d => d.source.x!)
        .attr("y1", d => d.source.y!)
        .attr("x2", d => d.target.x!)
        .attr("y2", d => d.target.y!);
      node
        // FIX: 'd' is correctly typed as SimulationNode, so 'x' and 'y' are accessible.
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);
      labels
        // FIX: 'd' is correctly typed, so 'x', 'y', and 'group' are accessible.
        .attr("x", d => d.x! + (d.group === 'paper' ? 15 : 10))
        .attr("y", d => d.y! + 4);
    }
    
    // Drag functionality
    function drag(simulation: d3.Simulation<SimulationNode, undefined>) {
        function dragstarted(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>, d: SimulationNode) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            // FIX: 'd' is correctly typed as SimulationNode, no 'any' cast needed.
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>, d: SimulationNode) {
            // FIX: No 'any' cast needed.
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>, d: SimulationNode) {
            if (!event.active) simulation.alphaTarget(0);
            // FIX: No 'any' cast needed.
            d.fx = null;
            d.fy = null;
        }
        return d3.drag<SVGCircleElement, SimulationNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    // Zoom functionality
    const zoomHandler = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    svg.call(zoomHandler);

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        svg.attr('width', width).attr('height', height)
           .attr('viewBox', [-width / 2, -height / 2, width, height]);
        simulation.force("center", d3.forceCenter(0, 0)).alpha(0.3).restart();
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.unobserve(container);
      simulation.stop();
    };

  }, [data, colorScale]);

  return (
    <div>
       <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Knowledge Graph Visualization</h2>
       <div ref={containerRef} className="w-full h-[600px] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50">
          <svg ref={svgRef}></svg>
       </div>
    </div>
  );
};
