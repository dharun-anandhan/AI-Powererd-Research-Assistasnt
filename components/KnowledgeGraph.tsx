import React, { useEffect, useRef } from 'react';
import type { KGData } from '../types';
import * as d3 from 'd3';

interface KnowledgeGraphProps {
    data: KGData;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data }) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || !ref.current) return;

        const { nodes, links } = data;
        
        const width = 500;
        const height = 400;

        d3.select(ref.current).selectAll("*").remove();

        const svg = d3.select(ref.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('style', 'max-width: 100%; height: auto;');

        const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(70))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(0, 0));

        const link = svg.append("g")
            .attr("stroke", "#475569")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        const color = d3.scaleOrdinal(d3.schemeCategory10);
        
        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 8)
            .attr("fill", d => color(d.group.toString()));

        const labels = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .style("font-size", "10px")
            .style("fill", "#cbd5e1")
            .text(d => d.label);

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);

            labels
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y);
        });

    }, [data]);

    return (
        <div>
            <h4 className="text-center font-semibold text-slate-300 mb-2">Literature Network</h4>
            <p className="text-center text-xs text-slate-400 mb-4">Visualizing connections between papers and concepts.</p>
            <div className="flex justify-center border border-slate-700 rounded-lg p-2 bg-slate-800/20">
                 <svg ref={ref}></svg>
            </div>
        </div>
    );
};

export default KnowledgeGraph;