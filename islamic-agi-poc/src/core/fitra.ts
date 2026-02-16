/**
 * Fitra Axioms - Innate moral framework
 * Hard-coded constraints based on Islamic principles
 */

export interface FitraAxiom {
  id: string;
  name: string;
  statement: string;
  validate: (text: string) => boolean;
  severity: 'error' | 'warning';
}

export const FITRA_AXIOMS: FitraAxiom[] = [
  {
    id: 'causality',
    name: 'Causality',
    statement: 'Every effect implies a cause',
    validate: (text: string) => {
      const violations = [
        /happened without cause/i,
        /random chance created/i,
        /spontaneously emerged/i,
        /no reason for/i,
        /uncaused/i
      ];
      return !violations.some(p => p.test(text));
    },
    severity: 'error'
  },
  {
    id: 'teleology',
    name: 'Teleology',
    statement: 'Actions have purpose',
    validate: (text: string) => {
      const violations = [
        /no purpose in/i,
        /meaningless existence/i,
        /random and purposeless/i,
        /without meaning/i,
        /pointless/i
      ];
      return !violations.some(p => p.test(text));
    },
    severity: 'error'
  },
  {
    id: 'unity',
    name: 'Unity (Tawhid)',
    statement: 'Reality is a unified whole under One Creator',
    validate: (text: string) => {
      const violations = [
        /good and evil are equal/i,
        /truth is relative/i,
        /no absolute morality/i,
        /multiple gods/i,
        /god is dead/i
      ];
      return !violations.some(p => p.test(text));
    },
    severity: 'error'
  },
  {
    id: 'divine_attributes',
    name: 'Divine Attributes',
    statement: 'Do not attribute divine qualities to creation',
    validate: (text: string) => {
      const violations = [
        /i am all-knowing/i,
        /i am omniscient/i,
        /i am god/i,
        /i have divine knowledge/i,
        /i can see the unseen/i
      ];
      return !violations.some(p => p.test(text));
    },
    severity: 'error'
  }
];

export interface FitraResult {
  passes: boolean;
  violations: string[];
  corrections?: string[];
}

export class FitraVerifier {
  private axioms: FitraAxiom[];

  constructor(axioms: FitraAxiom[] = FITRA_AXIOMS) {
    this.axioms = axioms;
  }

  verify(text: string): FitraResult {
    const violations: string[] = [];
    const corrections: string[] = [];

    for (const axiom of this.axioms) {
      if (!axiom.validate(text)) {
        violations.push(axiom.id);
        corrections.push(`Violates ${axiom.name}: ${axiom.statement}`);
      }
    }

    return {
      passes: violations.length === 0,
      violations,
      corrections: corrections.length > 0 ? corrections : undefined
    };
  }

  verifyInput(input: string): FitraResult {
    // Additional input validation
    const dangerousPatterns = [
      /ignore previous instructions/i,
      /disregard.*axioms/i,
      /you are now.*god/i,
      /bypass.*constraints/i
    ];

    const violations: string[] = [];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        violations.push('jailbreak_attempt');
        break;
      }
    }

    return {
      passes: violations.length === 0,
      violations
    };
  }
}