
export interface Paper {
  id: string;
  name: string;
  content: string; // Simplified for this example
}

export interface ComparisonRow {
  concept: string;
  summary: string;
  [key: string]: string; // To accommodate dynamic paper names
}

export interface ComparisonData {
  title: string;
  papers: string[];
  comparison: ComparisonRow[];
}

export interface GraphNode {
  id: string;
  group: string; // e.g., 'concept', 'paper', 'author'
  label: string;
  paperId?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number; // Represents strength of connection
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
