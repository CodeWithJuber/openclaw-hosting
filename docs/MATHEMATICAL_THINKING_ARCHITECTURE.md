# Mathematical Thinking AI Architecture

## Overview

An AI architecture for mathematical thinking based on David Tall's "Three Worlds of Mathematics" framework.

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATHEMATICAL THINKING AI                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  EMBODIED   │  │ PROCEPTUAL  │  │        FORMAL           │  │
│  │    WORLD    │  │    WORLD    │  │        WORLD            │  │
│  │  (Layer 1)  │  │  (Layer 2)  │  │      (Layer 3)          │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                │
│         ▼                ▼                     ▼                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              INTEGRATION & COORDINATION                  │   │
│  │         (Proceptual Flexibility Engine)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              METACOGNITIVE MONITOR                       │   │
│  │     (Self-awareness, Reflection, Strategy Selection)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Embodied World

### Purpose
Ground mathematical concepts in physical, sensory, and spatial experiences.

### Components

```typescript
interface EmbodiedWorld {
  // Visual Processing
  visualSystem: {
    shapeRecognition: ShapeAnalyzer;
    patternDetection: PatternMatcher;
    spatialRelations: SpatialReasoner;
    diagramUnderstanding: DiagramParser;
  };

  // Physical Simulation
  physicsEngine: {
    mechanics: PhysicsSimulator;
    motion: MotionAnalyzer;
    causality: CausalReasoner;
  };

  // Spatial Reasoning
  spatialSystem: {
    mentalRotation: RotationEngine;
    navigation: PathPlanner;
    scaleEstimation: ScaleAnalyzer;
    topology: TopologyEngine;
  };

  // Sensory Grounding
  sensoryGrounding: {
    magnitudeEstimation: MagnitudeEstimator;
    proportionIntuition: ProportionAnalyzer;
    quantitySense: QuantityEstimator;
  };
}
```

### Example: Understanding "Circle"

```typescript
class CircleEmbodied {
  // Visual representation
  visualize(): VisualModel {
    return {
      shape: 'round',
      center: Point,
      radius: Distance,
      symmetry: 'infinite_rotational'
    };
  }

  // Physical intuition
  physicalProperties(): PhysicalIntuition {
    return {
      rollsSmoothly: true,
      constantWidth: true,
      optimalEnclosure: true  // maximum area for given perimeter
    };
  }

  // Spatial understanding
  spatialRelations(): SpatialModel {
    return {
      allPointsEquidistant: true,
      centerIsReference: true,
      radiusDefinesBoundary: true
    };
  }
}
```

---

## Layer 2: Proceptual World

### Purpose
Enable symbols to function as BOTH process AND concept seamlessly.

### Components

```typescript
interface ProceptualWorld {
  // Symbol System
  symbolSystem: {
    notationParser: NotationParser;
    expressionBuilder: ExpressionBuilder;
    equivalenceChecker: EquivalenceEngine;
  };

  // Process-Concept Duality
  proceptEngine: {
    processView: ProcessInterpreter;    // "How to compute"
    conceptView: ConceptInterpreter;    // "What it means"
    switchMechanism: ViewSwitcher;      // Seamless switching
  };

  // Compression System
  compressionEngine: {
    procedureCompressor: Compressor;    // Long → Short
    patternAbstractor: Abstractor;      // Specific → General
    chunkingSystem: Chunker;            // Group related operations
  };

  // Representation Manager
  representationSystem: {
    multipleViews: ViewManager;         // Graph, table, formula, text
    translation: Translator;            // Between representations
    optimalSelector: Selector;          // Best view for context
  };
}
```

### Example: The Procept "3+2"

```typescript
class AdditionProcept {
  symbol = "3+2";

  // PROCESS VIEW: How to compute
  asProcess(): Computation {
    return {
      steps: [
        "Start with 3",
        "Add 1 → 4",
        "Add 1 → 5"
      ],
      operation: "incremental_addition",
      algorithm: "count_on"
    };
  }

  // CONCEPT VIEW: What it represents
  asConcept(): MathematicalObject {
    return {
      value: 5,
      properties: {
        isSum: true,
        addends: [3, 2],
        magnitude: 5,
        parity: 'odd'
      }
    };
  }

  // Context-aware switching
  interpret(context: Context): View {
    if (context.needsComputation()) {
      return this.asProcess();
    } else if (context.needsProperties()) {
      return this.asConcept();
    } else if (context.isAlgebraic()) {
      return this.asPattern();  // "a+b where a=3, b=2"
    }
  }
}
```

### Compression Example

```typescript
class CompressionSystem {
  // Level 0: Uncompressed procedure
  level0 = "3+3+3+3+3";  // Add 3 five times

  // Level 1: Compressed to multiplication
  level1 = "5×3";        // Five groups of 3

  // Level 2: Compressed to result
  level2 = "15";         // The product

  // Level 3: Pattern recognition
  level3 = "5n where n=3";  // General pattern

  compress(input: Expression): Compressed {
    if (this.isRepeatedAddition(input)) {
      return this.toMultiplication(input);
    }
    if (this.hasKnownResult(input)) {
      return this.toResult(input);
    }
    if (this.detectsPattern(input)) {
      return this.toGeneralForm(input);
    }
  }
}
```

---

## Layer 3: Formal World

### Purpose
Enable abstract logical reasoning, definitions, and proofs.

### Components

```typescript
interface FormalWorld {
  // Axiom System
  axiomManager: {
    definitionStore: DefinitionDatabase;
    axiomBase: AxiomSet;
    theoryOrganizer: TheoryManager;
  };

  // Proof Engine
  proofSystem: {
    theoremProver: Prover;
    proofAssistant: Assistant;
    verification: Verifier;
  };

  // Logical Inference
  inferenceEngine: {
    deduction: DeductiveReasoner;
    induction: InductiveReasoner;
    abduction: AbductiveReasoner;
  };

  // Structure Analysis
  structureAnalyzer: {
    algebraicStructure: AlgebraAnalyzer;
    topologicalStructure: TopologyAnalyzer;
    orderStructure: OrderAnalyzer;
  };
}
```

### Example: Formal Definition of Limit

```typescript
class LimitFormal {
  // Formal definition
  definition = `
    lim(x→a) f(x) = L means:
    ∀ε > 0, ∃δ > 0 such that:
    0 < |x - a| < δ ⟹ |f(x) - L| < ε
  `;

  // Logical structure
  logicalStructure(): Logic {
    return {
      quantifiers: ['∀ε', '∃δ'],
      condition: '0 < |x - a| < δ',
      conclusion: '|f(x) - L| < ε',
      type: 'epsilon_delta_definition'
    };
  }

  // Proof strategy
  proofStrategy(): Strategy {
    return {
      given: 'ε > 0',
      find: 'δ in terms of ε',
      verify: 'implication holds',
      technique: 'algebraic_manipulation'
    };
  }

  // Connection to embodied understanding
  embodiedIntuition(): string {
    return "No matter how close (ε) you want f(x) to be to L, " +
           "you can find a distance (δ) around a where all x " +
           "keep f(x) within that closeness.";
  }
}
```

---

## Integration Layer: Proceptual Flexibility Engine

### Purpose
Seamlessly move between worlds and views based on context.

```typescript
interface IntegrationLayer {
  // World Coordinator
  worldCoordinator: {
    // Move between worlds
    toEmbodied(formal: Formal): Embodied;
    toProceptual(embodied: Embodied): Proceptual;
    toFormal(proceptual: Proceptual): Formal;
    
    // Maintain connections
    maintainLinks(): ConnectionMap;
  };

  // Context Analyzer
  contextAnalyzer: {
    detectContext(input: Input): Context;
    determineRequiredWorld(context: Context): World;
    assessDifficulty(level: Level): Strategy;
  };

  // Flexibility Engine
  flexibilityEngine: {
    switchView(current: View, target: View): View;
    blendRepresentations(views: View[]): BlendedView;
    translateBetween(form: Form, to: Form): Translation;
  };
}
```

### Example: Solving "What is the area of a circle with radius 3?"

```typescript
class IntegratedSolver {
  solve(problem: Problem): Solution {
    // Step 1: Embodied understanding
    const circle = this.embodied.visualizeCircle(radius: 3);
    // "A round shape, about this big [mental image]"

    // Step 2: Proceptual activation
    const formula = this.proceptual.recall("A = πr²");
    // Process: "Square the radius, multiply by π"
    // Concept: "The area is π times r-squared"

    // Step 3: Formal verification (if needed)
    const proof = this.formal.verifyAreaFormula();
    // "By integration: ∫∫ 1 dA over circle = πr²"

    // Step 4: Compute
    const result = this.proceptual.compute(formula, {r: 3});
    // 9π ≈ 28.27

    // Step 5: Embodied verification
    const estimate = this.embodied.estimateArea(circle);
    // "About 28 square units, seems right"

    return {
      exact: "9π",
      approximate: 28.27,
      confidence: this.verifyConsistency([result, estimate])
    };
  }
}
```

---

## Metacognitive Monitor

### Purpose
Self-awareness, reflection, and strategic decision-making.

```typescript
interface MetacognitiveMonitor {
  // Self-Assessment
  selfAssessment: {
    confidenceEstimator: ConfidenceCalculator;
    knowledgeChecker: KnowledgeVerifier;
    errorDetector: ErrorAnalyzer;
  };

  // Strategy Selection
  strategySelector: {
    chooseWorld(context: Context): World;
    chooseRepresentation(concept: Concept): Representation;
    chooseMethod(problem: Problem): Method;
  };

  // Reflection
  reflectionEngine: {
    explainReasoning(): Explanation;
    identifyMistakes(): Mistake[];
    suggestAlternatives(): Strategy[];
  };

  // Learning
  learningTracker: {
    identifyGaps(): KnowledgeGap[];
    suggestPractice(): Exercise[];
    updateModel(feedback: Feedback): void;
  };
}
```

### Example: Metacognitive Monitoring

```typescript
class MetacognitiveExample {
  solvingProblem(problem: Problem) {
    // Monitor confidence
    const confidence = this.metacognitive.assessConfidence();
    
    if (confidence < 0.7) {
      // Switch to more concrete representation
      this.integration.switchTo(World.EMBODIED);
    }

    // Check for errors
    const solution = this.solve(problem);
    const errors = this.metacognitive.checkSolution(solution);
    
    if (errors.length > 0) {
      // Reflect and retry
      const explanation = this.metacognitive.explainMistake(errors[0]);
      return this.solveWithStrategy(problem, explanation.suggestedApproach);
    }

    // Explain reasoning
    return {
      answer: solution,
      explanation: this.metacognitive.explainReasoning(),
      confidence: confidence
    };
  }
}
```

---

## Learning Progression

```
NOVICE → INTERMEDIATE → EXPERT

Embodied:
  Physical → Mental → Automatic
  [blocks] → [mental images] → [instant intuition]

Proceptual:
  Procedure → Procept → Compressed
  [step-by-step] → [flexible symbol] → [chunked patterns]

Formal:
  Examples → Patterns → Proofs
  [specific cases] → [general forms] → [axiomatic systems]
```

---

## Implementation Roadmap

### Phase 1: Embodied Foundation
- [ ] Visual geometry system
- [ ] Spatial reasoning engine
- [ ] Physical simulation basics

### Phase 2: Proceptual Core
- [ ] Symbolic manipulation
- [ ] Process-concept duality
- [ ] Compression mechanisms

### Phase 3: Formal System
- [ ] Theorem prover integration
- [ ] Axiom management
- [ ] Proof assistance

### Phase 4: Integration
- [ ] World coordination
- [ ] Context awareness
- [ ] Flexible switching

### Phase 5: Metacognition
- [ ] Self-assessment
- [ ] Strategy selection
- [ ] Learning tracking

---

## Key Design Principles

1. **Multi-World Representation**: Every concept exists in all three worlds
2. **Proceptual Flexibility**: Seamless switching between process and concept views
3. **Progressive Compression**: Start explicit, become compressed with experience
4. **Embodied Grounding**: Abstract concepts linked to physical intuition
5. **Metacognitive Awareness**: System knows what it knows and doesn't know

---

## Success Metrics

| Capability | Test | Target |
|------------|------|--------|
| Embodied Grounding | Visual geometry problems | 90%+ accuracy |
| Proceptual Flexibility | Explain both "how" and "what" | Natural switching |
| Formal Reasoning | Proof verification | Correct verification |
| Integration | Multi-representation problems | Seamless coordination |
| Metacognition | Confidence calibration | Well-calibrated |
