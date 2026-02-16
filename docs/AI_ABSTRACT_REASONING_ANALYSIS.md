# AI Abstract Reasoning Analysis - ConceptARC Benchmark

**Paper**: "Do AI Models Perform Human-like Abstract Reasoning Across Modalities?"  
**arXiv**: 2510.02125v4  
**Authors**: Ryan Yi, Shuhao Fu, Kaleda Denton, et al. (Sandia National Labs)  
**Key Finding**: AI models use "shortcuts" rather than human-like abstractions

---

## Executive Summary

While OpenAI's o3 achieved 88% on ARC-AGI (exceeding human performance), this paper reveals that **high accuracy ≠ human-like reasoning**. AI models frequently rely on surface-level "shortcuts" rather than the intended abstract concepts.

**Critical Insight**:
- **Textual modality**: Accuracy OVERESTIMATES true reasoning capability
- **Visual modality**: Accuracy UNDERESTIMATES true reasoning capability
- Models often use unintended patterns (numerical relationships, pixel-level features) rather than object-level abstractions

---

## The ConceptARC Benchmark

### What is ConceptARC?
- Simpler version of ARC (Abstraction and Reasoning Corpus)
- 16 basic spatial/semantic concepts
- 30 tasks per concept = 480 total tasks
- Designed to isolate single abstract concepts

### Example Concepts:
- "Inside and outside"
- "Above and below"
- "Same vs. different"
- "Top vs. bottom"
- "Center"

### Human Performance:
- **91% accuracy** on ConceptARC
- **64% accuracy** on full ARC (harder)

---

## Key Findings

### 1. Accuracy vs. True Understanding

**The Problem**: Models can get correct answers for wrong reasons

| Model | Text Accuracy | Visual Accuracy | Human-like Rules? |
|-------|--------------|-----------------|-------------------|
| **o3 (medium + tools)** | 75.6% | 29.2% | Only ~57% |
| **o4-mini (medium + tools)** | 77.7% | 25.0% | Lower |
| **Claude Sonnet 4** | 55.0% | 6.9% | Better ratio |
| **Gemini 2.5 Pro** | 60.4% | 5.8% | Better ratio |
| **Humans** | 73% | ~73% | ~92% |

### 2. Rule Classification Results

For each task, models generate natural-language rules. These were classified as:

**Correct-Intended** ✅
- Captures the intended abstraction
- Example: "Remove the topmost and bottommost colored regions"

**Correct-Unintended** ⚠️
- Works on demonstrations but wrong abstraction
- Example: "Sort shapes by size and color value, remove first two"
- Uses numerical relationships (0-9 color codes) as features

**Incorrect** ❌
- Doesn't correctly describe demonstrations

### 3. The Shortcut Problem

**o3 with textual input**:
- 75.6% accuracy (correct grids)
- But **27% of correct outputs** used unintended shortcuts!
- Only ~57% of rules captured intended abstractions

**Humans**:
- 73% accuracy
- Only **8% of correct outputs** used unintended shortcuts
- ~92% of rules captured intended abstractions

**Key Quote**:
> "AI models appear much more likely than humans to miss intended abstractions and instead solve tasks using more superficial features."

### 4. Visual Modality Surprise

**Finding**: Visual accuracy drops sharply, BUT...

Models often **know the right rule** but can't apply it:
- o3: 28% of incorrect grids had correct-intended rules
- Claude: Similar pattern
- Gemini: Similar pattern

**Interpretation**: Visual perception is the bottleneck, not reasoning!

---

## Concrete Examples

### Example 1: "Top vs. Bottom" Task

**Human Rule** (Correct-Intended):
> "Remove the top object and the bottom object only."

**Claude Rule** (Correct-Intended):
> "Remove the topmost and bottommost colored regions, keep all colored regions in between."

**Gemini Rule** (Correct-Unintended):
> "Sort shapes by size (number of cells) in ascending order, then by color value. Remove the two shapes that come first in this sorted list."

**Problem**: Gemini uses integer color codes (0-9) as meaningful features, which is an unintended shortcut.

### Example 2: "Center" Task

**Human Rule** (Correct-Intended):
> "Select the colour that is in the middle of the input. Only output that colour as a 1×1 grid."

**o3 Rule** (Correct-Intended):
> "Return the middle element of the 1-D input list (index ⌊n/2⌋ for odd length) as a single-value output grid."

**Claude Rule** (Correct-Unintended):
> "Find all values that appear with the minimum frequency in the input grid, sort them in ascending order, then return the second smallest value if multiple values exist, or the only value if just one exists."

**Problem**: Claude uses frequency analysis and numerical sorting instead of spatial "center" concept.

---

## Implications for OpenClaw

### 1. Don't Trust Accuracy Alone

```typescript
// BAD: Only check if output is correct
if (output === expectedOutput) {
  return { success: true };
}

// GOOD: Also evaluate the reasoning
const evaluation = {
  outputCorrect: output === expectedOutput,
  ruleQuality: classifyRule(generatedRule),
  abstractionMatch: checkAbstractionMatch(generatedRule, intendedConcept),
  shortcutDetected: detectShortcuts(generatedRule)
};
```

### 2. Implement Rule-Based Evaluation

```typescript
interface ReasoningEvaluation {
  // Traditional metric
  outputAccuracy: number;
  
  // New metrics
  ruleCorrectness: 'intended' | 'unintended' | 'incorrect';
  abstractionFidelity: number; // 0-1
  shortcutDependency: string[]; // List of shortcuts used
  generalizationPotential: number; // Would rule work on variations?
}

async function evaluateAgentReasoning(
  task: Task,
  agentOutput: Output,
  agentRule: string
): Promise<ReasoningEvaluation> {
  // Check output correctness
  const outputCorrect = checkOutputCorrectness(agentOutput, task.expected);
  
  // Classify the rule
  const ruleClassification = await classifyRule(agentRule, task.intendedConcept);
  
  // Detect shortcuts
  const shortcuts = detectShortcutPatterns(agentRule);
  
  // Test generalization
  const generalizationScore = await testGeneralization(agentRule, task.variations);
  
  return {
    outputAccuracy: outputCorrect ? 1 : 0,
    ruleCorrectness: ruleClassification,
    abstractionFidelity: calculateFidelity(agentRule, task.intendedConcept),
    shortcutDependency: shortcuts,
    generalizationPotential: generalizationScore
  };
}
```

### 3. Build Abstraction-Aware Agents

```typescript
class AbstractionAwareAgent {
  private conceptLibrary: Map<string, Concept>;
  
  async solveWithExplanation(task: Task): Promise<Solution> {
    // Step 1: Generate candidate rules
    const candidateRules = await this.generateCandidateRules(task);
    
    // Step 2: Evaluate each rule for abstraction quality
    const evaluatedRules = await Promise.all(
      candidateRules.map(async rule => ({
        rule,
        abstractionScore: await this.scoreAbstractionQuality(rule),
        shortcutScore: await this.detectShortcuts(rule),
        generalizationScore: await this.testGeneralization(rule, task)
      }))
    );
    
    // Step 3: Select rule with best abstraction (not just accuracy)
    const bestRule = evaluatedRules
      .sort((a, b) => 
        (b.abstractionScore - b.shortcutScore) - 
        (a.abstractionScore - a.shortcutScore)
      )[0];
    
    // Step 4: Apply selected rule
    const output = await this.applyRule(bestRule.rule, task);
    
    return {
      output,
      rule: bestRule.rule,
      explanation: this.generateExplanation(bestRule),
      confidence: bestRule.abstractionScore
    };
  }
  
  private async scoreAbstractionQuality(rule: string): Promise<number> {
    // Check if rule uses object-level concepts
    const objectLevelTerms = ['object', 'shape', 'region', 'top', 'bottom', 'center'];
    const pixelLevelTerms = ['pixel', 'cell', 'value', 'number', 'color code'];
    
    const objectScore = objectLevelTerms.filter(t => rule.includes(t)).length;
    const pixelScore = pixelLevelTerms.filter(t => rule.includes(t)).length;
    
    return objectScore / (objectScore + pixelScore + 1);
  }
}
```

### 4. Multi-Modal Reasoning Strategy

```typescript
// Based on paper's findings: Visual perception is the bottleneck
async function solveMultimodal(task: Task): Promise<Solution> {
  // Strategy 1: Use visual modality for understanding
  const visualUnderstanding = await this.analyzeVisual(task.image);
  
  // Strategy 2: Convert to textual representation for reasoning
  const textualRepresentation = this.convertToText(visualUnderstanding);
  
  // Strategy 3: Apply reasoning in textual domain (where models are stronger)
  const reasoning = await this.reasonOverText(textualRepresentation);
  
  // Strategy 4: Validate in visual domain
  const validation = await this.validateVisually(reasoning, task.image);
  
  return {
    output: reasoning.output,
    visualValidation: validation.passed,
    confidence: validation.confidence
  };
}
```

---

## Recommendations for Benchmarking

### 1. Beyond Accuracy Metrics

```typescript
// Traditional evaluation
const accuracy = correctOutputs / totalTasks;

// Abstraction-aware evaluation
const evaluation = {
  accuracy,
  intendedAbstractionRate: rulesClassifiedAsIntended / totalTasks,
  shortcutDependencyRate: rulesWithShortcuts / totalTasks,
  generalizationScore: averageGeneralizationScore,
  humanAlignmentScore: similarityToHumanRules
};
```

### 2. Rule Collection Protocol

```typescript
// Always collect reasoning, not just outputs
interface TaskResult {
  taskId: string;
  output: Grid;
  isCorrect: boolean;
  
  // Critical: collect the rule
  generatedRule: string;
  ruleClassification: 'intended' | 'unintended' | 'incorrect';
  
  // Metadata
  modality: 'text' | 'visual';
  reasoningEffort: number;
  toolsUsed: string[];
}
```

### 3. Generalization Testing

```typescript
// Test if rule generalizes to task variations
async function testGeneralization(
  rule: string, 
  originalTask: Task
): Promise<number> {
  const variations = generateVariations(originalTask, {
    colorChanges: true,
    sizeChanges: true,
    positionChanges: true,
    objectCountChanges: true
  });
  
  let correctCount = 0;
  for (const variation of variations) {
    const output = await applyRule(rule, variation);
    if (checkCorrectness(output, variation.expected)) {
      correctCount++;
    }
  }
  
  return correctCount / variations.length;
}
```

---

## Key Takeaways

### For AI Developers:

1. **Don't be fooled by accuracy** - High scores may hide shortcut learning
2. **Collect reasoning traces** - Rules reveal true understanding
3. **Test generalization** - Correct answers should work on variations
4. **Multi-modal evaluation** - Visual and textual modalities tell different stories

### For OpenClaw Specifically:

1. **Add rule generation** - Agents should explain their reasoning
2. **Evaluate abstractions** - Check if reasoning matches intended concepts
3. **Detect shortcuts** - Flag reliance on spurious patterns
4. **Visual reasoning** - Investigate perception-reasoning gap

### Research Direction:

The paper suggests future work on:
- Process-based reward models
- Human reasoning traces in training
- Compositional reasoning (ARC-AGI-2)
- Improving visual reasoning capabilities

---

## Conclusion

**Main Insight**: 
> "Using accuracy alone to evaluate abstract reasoning can substantially overestimate AI capabilities in textual modalities and underestimate it in visual modalities."

**For OpenClaw**:
- Implement rule-based evaluation
- Don't rely solely on output correctness
- Build abstraction-aware agents
- Test generalization, not just accuracy

**Bottom Line**: We need to look beyond "did it get the right answer?" to "did it understand the right concept?"

---

**Paper**: https://arxiv.org/abs/2510.02125  
**Status**: Analysis complete  
**Implications**: High - Changes how we evaluate agent reasoning
