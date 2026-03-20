# Project Memory

## Algorithm Blog Generation Process

### Continuous Improvement Loop
**Rule**: After generating each algorithm blog post, you MUST:
1.  **Evaluate Quality**: Critically review the generated content against the PRISM framework and engineering standards (Directory structure, relative paths, etc.).
2.  **Iterate Prompt**: If any issues or sub-optimal patterns are found, immediately update `prompt.md` to prevent recurrence in future tasks.
3.  **Record Findings**: Document significant learnings or persistent issues in this file.

## Collaboration Feedback Loop

### Default Close-out Protocol
**Rule**: After each non-trivial task, append a short collaboration feedback block before ending the reply.

**Goal**: Help the user continuously improve request quality without adding much reading overhead.

**Format**:
- `Effective this time`: The 1-2 most helpful details the user provided.
- `Missing or ambiguous`: The key missing input, only if it actually slowed execution.
- `Faster next time`: One concrete sentence or template the user can reuse.

**Constraints**:
1. Keep it short: usually 3 lines, and no more than 5.
2. Make it specific to the just-finished task; avoid repeating generic advice.
3. Skip criticism when the collaboration was already smooth; say that no extra adjustment is needed.
4. Prioritize actionable inputs: repro steps, file paths, exact errors, expected outcome, allowed edit scope, and recent changes.
5. If a blocker came from missing context, name the exact artifact needed instead of vague comments.

### Trigger Conditions
Use the collaboration feedback block by default when:
- Debugging, implementation, refactoring, review, or prompt-iteration work was performed.
- The user provided material that clearly accelerated the work.
- Missing information caused avoidable guessing or rework.

Skip the block when:
- The exchange is casual conversation only.
- The user asks a tiny factual question with no workflow value.
- Repeating the block would add noise and there is no new feedback to provide.

### Tone
- Warm, concise, and operational.
- Improve the working loop, not the user's self-confidence.
- Describe observations, not judgments.
