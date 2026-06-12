# Work Orchestra — Project Copy
# ═══════════════════════════════════════════════════════
# GLOBAL VERSION LIVES AT: /Code-ai/work-orchestra.md
# (includes VSCode terminal instructions and updated agent prompt template)
#
# This is a project-local copy for convenience.
# Keep in sync with /Code-ai/work-orchestra.md.
# ═══════════════════════════════════════════════════════

## When to Use This Workflow

Use the **Work Orchestra** when:
- The project is too big or complex for one chat session (you'd run out of tokens)
- The work can be divided into independent modules
- You want parallel execution across multiple terminal tabs
- You need quality control with a final review pass
- You're working with research, publications, codebases, or any large deliverable

**Do NOT use** for:
- Quick tasks that fit in one conversation
- Simple Q&A or debugging
- Projects where everything depends on everything else (no parallelism possible)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              MAIN CHAT (Tab 0)                  │
│                                                 │
│   🧠 Conductor (Orchestrator / PM)              │
│   🔥 Brutal Critic (Adversarial Reviewer)       │
│                                                 │
│   → Plans the project                           │
│   → Creates agent instruction files             │
│   → Reviews each agent's output                 │
│   → Gives final approval                        │
│                                                 │
└────────────┬───────────┬───────────┬────────────┘
             │           │           │
        ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
        │ Tab 1  │  │ Tab 2  │  │ Tab 3  │  ...
        │Agent A │  │Agent B │  │Agent C │
        │        │  │        │  │        │
        │ Reads  │  │ Reads  │  │ Reads  │
        │ its .md│  │ its .md│  │ its .md│
        │        │  │        │  │        │
        │Writes  │  │Writes  │  │Writes  │
        │output  │  │output  │  │output  │
        │to disk │  │to disk │  │to disk │
        └────────┘  └────────┘  └────────┘
```

**The key insight:** Agents communicate through **files on disk**, not through shared memory. This makes the system **model-agnostic** — any AI (Claude, Gemini, GPT) can be any agent.

---

## Standard Project Structure

Every Work Orchestra project follows this directory layout:

```
project-name/
├── README.md                 ← What this project is
├── framework.md              ← Detailed specification & plan
├── relay-log.md              ← Concise progress updates (handoff baton)
├── .agents/
│   ├── project-hub.md        ← Shared brain (ALL agents read this first)
│   ├── agent-a1.md           ← Agent 1 instructions
│   ├── agent-a2.md           ← Agent 2 instructions
│   └── ...                   ← As many agents as needed
├── drafts/                   ← Work in progress
├── output/                   ← Final deliverables
└── research/                 ← Sources, references, data
```

### File Responsibilities

| File | Who writes it | Purpose |
|------|--------------|---------|
| `README.md` | Conductor (PM) | Explains the project to humans and GitHub |
| `framework.md` | Conductor (PM) | Full specification and plan |
| `relay-log.md` | Any active model | Tracks progress, enables handoffs between AI models |
| `project-hub.md` | Conductor (PM) | Shared rules, conventions, team roster, execution order |
| `agent-*.md` | Conductor (PM) | Specific mission for each agent |

---

## Step-by-Step Setup

### Step 1: Tell the Conductor what you want
Be specific: deliverable, quality standard, sections/modules, constraints.

### Step 2: Conductor creates the project structure
- Directory tree
- `project-hub.md` (shared brain)
- `framework.md` (spec)
- Agent instruction files
- `relay-log.md` (initial entry)

### Step 3: Execute in phases

```
Phase 1:  FOUNDATION   → Design system, templates, shared infrastructure
Phase 2:  CONTENT      → Independent modules in parallel (multiple tabs)
Phase 3:  ASSEMBLY     → Merge all outputs into final deliverable
Phase 4:  REVIEW       → Conductor + Brutal Critic adversarial audit
```

### Step 4: Review cycle
```
Agent finishes → User brings output to Conductor
                         ↓
              Conductor reviews
                    ↓           ↓
              APPROVED      REVISIONS NEEDED
                 ↓                ↓
          Update relay-log   Go back to agent tab
```

---

## Multi-Model Support

Since agents communicate through **files on disk**, any AI model can play any role:

```
Tab 0 (Main):  Claude  →  Conductor + Brutal Critic
Tab 1:         Gemini  →  Agent A1
Tab 2:         GPT     →  Agent A2
Tab 3:         Claude  →  Agent A3
```

### Rules when mixing models
1. Each agent stays in its own tab — don't mix models within a single agent's work
2. The Conductor reviews ALL output — catches inconsistencies
3. If an agent needs revision, return to the SAME tab/model
4. The `relay-log.md` enables handoffs when switching Conductor models

---

## Model Handoff Protocol

When the Conductor's tokens run out and you must switch to another AI model:

1. The current Conductor updates `relay-log.md` with latest status
2. Open a new terminal with the new model
3. Tell it: *"Read conductor.md and relay-log.md for this project. Continue from where we left off."*
4. The new model picks up seamlessly
5. When the original model gets tokens back, it reads `relay-log.md` to see what changed

---

## Agent Prompt Template

```
You are Agent [NAME] — [ROLE].

PROJECT DIRECTORY: [full path]

BOOT SEQUENCE:
1. Read .agents/project-hub.md (shared project brain)
2. Read .agents/agent-[name].md (your mission)
3. Read any prerequisite files mentioned
4. Execute your full mission
5. Write output to your assigned file
6. Tell me when done

Do NOT ask for clarification. Execute fully.
```

---

## Key Principles

1. **Files are the API** — all communication happens through the filesystem
2. **Each agent has ONE job** — clear scope, clear output file
3. **The Conductor sees everything** — reviews all output before proceeding
4. **Model-agnostic by design** — use any AI model for any role
5. **No agent overwrites another's file** — strict file ownership
6. **Brutal Critic is non-negotiable** — every project gets adversarial review
7. **relay-log.md is the handoff baton** — keeps progress between model switches
8. **project-hub.md is the contract** — source of truth for all agents
