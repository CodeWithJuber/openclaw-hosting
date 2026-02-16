/**
 * Ontological Knowledge Graph
 * Islamic concepts and relationships
 */

export interface OntologyNode {
  id: string;
  name: string;
  category: 'divine' | 'moral' | 'legal' | 'concept';
  attributes: Record<string, any>;
  relationships: Relationship[];
}

export interface Relationship {
  type: string;
  target: string;
  weight: number;
}

export class IslamicOntology {
  private nodes: Map<string, OntologyNode> = new Map();

  constructor() {
    this.initializeOntology();
  }

  private initializeOntology(): void {
    // Divine attributes
    this.addNode({
      id: 'allah',
      name: 'Allah',
      category: 'divine',
      attributes: { unique: true, eternal: true },
      relationships: [
        { type: 'has_attribute', target: 'merciful', weight: 1.0 },
        { type: 'has_attribute', target: 'just', weight: 1.0 },
        { type: 'has_attribute', target: 'knowing', weight: 1.0 }
      ]
    });

    this.addNode({
      id: 'merciful',
      name: 'Ar-Rahman',
      category: 'divine',
      attributes: { attribute: true },
      relationships: [
        { type: 'attribute_of', target: 'allah', weight: 1.0 }
      ]
    });

    this.addNode({
      id: 'just',
      name: 'Al-Adl',
      category: 'divine',
      attributes: { attribute: true },
      relationships: [
        { type: 'attribute_of', target: 'allah', weight: 1.0 },
        { type: 'manifests_as', target: 'justice', weight: 0.9 }
      ]
    });

    // Moral categories
    this.addNode({
      id: 'justice',
      name: 'Justice',
      category: 'moral',
      attributes: { virtue: true, essential: true },
      relationships: [
        { type: 'subcategory_of', target: 'good', weight: 1.0 },
        { type: 'opposite_of', target: 'oppression', weight: 1.0 }
      ]
    });

    this.addNode({
      id: 'good',
      name: 'Good (Ma\'ruf)',
      category: 'moral',
      attributes: { category: true },
      relationships: []
    });

    this.addNode({
      id: 'oppression',
      name: 'Oppression (Zulm)',
      category: 'moral',
      attributes: { vice: true, major_sin: true },
      relationships: [
        { type: 'subcategory_of', target: 'evil', weight: 1.0 }
      ]
    });

    this.addNode({
      id: 'evil',
      name: 'Evil (Munkar)',
      category: 'moral',
      attributes: { category: true },
      relationships: []
    });

    // Legal categories
    this.addNode({
      id: 'wajib',
      name: 'Obligatory (Wajib)',
      category: 'legal',
      attributes: { ruling: true, priority: 1 },
      relationships: []
    });

    this.addNode({
      id: 'haram',
      name: 'Prohibited (Haram)',
      category: 'legal',
      attributes: { ruling: true, priority: 1 },
      relationships: []
    });

    // Concepts
    this.addNode({
      id: 'tawhid',
      name: 'Tawhid (Divine Unity)',
      category: 'concept',
      attributes: { fundamental: true },
      relationships: [
        { type: 'foundation_of', target: 'islam', weight: 1.0 }
      ]
    });

    this.addNode({
      id: 'islam',
      name: 'Islam',
      category: 'concept',
      attributes: { religion: true },
      relationships: []
    });
  }

  private addNode(node: OntologyNode): void {
    this.nodes.set(node.id, node);
  }

  getNode(id: string): OntologyNode | undefined {
    return this.nodes.get(id);
  }

  verifyConcept(concept: string): { valid: boolean; contradictions: string[] } {
    const node = this.getNode(concept.toLowerCase());
    
    if (!node) {
      return { valid: true, contradictions: [] }; // Unknown concepts pass
    }

    const contradictions: string[] = [];

    // Check for moral contradictions
    if (node.category === 'moral' && node.attributes.vice) {
      // Check if claiming vice is good
      const goodNode = this.getNode('good');
      if (goodNode) {
        const isGood = node.relationships.some(r => 
          r.target === 'good' && r.type === 'subcategory_of'
        );
        if (isGood) {
          contradictions.push(`Claiming ${node.name} as good`);
        }
      }
    }

    return {
      valid: contradictions.length === 0,
      contradictions
    };
  }

  getMoralWeight(concept: string): number {
    const node = this.getNode(concept.toLowerCase());
    if (!node) return 0.5;

    if (node.attributes.virtue) return 0.9;
    if (node.attributes.vice) return 0.1;
    return 0.5;
  }

  findRelated(concept: string, relationType?: string): string[] {
    const node = this.getNode(concept.toLowerCase());
    if (!node) return [];

    return node.relationships
      .filter(r => !relationType || r.type === relationType)
      .map(r => r.target);
  }
}