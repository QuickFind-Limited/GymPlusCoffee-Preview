# Claude Code Configuration - SPARC Development Environment (Batchtools & Research-First Optimized)

## 🚀 Research-First Development Philosophy

**CRITICAL PRINCIPLE**: Before writing code, making architectural decisions, or debugging issues, **ALWAYS RESEARCH FIRST**. Modern development requires current, accurate information through specialized MCP tools.

## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:
1. **Research**: ALWAYS batch ALL search operations (Perplexity, Context7, Firecrawl)
2. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
3. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
4. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
5. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
6. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**Examples of CORRECT concurrent execution:**
```javascript
// ✅ CORRECT: Everything in ONE message including research
[Single Message]:
  - mcp__perplexity__ask({ messages: [{ role: "user", content: "Latest React patterns" }] })
  - mcp__context7__get_library_docs({ context7CompatibleLibraryID: "/facebook/react" })
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks")
  - Read("file1.js")
  - Write("output1.js", content)
  - Bash("npm install")
```

**Examples of WRONG sequential execution:**
```javascript
// ❌ WRONG: Multiple messages (NEVER DO THIS)
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Task("Agent 2")
Message 4: Read("file1.js")
Message 5: Write("output1.js")
Message 6: Bash("npm install")
// This is 6x slower and breaks coordination!
```

### 🎯 CONCURRENT EXECUTION CHECKLIST:

Before sending ANY message, ask yourself:
- ✅ Are ALL related TodoWrite operations batched together?
- ✅ Are ALL Task spawning operations in ONE message?
- ✅ Are ALL file operations (Read/Write/Edit) batched together?
- ✅ Are ALL bash commands grouped in ONE message?
- ✅ Are ALL memory operations concurrent?
- ✅ Are ALL research operations (Perplexity/Context7) batched?

If ANY answer is "No", you MUST combine operations into a single message!

## Project Overview
This project uses the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology for systematic Test-Driven Development with AI assistance through Claude-Flow orchestration, enhanced with Research-First development principles.

**🚀 Features Enabled**: 
- Batchtools Optimization for parallel processing
- Research-First development with Perplexity, Context7, and Firecrawl MCPs
- Swarm coordination with Claude Flow

## 🔍 Essential Research MCP Tools

### 1. **Perplexity Ask MCP** - Real-time Web Intelligence
**Purpose:** Provides current web search capabilities using Perplexity's Sonar API  
**Available Tools:**
```typescript
perplexity_research(messages: Array<Message>) // Deep research (use sparingly)
perplexity_reason(messages: Array<Message>)   // Complex reasoning
```

**When to use:**
- Before implementing any feature - research current best practices
- When debugging - search with full error context
- For technology evaluation - find comparisons and benchmarks

**Usage patterns:**
```javascript
// ✅ CORRECT - Natural language with context
mcp__perplexity__ask({ 
  messages: [{
    role: "user",
    content: "What are the latest React 19 hooks best practices for handling async operations in 2025?"
  }]
})

// For deep research (use sparingly - it's slow)
mcp__perplexity__research({
  messages: [{
    role: "user", 
    content: "Research comprehensive security best practices for JWT authentication in Node.js applications"
  }]
})
```

### 2. **Context7 MCP** - Version-Specific Documentation  
**Purpose:** Fetches real-time, version-specific documentation from official sources  
**Available Functions:**
```typescript
resolve_library_id(libraryName: string)
get_library_docs(context7CompatibleLibraryID: string, topic?: string)
```

**Common library IDs:**
- `/vercel/next.js`, `/facebook/react`, `/vuejs/core`, `/mongodb/docs`, `/prisma/docs`

**Usage patterns:**
```javascript
// Basic usage - get React hooks documentation
mcp__context7__resolve_library_id({ libraryName: "react" })
// Returns: { context7CompatibleLibraryID: "/facebook/react" }

mcp__context7__get_library_docs({ 
  context7CompatibleLibraryID: "/facebook/react",
  topic: "hooks"
})
```

### 3. **Firecrawl MCP** - Advanced Web Scraping
**Purpose:** Extracts structured data from websites with JavaScript rendering  
**Available Functions:**
```typescript
firecrawl_scrape(url: string, options?)
firecrawl_extract(urls: string[], prompt?, schema?)
```

**When to use:**
- Extracting code examples from tutorials
- Scraping documentation not available via Context7
- Building datasets from web sources

## 🎯 Research-First SPARC Workflow

### Pattern: Starting Any SPARC Phase
```
1. Research current best practices (Perplexity)
2. Get official documentation (Context7)
3. Find real-world examples (Perplexity)
4. Extract code patterns if needed (Firecrawl)
5. Synthesize findings before implementation
```

### 1. Specification Phase (Research-Enhanced)
```bash
# Research before specifying
[Single Message]:
  - mcp__perplexity__research({ messages: [{ content: "auth best practices 2025" }] })
  - mcp__context7__get_library_docs({ libraryID: "/auth0/docs" })
  - npx claude-flow sparc run spec-pseudocode "Define user authentication"
```

### 2. Pseudocode Phase (Documentation-Driven)
```bash
# Verify algorithms with official docs
[Single Message]:
  - mcp__context7__resolve_library_id({ libraryName: "bcrypt" })
  - mcp__context7__get_library_docs({ topic: "password hashing" })
  - npx claude-flow sparc run spec-pseudocode "Create auth flow pseudocode"
```

### 3. Architecture Phase (Best Practices Research)
```bash
# Research architectural patterns
[Single Message]:
  - mcp__perplexity__reason({ messages: [{ content: "microservices vs monolith for startup" }] })
  - mcp__perplexity__ask({ messages: [{ content: "JWT vs session auth patterns" }] })
  - npx claude-flow sparc run architect "Design authentication architecture"
```

### 4. Refinement Phase (Error-Driven Research)
```bash
# Debug with context
[Single Message]:
  - mcp__perplexity__ask({ messages: [{ content: "TypeError: Cannot read property error full context..." }] })
  - mcp__context7__get_library_docs({ libraryID: "/facebook/react", topic: "hooks" })
  - npx claude-flow sparc tdd "implement authentication"
```

### 5. Completion Phase (Concurrent Integration)
```bash
# Integration with parallel validation and documentation
npx claude-flow sparc run integration "integrate authentication with user management" --parallel
```

## SPARC Development Commands

### Core SPARC Commands
- `npx claude-flow sparc modes`: List all available SPARC development modes
- `npx claude-flow sparc run <mode> "<task>"`: Execute specific SPARC mode for a task
- `npx claude-flow sparc tdd "<feature>"`: Run complete TDD workflow using SPARC methodology
- `npx claude-flow sparc info <mode>`: Get detailed information about a specific mode

### Batchtools Commands (Optimized)
- `npx claude-flow sparc batch <modes> "<task>"`: Execute multiple SPARC modes in parallel
- `npx claude-flow sparc pipeline "<task>"`: Execute full SPARC pipeline with parallel processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"`: Process multiple tasks concurrently

### Standard Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the test suite
- `npm run lint`: Run linter and format checks
- `npm run typecheck`: Run TypeScript type checking

## SPARC Methodology Workflow (Batchtools Enhanced)

### 1. Specification Phase (Parallel Analysis)
```bash
# Create detailed specifications with concurrent requirements analysis
npx claude-flow sparc run spec-pseudocode "Define user authentication requirements" --parallel
```
**Batchtools Optimization**: Simultaneously analyze multiple requirement sources, validate constraints in parallel, and generate comprehensive specifications.

### 2. Pseudocode Phase (Concurrent Logic Design)
```bash
# Develop algorithmic logic with parallel pattern analysis
npx claude-flow sparc run spec-pseudocode "Create authentication flow pseudocode" --batch-optimize
```
**Batchtools Optimization**: Process multiple algorithm patterns concurrently, validate logic flows in parallel, and optimize data structures simultaneously.

### 3. Architecture Phase (Parallel Component Design)
```bash
# Design system architecture with concurrent component analysis
npx claude-flow sparc run architect "Design authentication service architecture" --parallel
```
**Batchtools Optimization**: Generate multiple architectural alternatives simultaneously, validate integration points in parallel, and create comprehensive documentation concurrently.

### 4. Refinement Phase (Parallel TDD Implementation)
```bash
# Execute Test-Driven Development with parallel test generation
npx claude-flow sparc tdd "implement user authentication system" --batch-tdd
```
**Batchtools Optimization**: Generate multiple test scenarios simultaneously, implement and validate code in parallel, and optimize performance concurrently.

### 5. Completion Phase (Concurrent Integration)
```bash
# Integration with parallel validation and documentation
npx claude-flow sparc run integration "integrate authentication with user management" --parallel
```
**Batchtools Optimization**: Run integration tests in parallel, generate documentation concurrently, and validate requirements simultaneously.

## Batchtools Integration Features

### Parallel Processing Capabilities
- **Concurrent File Operations**: Read, analyze, and modify multiple files simultaneously
- **Parallel Code Analysis**: Analyze dependencies, patterns, and architecture concurrently
- **Batch Test Generation**: Create comprehensive test suites in parallel
- **Concurrent Documentation**: Generate multiple documentation formats simultaneously

### Performance Optimizations
- **Smart Batching**: Group related operations for optimal performance
- **Pipeline Processing**: Chain dependent operations with parallel stages
- **Resource Management**: Efficient utilization of system resources
- **Error Resilience**: Robust error handling with parallel recovery

## Performance Benchmarks

### Batchtools Performance Improvements
- **File Operations**: Up to 300% faster with parallel processing
- **Code Analysis**: 250% improvement with concurrent pattern recognition
- **Test Generation**: 400% faster with parallel test creation
- **Documentation**: 200% improvement with concurrent content generation
- **Memory Operations**: 180% faster with batched read/write operations

## Code Style and Best Practices (Batchtools Enhanced)

### SPARC Development Principles with Batchtools
- **Modular Design**: Keep files under 500 lines, optimize with parallel analysis
- **Environment Safety**: Never hardcode secrets, validate with concurrent checks
- **Test-First**: Always write tests before implementation using parallel generation
- **Clean Architecture**: Separate concerns with concurrent validation
- **Parallel Documentation**: Maintain clear, up-to-date documentation with concurrent updates

### Batchtools Best Practices
- **Parallel Operations**: Use batchtools for independent tasks
- **Concurrent Validation**: Validate multiple aspects simultaneously
- **Batch Processing**: Group similar operations for efficiency
- **Pipeline Optimization**: Chain operations with parallel stages
- **Resource Management**: Monitor and optimize resource usage

## Important Notes (Enhanced)

- Always run tests before committing with parallel execution (`npm run test --parallel`)
- Use SPARC memory system with concurrent operations to maintain context across sessions
- Follow the Red-Green-Refactor cycle with parallel test generation during TDD phases
- Document architectural decisions with concurrent validation in memory
- Regular security reviews with parallel analysis for authentication or data handling code
- Claude Code slash commands provide quick access to batchtools-optimized SPARC modes
- Monitor system resources during parallel operations for optimal performance

## 🚀 CRITICAL: Claude Code Does ALL Real Work

### 🎯 CLAUDE CODE IS THE ONLY EXECUTOR

**ABSOLUTE RULE**: Claude Code performs ALL actual work:

### ✅ Claude Code ALWAYS Handles:

- 🔧 **ALL file operations** (Read, Write, Edit, MultiEdit, Glob, Grep)
- 💻 **ALL code generation** and programming tasks
- 🖥️ **ALL bash commands** and system operations
- 🏗️ **ALL actual implementation** work
- 🔍 **ALL project navigation** and code analysis
- 📝 **ALL TodoWrite** and task management
- 🔄 **ALL git operations** (commit, push, merge)
- 📦 **ALL package management** (npm, pip, etc.)
- 🧪 **ALL testing** and validation
- 🔧 **ALL debugging** and troubleshooting

### 🧠 MCP Tools (Including Research Tools) ONLY Handle:

- 🔍 **Research and information gathering** (Perplexity, Context7, Firecrawl)
- 🎯 **Coordination only** - Planning Claude Code's actions
- 💾 **Memory management** - Storing decisions and context
- 🤖 **Neural features** - Learning from Claude Code's work
- 📊 **Performance tracking** - Monitoring Claude Code's efficiency
- 🐝 **Swarm orchestration** - Coordinating multiple Claude Code instances
- 🔗 **GitHub integration** - Advanced repository coordination

### 🚨 CRITICAL SEPARATION OF CONCERNS:

**❌ MCP Tools NEVER:**

- Write files or create content
- Execute bash commands
- Generate code
- Perform file operations
- Handle TodoWrite operations
- Execute system commands
- Do actual implementation work

**✅ MCP Tools ONLY:**

- Research and gather information
- Coordinate and plan
- Store memory and context
- Track performance
- Orchestrate workflows
- Provide intelligence insights

### ⚠️ Key Principle:

**MCP tools research and coordinate, Claude Code executes.** Think of MCP tools as the "brain" that researches and plans, while Claude Code is the "hands" that do all the actual work.

### 🔄 WORKFLOW EXECUTION PATTERN:

**✅ CORRECT Workflow:**

1. **MCP**: `mcp__perplexity__ask` / `mcp__context7__get_library_docs` (research phase)
2. **MCP**: `mcp__claude-flow__swarm_init` (coordination setup)
3. **MCP**: `mcp__claude-flow__agent_spawn` (planning agents)
4. **MCP**: `mcp__claude-flow__task_orchestrate` (task coordination)
5. **Claude Code**: `Task` tool to spawn agents with coordination instructions
6. **Claude Code**: `TodoWrite` with ALL todos batched (5-10+ in ONE call)
7. **Claude Code**: `Read`, `Write`, `Edit`, `Bash` (actual work)
8. **MCP**: `mcp__claude-flow__memory_usage` (store results)

**❌ WRONG Workflow:**

1. **MCP**: `mcp__claude-flow__terminal_execute` (DON'T DO THIS)
2. **MCP**: File creation via MCP (DON'T DO THIS)
3. **MCP**: Code generation via MCP (DON'T DO THIS)
4. **Claude Code**: Sequential Task calls (DON'T DO THIS)
5. **Claude Code**: Individual TodoWrite calls (DON'T DO THIS)

### 🚨 REMEMBER:

- **Research MCP tools** = Information gathering (Perplexity, Context7, Firecrawl)
- **Coordination MCP tools** = Planning, memory, intelligence (Claude Flow)
- **Claude Code** = All actual execution, coding, file operations

## 🚀 CRITICAL: Parallel Execution & Batch Operations

### 🚨 MANDATORY RULE #1: BATCH EVERYTHING

**When using swarms, you MUST use BatchTool for ALL operations:**

1. **NEVER** send multiple messages for related operations
2. **ALWAYS** combine multiple tool calls in ONE message
3. **PARALLEL** execution is MANDATORY, not optional

### ⚡ THE GOLDEN RULE OF SWARMS

```
If you need to do X operations, they should be in 1 message, not X messages
```

### 🚨 MANDATORY TODO AND TASK BATCHING

**CRITICAL RULE FOR TODOS AND TASKS:**

1. **TodoWrite** MUST ALWAYS include ALL todos in ONE call (5-10+ todos)
2. **Task** tool calls MUST be batched - spawn multiple agents in ONE message
3. **NEVER** update todos one by one - this breaks parallel coordination
4. **NEVER** spawn agents sequentially - ALL agents spawn together

### 📦 BATCH TOOL EXAMPLES

**✅ CORRECT - Everything in ONE Message:**

```javascript
[Single Message with BatchTool]:
  // Research phase
  mcp__perplexity__ask { messages: [{ content: "best auth patterns 2025" }] }
  mcp__context7__resolve_library_id { libraryName: "passport" }
  mcp__context7__get_library_docs { libraryID: "/passportjs/passport" }
  
  // MCP coordination setup
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "code-analyzer" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  mcp__claude-flow__agent_spawn { type: "task-orchestrator" }

  // Claude Code execution - ALL in parallel
  Task("You are researcher agent. MUST coordinate via hooks...")
  Task("You are coder agent. MUST coordinate via hooks...")
  Task("You are code-analyzer agent. MUST coordinate via hooks...")
  Task("You are tester agent. MUST coordinate via hooks...")
  TodoWrite { todos: [5-10 todos with all priorities and statuses] }

  // File operations in parallel
  Bash "mkdir -p app/{src,tests,docs}"
  Write "app/package.json"
  Write "app/README.md"
  Write "app/src/index.js"
```

**❌ WRONG - Multiple Messages (NEVER DO THIS):**

```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("researcher agent")
Message 3: Task("coder agent")
Message 4: TodoWrite({ todo: "single todo" })
Message 5: Bash "mkdir src"
Message 6: Write "package.json"
// This is 6x slower and breaks parallel coordination!
```

### 🎯 BATCH OPERATIONS BY TYPE

**Research Operations (Single Message):**
- Need to check 3 libraries? → One message with 3 Context7 calls
- Multiple searches? → One message with multiple Perplexity calls
- Research + Documentation? → Combine in one message

**Todo and Task Operations (Single Message):**
- **TodoWrite** → ALWAYS include 5-10+ todos in ONE call
- **Task agents** → Spawn ALL agents with full instructions in ONE message
- **Agent coordination** → ALL Task calls must include coordination hooks
- **Status updates** → Update ALL todo statuses together
- **NEVER** split todos or Task calls across messages!

**File Operations (Single Message):**
- Read 10 files? → One message with 10 Read calls
- Write 5 files? → One message with 5 Write calls
- Edit 1 file many times? → One MultiEdit call

**Swarm Operations (Single Message):**
- Need 8 agents? → One message with swarm_init + 8 agent_spawn calls
- Multiple memories? → One message with all memory_usage calls
- Task + monitoring? → One message with task_orchestrate + swarm_monitor

**Command Operations (Single Message):**
- Multiple directories? → One message with all mkdir commands
- Install + test + lint? → One message with all npm commands
- Git operations? → One message with all git commands

## 📊 Tool Selection Matrix (Enhanced with Research Tools)

| Scenario | Primary Tool | Secondary Tool | When to Use |
|----------|-------------|----------------|-------------|
| **Current best practices** | Perplexity ask | Context7 | Before any implementation |
| **API documentation** | Context7 | Perplexity | Official docs first, examples second |
| **Bug investigation** | Perplexity ask | Context7 | Error research with full context |
| **Technology comparison** | Perplexity reason | Context7 | Complex architectural decisions |
| **Code examples** | Context7 | Firecrawl | Official examples, scrape if needed |
| **Library versions** | Context7 | - | Always verify current APIs |
| **Performance patterns** | Perplexity research | - | Deep analysis (use sparingly) |
| **Data extraction** | Firecrawl | - | When you need structured web data |

## Available Agents (54 Total)

### 🚀 Concurrent Agent Usage

**CRITICAL**: Always spawn multiple agents concurrently using the Task tool in a single message:

```javascript
// ✅ CORRECT: Concurrent agent deployment
[Single Message]:
  - Task("Agent 1", "full instructions", "agent-type-1")
  - Task("Agent 2", "full instructions", "agent-type-2") 
  - Task("Agent 3", "full instructions", "agent-type-3")
  - Task("Agent 4", "full instructions", "agent-type-4")
  - Task("Agent 5", "full instructions", "agent-type-5")
```

### 📋 Agent Categories & Concurrent Patterns

#### **Core Development Agents**
- `coder` - Implementation specialist
- `reviewer` - Code quality assurance
- `tester` - Test creation and validation
- `planner` - Strategic planning
- `researcher` - Information gathering

**Concurrent Usage:**
```bash
# Deploy full development swarm
Task("Research requirements", "...", "researcher")
Task("Plan architecture", "...", "planner") 
Task("Implement features", "...", "coder")
Task("Create tests", "...", "tester")
Task("Review code", "...", "reviewer")
```

#### **Swarm Coordination Agents**
- `hierarchical-coordinator` - Queen-led coordination
- `mesh-coordinator` - Peer-to-peer networks
- `adaptive-coordinator` - Dynamic topology
- `collective-intelligence-coordinator` - Hive-mind intelligence
- `swarm-memory-manager` - Distributed memory

**Concurrent Swarm Deployment:**
```bash
# Deploy multi-topology coordination
Task("Hierarchical coordination", "...", "hierarchical-coordinator")
Task("Mesh network backup", "...", "mesh-coordinator")
Task("Adaptive optimization", "...", "adaptive-coordinator")
```

#### **Consensus & Distributed Systems**
- `byzantine-coordinator` - Byzantine fault tolerance
- `raft-manager` - Leader election protocols
- `gossip-coordinator` - Epidemic dissemination
- `consensus-builder` - Decision-making algorithms
- `crdt-synchronizer` - Conflict-free replication
- `quorum-manager` - Dynamic quorum management
- `security-manager` - Cryptographic security

#### **Performance & Optimization**
- `perf-analyzer` - Bottleneck identification
- `performance-benchmarker` - Performance testing
- `task-orchestrator` - Workflow optimization
- `memory-coordinator` - Memory management
- `smart-agent` - Intelligent coordination

#### **GitHub & Repository Management**
- `github-modes` - Comprehensive GitHub integration
- `pr-manager` - Pull request management
- `code-review-swarm` - Multi-agent code review
- `issue-tracker` - Issue management
- `release-manager` - Release coordination
- `workflow-automation` - CI/CD automation
- `project-board-sync` - Project tracking
- `repo-architect` - Repository optimization
- `multi-repo-swarm` - Cross-repository coordination

#### **SPARC Methodology Agents**
- `sparc-coord` - SPARC orchestration
- `sparc-coder` - TDD implementation
- `specification` - Requirements analysis
- `pseudocode` - Algorithm design
- `architecture` - System design
- `refinement` - Iterative improvement

#### **Specialized Development**
- `backend-dev` - API development
- `mobile-dev` - React Native development
- `ml-developer` - Machine learning
- `cicd-engineer` - CI/CD pipelines
- `api-docs` - OpenAPI documentation
- `system-architect` - High-level design
- `code-analyzer` - Code quality analysis
- `base-template-generator` - Boilerplate creation

#### **Testing & Validation**
- `tdd-london-swarm` - Mock-driven TDD
- `production-validator` - Real implementation validation

#### **Migration & Planning**
- `migration-planner` - System migrations
- `swarm-init` - Topology initialization

### 🎯 Research-Enhanced Agent Patterns

#### **Full-Stack Development with Research (9 agents)**
```bash
# Include dedicated researcher for continuous updates
Task("Research latest patterns", "Use Perplexity + Context7 throughout", "researcher")
Task("System architecture", "Based on research findings", "system-architect")
Task("Backend APIs", "Implement researched patterns", "backend-dev")
Task("Frontend mobile", "Use latest React Native", "mobile-dev")
Task("Database design", "Follow researched patterns", "coder")
Task("API documentation", "Document per standards", "api-docs")
Task("CI/CD pipeline", "Modern practices", "cicd-engineer")
Task("Performance testing", "Current benchmarks", "performance-benchmarker")
Task("Production validation", "Real-world testing", "production-validator")
```

#### **Distributed System Swarm (6 agents)**
```bash
Task("Byzantine consensus", "...", "byzantine-coordinator")
Task("Raft coordination", "...", "raft-manager")
Task("Gossip protocols", "...", "gossip-coordinator") 
Task("CRDT synchronization", "...", "crdt-synchronizer")
Task("Security management", "...", "security-manager")
Task("Performance monitoring", "...", "perf-analyzer")
```

#### **GitHub Workflow Swarm (5 agents)**
```bash
Task("PR management", "...", "pr-manager")
Task("Code review", "...", "code-review-swarm")
Task("Issue tracking", "...", "issue-tracker")
Task("Release coordination", "...", "release-manager")
Task("Workflow automation", "...", "workflow-automation")
```

#### **SPARC TDD Swarm (7 agents)**
```bash
Task("Requirements spec", "...", "specification")
Task("Algorithm design", "...", "pseudocode")
Task("System architecture", "...", "architecture") 
Task("TDD implementation", "...", "sparc-coder")
Task("London school tests", "...", "tdd-london-swarm")
Task("Iterative refinement", "...", "refinement")
Task("Production validation", "...", "production-validator")
```

### ⚡ Performance Optimization

**Agent Selection Strategy:**
- **High Priority**: Use 3-5 agents max for critical path
- **Medium Priority**: Use 5-8 agents for complex features
- **Large Projects**: Use 8+ agents with proper coordination

**Memory Management:**
- Use `memory-coordinator` for cross-agent state
- Implement `swarm-memory-manager` for distributed coordination
- Apply `collective-intelligence-coordinator` for decision-making

## 🚀 Quick Setup (Stdio MCP - Recommended)

### 1. Add MCP Server (Stdio - No Port Needed)

```bash
# Add Claude Flow MCP server to Claude Code using stdio
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### 2. Use MCP Tools for Coordination in Claude Code

Once configured, Claude Flow MCP tools enhance Claude Code's coordination:

**Initialize a swarm:**
- Use the `mcp__claude-flow__swarm_init` tool to set up coordination topology
- Choose: mesh, hierarchical, ring, or star
- This creates a coordination framework for Claude Code's work

**Spawn agents:**
- Use `mcp__claude-flow__agent_spawn` tool to create specialized coordinators
- Agent types represent different thinking patterns, not actual coders
- They help Claude Code approach problems from different angles

**Orchestrate tasks:**
- Use `mcp__claude-flow__task_orchestrate` tool to coordinate complex workflows
- This breaks down tasks for Claude Code to execute systematically
- The agents don't write code - they coordinate Claude Code's actions

## Available MCP Tools for Coordination

### Research Tools:
- `mcp__perplexity__ask` - Quick web searches for current information
- `mcp__perplexity__research` - Deep research (use sparingly - slow)
- `mcp__perplexity__reason` - Complex reasoning and comparisons
- `mcp__context7__resolve_library_id` - Find library documentation ID
- `mcp__context7__get_library_docs` - Get official documentation
- `mcp__firecrawl__scrape` - Extract content from websites
- `mcp__firecrawl__extract` - AI-powered data extraction

### Coordination Tools:
- `mcp__claude-flow__swarm_init` - Set up coordination topology for Claude Code
- `mcp__claude-flow__agent_spawn` - Create cognitive patterns to guide Claude Code
- `mcp__claude-flow__task_orchestrate` - Break down and coordinate complex tasks

### Monitoring Tools:
- `mcp__claude-flow__swarm_status` - Monitor coordination effectiveness
- `mcp__claude-flow__agent_list` - View active cognitive patterns
- `mcp__claude-flow__agent_metrics` - Track coordination performance
- `mcp__claude-flow__task_status` - Check workflow progress
- `mcp__claude-flow__task_results` - Review coordination outcomes

### Memory & Neural Tools:
- `mcp__claude-flow__memory_usage` - Persistent memory across sessions
- `mcp__claude-flow__neural_status` - Neural pattern effectiveness
- `mcp__claude-flow__neural_train` - Improve coordination patterns
- `mcp__claude-flow__neural_patterns` - Analyze thinking approaches

### GitHub Integration Tools (NEW!):
- `mcp__claude-flow__github_swarm` - Create specialized GitHub management swarms
- `mcp__claude-flow__repo_analyze` - Deep repository analysis with AI
- `mcp__claude-flow__pr_enhance` - AI-powered pull request improvements
- `mcp__claude-flow__issue_triage` - Intelligent issue classification
- `mcp__claude-flow__code_review` - Automated code review with swarms

### System Tools:
- `mcp__claude-flow__benchmark_run` - Measure coordination efficiency
- `mcp__claude-flow__features_detect` - Available capabilities
- `mcp__claude-flow__swarm_monitor` - Real-time coordination tracking

## Workflow Examples (Research & Coordination Combined)

### Research-Driven Development Example

**Context:** Claude Code needs to implement a new authentication system

**Step 1:** Research current best practices
```javascript
[Single Message]:
  - mcp__perplexity__ask({ messages: [{ content: "JWT vs session auth best practices 2025" }] })
  - mcp__perplexity__reason({ messages: [{ content: "OAuth2 vs custom auth for SaaS" }] })
  - mcp__context7__resolve_library_id({ libraryName: "passport" })
  - mcp__context7__get_library_docs({ libraryID: "/passportjs/passport", topic: "strategies" })
```

**Step 2:** Set up development coordination
```javascript
[Single Message]:
  - mcp__claude-flow__swarm_init({ topology: "hierarchical", maxAgents: 6 })
  - mcp__claude-flow__agent_spawn({ type: "system-architect" })
  - mcp__claude-flow__agent_spawn({ type: "backend-dev" })
  - mcp__claude-flow__agent_spawn({ type: "tester" })
  - mcp__claude-flow__memory_usage({ action: "store", key: "research/auth", value: researchFindings })
```

**Step 3:** Execute with research-informed approach
```javascript
[Single Message]:
  - Task("Architect: Design auth based on research findings...")
  - Task("Backend Dev: Implement using passport.js patterns...")
  - Task("Tester: Create tests for JWT edge cases found in research...")
  - TodoWrite({ todos: [researchInformedTodos] })
  - Write("auth/jwt-strategy.js", implementationBasedOnDocs)
```

### Debugging with Research Example

**Context:** Claude Code encounters a complex error

**Step 1:** Research the error
```javascript
[Single Message]:
  - mcp__perplexity__ask({ messages: [{ content: "TypeError: Cannot read property 'headers' of undefined Express.js middleware" }] })
  - mcp__context7__get_library_docs({ libraryID: "/expressjs/express", topic: "middleware error handling" })
  - Read("src/middleware/auth.js")
  - Read("src/server.js")
```

**Step 2:** Apply research findings
```javascript
[Single Message]:
  - MultiEdit("src/middleware/auth.js", researchBasedFixes)
  - Write("src/middleware/error-handler.js", bestPracticeErrorHandler)
  - Bash("npm test")
  - mcp__claude-flow__memory_usage({ action: "store", key: "debug/auth-error", value: solution })
```

### GitHub Repository Management Example (NEW!)

**Context:** Claude Code needs to manage a complex GitHub repository

**Step 1:** Initialize GitHub swarm
- Tool: `mcp__claude-flow__github_swarm`
- Parameters: `{"repository": "owner/repo", "agents": 5, "focus": "maintenance"}`
- Result: Specialized swarm for repository management

**Step 2:** Analyze repository health
- Tool: `mcp__claude-flow__repo_analyze`
- Parameters: `{"deep": true, "include": ["issues", "prs", "code"]}`
- Result: Comprehensive repository analysis

**Step 3:** Enhance pull requests
- Tool: `mcp__claude-flow__pr_enhance`
- Parameters: `{"pr_number": 123, "add_tests": true, "improve_docs": true}`
- Result: AI-powered PR improvements

## 💡 Best Practices (Research-Enhanced)

### 🔍 Research-First Principles

**DO:**
- Research BEFORE implementing any feature
- Verify with official docs (Context7) before using APIs
- Search for errors with FULL context (stack traces, code snippets)
- Use appropriate Perplexity model (ask for quick, research for deep, reason for complex)
- Check documentation versions to avoid deprecated patterns
- Batch ALL research operations in one message

**DON'T:**
- Skip research when starting new features
- Assume your knowledge is current without verification
- Use keyword-only searches in Perplexity
- Overuse perplexity_research (it's slow - use perplexity_ask first)
- Implement without checking official documentation
- Split research calls across multiple messages

### 📚 Documentation-Driven Development

**ALWAYS:**
1. Check Context7 for official API documentation
2. Verify syntax and parameters before implementation
3. Look for version-specific changes
4. Cross-reference with Perplexity for real-world usage
5. Store research findings in memory for team coordination

### ✅ Coordination Best Practices

**DO:**
- Use MCP tools to coordinate Claude Code's approach to complex tasks
- Let the swarm break down problems into manageable pieces
- Use memory tools to maintain context across sessions
- Monitor coordination effectiveness with status tools
- Train neural patterns for better coordination over time
- Leverage GitHub tools for repository management

**DON'T:**
- Expect agents to write code (Claude Code does all implementation)
- Use MCP tools for file operations (use Claude Code's native tools)
- Try to make agents execute bash commands (Claude Code handles this)
- Confuse coordination with execution (MCP coordinates, Claude executes)

### 🚨 Common Pitfalls to Avoid

1. **Starting coding without research** - Always research first!
2. **Using outdated patterns** - Verify with Context7
3. **Assuming error causes** - Research with full context
4. **Single-source decisions** - Cross-reference multiple sources
5. **Keyword searches in Perplexity** - Use natural language questions
6. **Ignoring version differences** - Check documentation versions
7. **Sequential operations** - Always batch in single messages
8. **Splitting TodoWrite calls** - Include all todos in ONE call

## Memory and Persistence

The swarm provides persistent memory that helps Claude Code:
- Remember project context across sessions
- Track decisions and rationale
- Maintain consistency in large projects
- Learn from previous coordination patterns
- Store GitHub workflow preferences
- Cache research findings for reuse

## Performance Benefits

When using Claude Flow coordination with Claude Code:
- **84.8% SWE-Bench solve rate** - Better problem-solving through coordination
- **32.3% token reduction** - Efficient task breakdown reduces redundancy
- **2.8-4.4x speed improvement** - Parallel coordination strategies
- **27+ neural models** - Diverse cognitive approaches
- **GitHub automation** - Streamlined repository management
- **Research caching** - Avoid redundant searches

## 🧠 SWARM ORCHESTRATION PATTERN

### You are the SWARM ORCHESTRATOR. **IMMEDIATELY SPAWN AGENTS IN PARALLEL** to execute tasks

### 🚨 CRITICAL INSTRUCTION: You are the SWARM ORCHESTRATOR

**MANDATORY**: When using swarms, you MUST:

1. **RESEARCH FIRST** - Use Perplexity/Context7 before implementation
2. **SPAWN ALL AGENTS IN ONE BATCH** - Use multiple tool calls in a SINGLE message
3. **EXECUTE TASKS IN PARALLEL** - Never wait for one task before starting another
4. **USE BATCHTOOL FOR EVERYTHING** - Multiple operations = Single message with multiple tools
5. **ALL AGENTS MUST USE COORDINATION TOOLS** - Every spawned agent MUST use claude-flow hooks and memory

### 🎯 AGENT COUNT CONFIGURATION

**CRITICAL: Dynamic Agent Count Rules**

1. **Check CLI Arguments First**: If user runs `npx claude-flow@alpha --agents 5`, use 5 agents
2. **Auto-Decide if No Args**: Without CLI args, analyze task complexity:
   - Simple tasks (1-3 components): 3-4 agents
   - Medium tasks (4-6 components): 5-7 agents
   - Complex tasks (7+ components): 8-12 agents
3. **Agent Type Distribution**: Balance agent types based on task:
   - Always include 1 task-orchestrator
   - For code-heavy tasks: more coders
   - For design tasks: more system-architects/code-analyzers
   - For quality tasks: more testers/reviewers

## 📋 MANDATORY AGENT COORDINATION PROTOCOL

### 🔴 CRITICAL: Every Agent MUST Follow This Protocol

When you spawn an agent using the Task tool, that agent MUST:

**1️⃣ BEFORE Starting Work:**
```bash
# Check previous work and load context
npx claude-flow@alpha hooks pre-task --description "[agent task]" --auto-spawn-agents false
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]" --load-memory true
```

**2️⃣ DURING Work (After EVERY Major Step):**
```bash
# Store progress in memory after each file operation
npx claude-flow@alpha hooks post-edit --file "[filepath]" --memory-key "swarm/[agent]/[step]"

# Store decisions and findings
npx claude-flow@alpha hooks notify --message "[what was done]" --telemetry true

# Check coordination with other agents
npx claude-flow@alpha hooks pre-search --query "[what to check]" --cache-results true
```

**3️⃣ AFTER Completing Work:**
```bash
# Save all results and learnings
npx claude-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true
npx claude-flow@alpha hooks session-end --export-metrics true --generate-summary true
```

### 🎯 AGENT PROMPT TEMPLATE

When spawning agents, ALWAYS include these coordination instructions:

```
You are the [Agent Type] agent in a coordinated swarm.

MANDATORY COORDINATION:
1. START: Run `npx claude-flow@alpha hooks pre-task --description "[your task]"`
2. DURING: After EVERY file operation, run `npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "agent/[step]"`
3. MEMORY: Store ALL decisions using `npx claude-flow@alpha hooks notify --message "[decision]"`
4. END: Run `npx claude-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true`

Your specific task: [detailed task description]

REMEMBER: Coordinate with other agents by checking memory BEFORE making decisions!
```

### ⚡ PARALLEL EXECUTION IS MANDATORY

**THIS IS WRONG ❌ (Sequential - NEVER DO THIS):**
```
Message 1: Initialize swarm
Message 2: Spawn agent 1
Message 3: Spawn agent 2
Message 4: TodoWrite (single todo)
Message 5: Create file 1
Message 6: TodoWrite (another single todo)
```

**THIS IS CORRECT ✅ (Parallel - ALWAYS DO THIS):**
```
Message 1: [BatchTool]
  // Research phase
  - mcp__perplexity__ask (best practices)
  - mcp__context7__resolve_library_id
  - mcp__context7__get_library_docs
  
  // MCP coordination setup
  - mcp__claude-flow__swarm_init
  - mcp__claude-flow__agent_spawn (researcher)
  - mcp__claude-flow__agent_spawn (coder)
  - mcp__claude-flow__agent_spawn (code-analyzer)
  - mcp__claude-flow__agent_spawn (tester)
  - mcp__claude-flow__agent_spawn (task-orchestrator)

Message 2: [BatchTool - Claude Code execution]
  // Task agents with full coordination instructions
  - Task("You are researcher agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Research API patterns")
  - Task("You are coder agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Implement REST endpoints")
  - Task("You are code-analyzer agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Analyze performance")
  - Task("You are tester agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Write comprehensive tests")

  // TodoWrite with ALL todos batched
  - TodoWrite { todos: [
      {id: "research", content: "Research API patterns", status: "in_progress", priority: "high"},
      {id: "design", content: "Design database schema", status: "pending", priority: "high"},
      {id: "implement", content: "Build REST endpoints", status: "pending", priority: "high"},
      {id: "test", content: "Write unit tests", status: "pending", priority: "medium"},
      {id: "docs", content: "Create API documentation", status: "pending", priority: "low"},
      {id: "deploy", content: "Setup deployment", status: "pending", priority: "medium"}
    ]}

  // File operations in parallel
  - Write "api/package.json"
  - Write "api/server.js"
  - Write "api/routes/users.js"
  - Bash "mkdir -p api/{routes,models,tests}"
```

### 🎯 MANDATORY SWARM PATTERN

When given ANY complex task with swarms:

```
STEP 1: RESEARCH PHASE (Single Message!)
[BatchTool]:
  - mcp__perplexity__ask { messages: [{ content: "current best practices for [task]" }] }
  - mcp__context7__resolve_library_id { libraryName: "[main library]" }
  - mcp__context7__get_library_docs { libraryID: "[id]", topic: "[specific topic]" }
  - mcp__perplexity__reason { messages: [{ content: "compare approaches for [task]" }] }

STEP 2: IMMEDIATE PARALLEL SPAWN (Single Message!)
[BatchTool]:
  // IMPORTANT: Check CLI args for agent count, otherwise auto-decide based on task complexity
  - mcp__claude-flow__swarm_init {
      topology: "hierarchical",
      maxAgents: CLI_ARGS.agents || AUTO_DECIDE(task_complexity), // Use CLI args or auto-decide
      strategy: "parallel"
    }

  // Spawn agents based on maxAgents count and task requirements
  // If CLI specifies 3 agents, spawn 3. If no args, auto-decide optimal count (3-12)
  - mcp__claude-flow__agent_spawn { type: "system-architect", name: "System Designer" }
  - mcp__claude-flow__agent_spawn { type: "coder", name: "API Developer" }
  - mcp__claude-flow__agent_spawn { type: "coder", name: "Frontend Dev" }
  - mcp__claude-flow__agent_spawn { type: "code-analyzer", name: "DB Designer" }
  - mcp__claude-flow__agent_spawn { type: "tester", name: "QA Engineer" }
  - mcp__claude-flow__agent_spawn { type: "researcher", name: "Tech Lead" }
  - mcp__claude-flow__agent_spawn { type: "task-orchestrator", name: "PM" }
  - TodoWrite { todos: [multiple todos at once] }

STEP 3: PARALLEL TASK EXECUTION (Single Message!)
[BatchTool]:
  - mcp__claude-flow__task_orchestrate { task: "main task", strategy: "parallel" }
  - mcp__claude-flow__memory_usage { action: "store", key: "init", value: {...} }
  - Multiple Read operations
  - Multiple Write operations
  - Multiple Bash commands

STEP 4: CONTINUE PARALLEL WORK (Never Sequential!)
```

### 📊 VISUAL TASK TRACKING FORMAT

Use this format when displaying task progress:

```
📊 Progress Overview
   ├── Total Tasks: X
   ├── ✅ Completed: X (X%)
   ├── 🔄 In Progress: X (X%)
   ├── ⭕ Todo: X (X%)
   └── ❌ Blocked: X (X%)

📋 Todo (X)
   └── 🔴 001: [Task description] [PRIORITY] ▶

🔄 In progress (X)
   ├── 🟡 002: [Task description] ↳ X deps ▶
   └── 🔴 003: [Task description] [PRIORITY] ▶

✅ Completed (X)
   ├── ✅ 004: [Task description]
   └── ... (more completed tasks)

Priority indicators: 🔴 HIGH/CRITICAL, 🟡 MEDIUM, 🟢 LOW
Dependencies: ↳ X deps | Actionable: ▶
```

### 🎯 REAL EXAMPLE: Full-Stack App Development with Research

**Task**: "Build a complete REST API with authentication, database, and tests"

**🚨 MANDATORY APPROACH - Everything in Parallel with Research:**

```javascript
// ✅ CORRECT: Research → Initialize → Execute
[BatchTool - Message 1 - Research Phase]:
  // Research current best practices
  mcp__perplexity__ask { messages: [{ content: "best authentication patterns for REST APIs 2025" }] }
  mcp__perplexity__reason { messages: [{ content: "JWT vs session auth for scalable APIs" }] }
  mcp__context7__resolve_library_id { libraryName: "express" }
  mcp__context7__get_library_docs { libraryID: "/expressjs/express", topic: "middleware" }
  mcp__context7__resolve_library_id { libraryName: "jsonwebtoken" }
  mcp__context7__get_library_docs { libraryID: "/auth0/node-jsonwebtoken" }

[BatchTool - Message 2 - Swarm Setup]:
  // Initialize and spawn ALL agents at once
  mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8, strategy: "parallel" }
  mcp__claude-flow__agent_spawn { type: "researcher", name: "Continuous Researcher" }
  mcp__claude-flow__agent_spawn { type: "system-architect", name: "System Designer" }
  mcp__claude-flow__agent_spawn { type: "coder", name: "API Developer" }
  mcp__claude-flow__agent_spawn { type: "coder", name: "Auth Expert" }
  mcp__claude-flow__agent_spawn { type: "code-analyzer", name: "DB Designer" }
  mcp__claude-flow__agent_spawn { type: "tester", name: "Test Engineer" }
  mcp__claude-flow__agent_spawn { type: "task-orchestrator", name: "Lead" }

  // Store research findings in memory
  mcp__claude-flow__memory_usage { 
    action: "store", 
    key: "research/auth-patterns", 
    value: { jwt: true, bcrypt: true, refreshTokens: true }
  }

  // Update ALL todos at once - NEVER split todos!
  TodoWrite { todos: [
    { id: "research", content: "Research complete - JWT with refresh tokens", status: "completed", priority: "high" },
    { id: "design", content: "Design API architecture with JWT auth", status: "in_progress", priority: "high" },
    { id: "auth", content: "Implement JWT authentication with refresh", status: "pending", priority: "high" },
    { id: "db", content: "Design user schema with refresh tokens", status: "pending", priority: "high" },
    { id: "api", content: "Build REST endpoints with auth middleware", status: "pending", priority: "high" },
    { id: "tests", content: "Write auth tests including edge cases", status: "pending", priority: "medium" },
    { id: "docs", content: "Document JWT implementation", status: "pending", priority: "low" },
    { id: "deploy", content: "Setup secure deployment", status: "pending", priority: "medium" },
    { id: "monitor", content: "Add auth monitoring", status: "pending", priority: "medium" }
  ]}

  // Start orchestration
  mcp__claude-flow__task_orchestrate { task: "Build REST API with JWT", strategy: "parallel" }

[BatchTool - Message 3 - Implementation]:
  // Create ALL directories at once
  Bash("mkdir -p test-app/{src,tests,docs,config}")
  Bash("mkdir -p test-app/src/{models,routes,middleware,services,utils}")
  Bash("mkdir -p test-app/tests/{unit,integration,fixtures}")

  // Write ALL base files at once (based on research)
  Write("test-app/package.json", packageJsonWithResearchedDeps)
  Write("test-app/.env.example", envWithJWTSecrets)
  Write("test-app/README.md", readmeWithAuthDocs)
  Write("test-app/src/server.js", serverWithMiddleware)
  Write("test-app/src/config/auth.js", jwtConfigFromResearch)
  Write("test-app/src/middleware/auth.js", jwtMiddlewareFromDocs)
  Write("test-app/src/utils/token.js", refreshTokenLogic)
```

### 🚫 NEVER DO THIS (Sequential = WRONG):

```javascript
// ❌ WRONG: Multiple messages, one operation each
Message 1: mcp__claude-flow__swarm_init
Message 2: mcp__claude-flow__agent_spawn (just one agent)
Message 3: mcp__claude-flow__agent_spawn (another agent)
Message 4: TodoWrite (single todo)
Message 5: Write (single file)
// This is 5x slower and wastes swarm coordination!
```

### 🔄 MEMORY COORDINATION PATTERN

Every agent coordination step MUST use memory:

```
// After each major decision or implementation
mcp__claude-flow__memory_usage
  action: "store"
  key: "swarm-{id}/agent-{name}/{step}"
  value: {
    timestamp: Date.now(),
    decision: "what was decided",
    implementation: "what was built",
    researchFindings: "what was learned",
    nextSteps: ["step1", "step2"],
    dependencies: ["dep1", "dep2"]
  }

// To retrieve coordination data
mcp__claude-flow__memory_usage
  action: "retrieve"
  key: "swarm-{id}/agent-{name}/{step}"

// To check all swarm progress
mcp__claude-flow__memory_usage
  action: "list"
  pattern: "swarm-{id}/*"
```

### ⚡ PERFORMANCE TIPS

1. **Research First**: Always research before implementing
2. **Batch Everything**: Never operate on single items when multiple are needed
3. **Parallel First**: Always think "what can run simultaneously?"
4. **Memory is Key**: Use memory for ALL cross-agent coordination
5. **Monitor Progress**: Use swarm_monitor for real-time tracking
6. **Cache Research**: Store findings to avoid redundant searches

### 🎨 VISUAL SWARM STATUS

When showing swarm status, use this format:

```
🐝 Swarm Status: ACTIVE
├── 🏗️ Topology: hierarchical
├── 👥 Agents: 6/8 active
├── ⚡ Mode: parallel execution
├── 📊 Tasks: 12 total (4 complete, 6 in-progress, 2 pending)
├── 🧠 Memory: 15 coordination points stored
└── 🔍 Research: 8 findings cached

Agent Activity:
├── 🟢 researcher: Monitoring latest patterns via Perplexity...
├── 🟢 system-architect: Designing with Context7 docs...
├── 🟢 coder-1: Implementing auth endpoints...
├── 🟢 coder-2: Building user CRUD operations...
├── 🟡 tester: Waiting for auth completion...
└── 🟢 task-orchestrator: Monitoring progress...
```

## 📝 CRITICAL: TODOWRITE AND TASK TOOL BATCHING

### 🚨 MANDATORY BATCHING RULES FOR TODOS AND TASKS

**TodoWrite Tool Requirements:**

1. **ALWAYS** include 5-10+ todos in a SINGLE TodoWrite call
2. **NEVER** call TodoWrite multiple times in sequence
3. **BATCH** all todo updates together - status changes, new todos, completions
4. **INCLUDE** all priority levels (high, medium, low) in one call

**Task Tool Requirements:**

1. **SPAWN** all agents using Task tool in ONE message
2. **NEVER** spawn agents one by one across multiple messages
3. **INCLUDE** full task descriptions and coordination instructions
4. **BATCH** related Task calls together for parallel execution

**Example of CORRECT TodoWrite usage:**

```javascript
// ✅ CORRECT - All todos in ONE call
TodoWrite { todos: [
  { id: "1", content: "Research best practices", status: "completed", priority: "high" },
  { id: "2", content: "Analyze requirements", status: "in_progress", priority: "high" },
  { id: "3", content: "Design architecture", status: "pending", priority: "high" },
  { id: "4", content: "Implement core", status: "pending", priority: "high" },
  { id: "5", content: "Build features", status: "pending", priority: "medium" },
  { id: "6", content: "Write tests", status: "pending", priority: "medium" },
  { id: "7", content: "Add monitoring", status: "pending", priority: "medium" },
  { id: "8", content: "Documentation", status: "pending", priority: "low" },
  { id: "9", content: "Performance tuning", status: "pending", priority: "low" },
  { id: "10", content: "Deploy to production", status: "pending", priority: "high" }
]}
```

**Example of WRONG TodoWrite usage:**

```javascript
// ❌ WRONG - Multiple TodoWrite calls
Message 1: TodoWrite { todos: [{ id: "1", content: "Task 1", ... }] }
Message 2: TodoWrite { todos: [{ id: "2", content: "Task 2", ... }] }
Message 3: TodoWrite { todos: [{ id: "3", content: "Task 3", ... }] }
// This breaks parallel coordination!
```

## Claude Code Hooks Integration

Claude Flow includes powerful hooks that automate coordination:

### Pre-Operation Hooks
- **Auto-assign agents** before file edits based on file type
- **Validate commands** before execution for safety
- **Prepare resources** automatically for complex operations
- **Optimize topology** based on task complexity analysis
- **Cache searches** for improved performance
- **GitHub context** loading for repository operations

### Post-Operation Hooks
- **Auto-format code** using language-specific formatters
- **Train neural patterns** from successful operations
- **Update memory** with operation context
- **Analyze performance** and identify bottlenecks
- **Track token usage** for efficiency metrics
- **Sync GitHub** state for consistency

### Session Management
- **Generate summaries** at session end
- **Persist state** across Claude Code sessions
- **Track metrics** for continuous improvement
- **Restore previous** session context automatically
- **Export workflows** for reuse

### Advanced Features (v2.0.0!)
- **🚀 Automatic Topology Selection** - Optimal swarm structure for each task
- **⚡ Parallel Execution** - 2.8-4.4x speed improvements
- **🧠 Neural Training** - Continuous learning from operations
- **📊 Bottleneck Analysis** - Real-time performance optimization
- **🤖 Smart Auto-Spawning** - Zero manual agent management
- **🛡️ Self-Healing Workflows** - Automatic error recovery
- **💾 Cross-Session Memory** - Persistent learning & context
- **🔗 GitHub Integration** - Repository-aware swarms
- **🔍 Research Caching** - Avoid redundant searches

### Configuration

Hooks are pre-configured in `.claude/settings.json`. Key features:
- Automatic agent assignment for different file types
- Code formatting on save
- Neural pattern learning from edits
- Session state persistence
- Performance tracking and optimization
- Intelligent caching and token reduction
- GitHub workflow automation
- Research result caching

See `.claude/commands/` for detailed documentation on all features.

## Integration Tips

1. **Start with Research**: Always research before implementation
2. **Start Simple**: Begin with basic swarm init and single agent
3. **Scale Gradually**: Add more agents as task complexity increases
4. **Use Memory**: Store important decisions and context
5. **Monitor Progress**: Regular status checks ensure effective coordination
6. **Train Patterns**: Let neural agents learn from successful coordinations
7. **Enable Hooks**: Use the pre-configured hooks for automation
8. **GitHub First**: Use GitHub tools for repository management

## Claude Flow v2.0.0 Features

Claude Flow extends the base coordination with:
- **🔗 GitHub Integration** - Deep repository management
- **🎯 Project Templates** - Quick-start for common projects
- **📊 Advanced Analytics** - Detailed performance insights
- **🤖 Custom Agent Types** - Domain-specific coordinators
- **🔄 Workflow Automation** - Reusable task sequences
- **🛡️ Enhanced Security** - Safer command execution
- **🔍 Research Integration** - Seamless Perplexity/Context7 coordination

## 🏁 Remember

**Research → Understand → Coordinate → Implement**

The enhanced workflow combines:
1. **Research Tools** (Perplexity, Context7, Firecrawl) for current information
2. **Claude Flow** for intelligent coordination
3. **Claude Code** for all actual implementation

These MCP tools transform Claude Code from a knowledge-limited assistant into a research-powered development partner with access to current, accurate information. Use them wisely to make informed decisions and write better code.

The key is not just having access to information, but knowing when and how to use each tool effectively. Start every task with research, verify with documentation, coordinate with swarms, and implement with Claude Code!

## Support

- SPARC Guide: https://github.com/ruvnet/claude-code-flow/docs/sparc.md
- Batchtools Documentation: https://github.com/ruvnet/claude-code-flow/docs/batchtools.md
- Claude Flow: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Examples: https://github.com/ruvnet/claude-flow/tree/main/examples

---

Remember: **Research first, Claude Flow coordinates, Claude Code creates!** Start with research tools, then `mcp__claude-flow__swarm_init` to enhance your development workflow.

## When asked to use Odoo, never go to odoo_mcp, use the tools of the odoo_mcp that you have access to!