
export interface Paper {
    id: string;
    title: string;
    authors: string[];
    year: number;
    tldr: string;
    abstract: string;
}

export interface ComparisonPoint {
    value: string;
    confidenceScore: number;
    sourceSentence: string;
}

export interface ComparisonAspect {
    aspect: string;
    papers: {
        [paperId: string]: ComparisonPoint;
    };
}

export interface ComparisonResult {
    comparison: ComparisonAspect[];
    overallSynthesis: string;
    researchGaps: string[];
    hypothesis: string;
}

export interface KGNode {
    id: string;
    group: number;
    label: string;
}

export interface KGLink {
    source: string;
    target: string;
    value: number;
}

export interface KGData {
    nodes: KGNode[];
    links: KGLink[];
}