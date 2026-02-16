// Code Graph Visualization using ts-morph
// Analyzes codebase structure for AI agents to understand project architecture

import { Project, SourceFile, ClassDeclaration, FunctionDeclaration, InterfaceDeclaration } from 'ts-morph';

interface CodeNode {
  id: string;
  type: 'file' | 'class' | 'function' | 'interface' | 'variable';
  name: string;
  filePath: string;
  lineNumber: number;
  dependencies: string[];
  dependents: string[];
  complexity: number;
  documentation?: string;
}

interface CodeEdge {
  source: string;
  target: string;
  type: 'imports' | 'extends' | 'implements' | 'calls' | 'references';
}

interface CodeGraph {
  nodes: CodeNode[];
  edges: CodeEdge[];
  summary: {
    totalFiles: number;
    totalClasses: number;
    totalFunctions: number;
    averageComplexity: number;
    entryPoints: string[];
  };
}

class CodeGraphAnalyzer {
  private project: Project;
  private nodes: Map<string, CodeNode> = new Map();
  private edges: CodeEdge[] = [];
  
  constructor(tsConfigPath: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
    });
  }
  
  /**
   * Analyze entire codebase and build graph
   */
  async analyze(): Promise<CodeGraph> {
    const sourceFiles = this.project.getSourceFiles();
    
    // First pass: Create nodes
    for (const file of sourceFiles) {
      this.analyzeFile(file);
    }
    
    // Second pass: Create edges (dependencies)
    for (const file of sourceFiles) {
      this.analyzeDependencies(file);
    }
    
    return this.buildGraph();
  }
  
  private analyzeFile(file: SourceFile): void {
    const filePath = file.getFilePath();
    
    // Analyze classes
    file.getClasses().forEach(cls => {
      this.addNode({
        id: `${filePath}#${cls.getName()}`,
        type: 'class',
        name: cls.getName() || 'Anonymous',
        filePath,
        lineNumber: cls.getStartLineNumber(),
        dependencies: [],
        dependents: [],
        complexity: this.calculateComplexity(cls),
        documentation: cls.getJsDocs()[0]?.getComment(),
      });
    });
    
    // Analyze functions
    file.getFunctions().forEach(func => {
      this.addNode({
        id: `${filePath}#${func.getName()}`,
        type: 'function',
        name: func.getName() || 'anonymous',
        filePath,
        lineNumber: func.getStartLineNumber(),
        dependencies: [],
        dependents: [],
        complexity: this.calculateFunctionComplexity(func),
        documentation: func.getJsDocs()[0]?.getComment(),
      });
    });
    
    // Analyze interfaces
    file.getInterfaces().forEach(iface => {
      this.addNode({
        id: `${filePath}#${iface.getName()}`,
        type: 'interface',
        name: iface.getName(),
        filePath,
        lineNumber: iface.getStartLineNumber(),
        dependencies: [],
        dependents: [],
        complexity: 1,
        documentation: iface.getJsDocs()[0]?.getComment(),
      });
    });
  }
  
  private analyzeDependencies(file: SourceFile): void {
    const filePath = file.getFilePath();
    
    // Analyze imports
    file.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      importDecl.getNamedImports().forEach(namedImport => {
        const name = namedImport.getName();
        this.addEdge({
          source: filePath,
          target: `${moduleSpecifier}#${name}`,
          type: 'imports',
        });
      });
    });
    
    // Analyze class inheritance
    file.getClasses().forEach(cls => {
      const baseClass = cls.getBaseClass();
      if (baseClass) {
        this.addEdge({
          source: `${filePath}#${cls.getName()}`,
          target: `${baseClass.getSourceFile().getFilePath()}#${baseClass.getName()}`,
          type: 'extends',
        });
      }
      
      // Analyze implemented interfaces
      cls.getImplements().forEach(impl => {
        this.addEdge({
          source: `${filePath}#${cls.getName()}`,
          target: `${filePath}#${impl.getText()}`,
          type: 'implements',
        });
      });
    });
  }
  
  private calculateComplexity(cls: ClassDeclaration): number {
    let complexity = 1;
    
    // Add complexity for methods
    cls.getMethods().forEach(method => {
      complexity += this.calculateFunctionComplexity(method);
    });
    
    // Add complexity for properties
    complexity += cls.getProperties().length * 0.5;
    
    return Math.round(complexity);
  }
  
  private calculateFunctionComplexity(func: FunctionDeclaration): number {
    const body = func.getBodyText() || '';
    let complexity = 1;
    
    // Count control flow statements
    complexity += (body.match(/if|else|else if/g) || []).length;
    complexity += (body.match(/for|while|do/g) || []).length;
    complexity += (body.match(/switch|case/g) || []).length;
    complexity += (body.match(/&&|\|\|/g) || []).length;
    complexity += (body.match(/catch/g) || []).length;
    
    return complexity;
  }
  
  private addNode(node: CodeNode): void {
    this.nodes.set(node.id, node);
  }
  
  private addEdge(edge: CodeEdge): void {
    this.edges.push(edge);
    
    // Update node relationships
    const sourceNode = this.nodes.get(edge.source);
    const targetNode = this.nodes.get(edge.target);
    
    if (sourceNode) {
      sourceNode.dependencies.push(edge.target);
    }
    if (targetNode) {
      targetNode.dependents.push(edge.source);
    }
  }
  
  private buildGraph(): CodeGraph {
    const nodes = Array.from(this.nodes.values());
    
    // Calculate summary statistics
    const summary = {
      totalFiles: new Set(nodes.map(n => n.filePath)).size,
      totalClasses: nodes.filter(n => n.type === 'class').length,
      totalFunctions: nodes.filter(n => n.type === 'function').length,
      averageComplexity: nodes.reduce((sum, n) => sum + n.complexity, 0) / nodes.length || 0,
      entryPoints: this.findEntryPoints(nodes),
    };
    
    return {
      nodes,
      edges: this.edges,
      summary,
    };
  }
  
  private findEntryPoints(nodes: CodeNode[]): string[] {
    // Find files with no dependents (top-level entry points)
    return nodes
      .filter(n => n.dependents.length === 0 && n.type === 'file')
      .map(n => n.filePath);
  }
  
  /**
   * Search for code by natural language query
   */
  search(query: string): CodeNode[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.nodes.values()).filter(node => {
      return (
        node.name.toLowerCase().includes(lowerQuery) ||
        node.documentation?.toLowerCase().includes(lowerQuery) ||
        node.filePath.toLowerCase().includes(lowerQuery)
      );
    });
  }
  
  /**
   * Get impact analysis for a change
   */
  getImpactAnalysis(nodeId: string): {
    direct: string[];
    indirect: string[];
    risk: 'low' | 'medium' | 'high';
  } {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { direct: [], indirect: [], risk: 'low' };
    }
    
    const direct = node.dependents;
    const indirect = new Set<string>();
    
    // Find indirect dependents (2 levels deep)
    direct.forEach(depId => {
      const depNode = this.nodes.get(depId);
      depNode?.dependents.forEach(indirectDep => {
        if (indirectDep !== nodeId) {
          indirect.add(indirectDep);
        }
      });
    });
    
    // Calculate risk
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (direct.length > 10 || indirect.size > 20) {
      risk = 'high';
    } else if (direct.length > 5 || indirect.size > 10) {
      risk = 'medium';
    }
    
    return {
      direct,
      indirect: Array.from(indirect),
      risk,
    };
  }
}

export { CodeGraphAnalyzer, CodeGraph, CodeNode, CodeEdge };
