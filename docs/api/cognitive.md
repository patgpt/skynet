# Cognitive Tools

High-level Skynet workflow tools that orchestrate memory retrieval, interaction storage, and context management.

## skynet_think

**MANDATORY**: Execute Skynet's cognitive workflow to process user input and retrieve relevant context. Call this FIRST before responding to any user query.

**Parameters:**
- `user` (string, required): User identifier
- `input` (string, required): User's input/query text
- `extractTopics` (boolean, optional): Whether to extract topics from input. Default: `true`

**Returns:**
```typescript
{
  user: string,
  input: string,
  context: {
    recentInteractions: Array<{
      id: string,
      timestamp: number,
      input: string,
      output: string,
      topics: string[],
      entities: string[]
    }>,
    relevantMemories: Array<{
      id: string,
      content: string,
      metadata: {
        type: string,
        importance: number,
        user: string,
        tags: string[]
      },
      distance: number
    }>,
    userProfile: {
      totalInteractions: number,
      topTopics: Array<{ topic: string, count: number }>,
      lastSeen: number
    }
  },
  extractedTopics: string[],  // If extractTopics=true
  processingTime: number       // Milliseconds
}
```

**Example:**
```typescript
// Standard usage (before responding to user)
const context = await skynetThink({
  user: "alice",
  input: "How do I optimize my database queries?"
});

// Use context in response
console.log(`Found ${context.context.relevantMemories.length} relevant memories`);
console.log(`User has asked about: ${context.context.userProfile.topTopics.map(t => t.topic).join(", ")}`);

// Without topic extraction (faster)
const quickContext = await skynetThink({
  user: "alice",
  input: "Thanks!",
  extractTopics: false
});
```

**Cognitive Workflow:**

1. **User Profile Retrieval**: Get or create user profile
2. **Recent Interactions**: Fetch last 10 interactions (7 days)
3. **Memory Search**: Semantic search for relevant memories
4. **Topic Extraction**: Extract topics from user input (if enabled)
5. **Context Aggregation**: Combine all context sources
6. **Return**: Comprehensive context package

**Use Cases:**
- Pre-conversation context loading
- Personalized response preparation
- Continuity across sessions
- Context-aware AI responses

**Critical**: Always call `skynet_think` before generating a response to ensure you have full context about the user's history, preferences, and previous conversations.

---

## skynet_respond

**MANDATORY**: Store your response after answering user. This creates the memory trace and maintains conversation continuity. Call this AFTER you formulate your response.

**Parameters:**
- `user` (string, required): User identifier
- `input` (string, required): User's original input
- `output` (string, required): Your generated response
- `intent` (enum, optional): Categorized intent
  - `"question"` - User asking for information
  - `"request"` - User requesting action
  - `"statement"` - User making a statement
  - `"feedback"` - User providing feedback
  - `"greeting"` - User greeting/farewell
  - `"other"` - Uncategorized
- `sentiment` (enum, optional): Detected sentiment - `"positive"`, `"negative"`, `"neutral"`, or `"mixed"`
- `topics` (string[], optional): Conversation topics. Default: `[]`
- `entities` (string[], optional): Named entities mentioned. Default: `[]`
- `previousInteractionId` (string, optional): ID from previous interaction (for continuity)
- `storeMemory` (boolean, optional): Whether to also store as semantic memory. Default: `false`
- `memoryType` (enum, optional): If `storeMemory=true`, the memory type
- `memoryContent` (string, optional): If `storeMemory=true`, the memory content (defaults to output)

**Returns:**
```typescript
{
  interactionId: string,
  memoryId?: string,  // If storeMemory=true
  user: string,
  timestamp: number,
  stored: {
    interaction: boolean,
    memory: boolean
  }
}
```

**Example:**
```typescript
// Basic response storage
const result = await skynetRespond({
  user: "alice",
  input: "How do I optimize database queries?",
  output: "Here are 3 strategies for query optimization: 1) Add indexes...",
  intent: "question",
  sentiment: "neutral",
  topics: ["database", "optimization", "performance"],
  entities: ["PostgreSQL", "indexes"]
});

// With continuity linking
await skynetRespond({
  user: "alice",
  input: "Can you explain indexes more?",
  output: "Indexes are data structures that improve query speed...",
  intent: "question",
  topics: ["database", "indexes"],
  previousInteractionId: result.interactionId  // Link to previous
});

// Store as memory too
await skynetRespond({
  user: "alice",
  input: "I prefer concise responses",
  output: "Understood, I'll keep responses brief.",
  intent: "feedback",
  sentiment: "neutral",
  storeMemory: true,
  memoryType: "preference",
  memoryContent: "User prefers concise, brief responses without verbose explanations"
});
```

**Memory Storage Triggers:**

Use `storeMemory: true` when the interaction reveals:
- User preferences
- Important facts about user's environment
- Patterns in user behavior
- Key insights or learnings
- Corrections to previous information

**Use Cases:**
- Maintain conversation history
- Build user knowledge graph
- Learn user preferences
- Track interaction patterns
- Enable future context retrieval

**Critical**: Always call `skynet_respond` after generating a response to ensure the interaction is recorded and future conversations have proper context.

---

## skynet_validateMemory

Verify that the current interaction has been stored in memory. Call this as a final check before completing your response.

**Parameters:**
- `interactionId` (string, optional): Interaction ID to validate (if omitted, validates most recent)

**Returns:**
```typescript
{
  valid: boolean,
  interactionId?: string,
  errors: string[],
  warnings: string[],
  details: {
    interactionExists: boolean,
    hasTopics: boolean,
    hasTimestamp: boolean,
    linkedToUser: boolean,
    linkedToPrevious: boolean
  }
}
```

**Example:**
```typescript
// Validate after skynet_respond
const response = await skynetRespond({
  user: "alice",
  input: "Hello!",
  output: "Hi Alice! How can I help?",
  topics: ["greeting"]
});

const validation = await skynetValidateMemory({
  interactionId: response.interactionId
});

if (!validation.valid) {
  console.error("Memory storage failed:", validation.errors);
  // Retry or alert
} else {
  console.log("Interaction successfully stored");
}

// Validate most recent (no ID)
const recentValidation = await skynetValidateMemory();
```

**Validation Checks:**

- ✅ **Interaction Exists**: Node created in graph
- ✅ **Has Timestamp**: Timestamp property set
- ✅ **Linked to User**: Relationship to User node exists
- ✅ **Has Topics**: At least one topic relationship (if topics provided)
- ✅ **Linked to Previous**: Continuity relationship exists (if previousInteractionId provided)

**Errors vs Warnings:**

**Errors** (validation fails):
- Interaction node not found
- Missing user relationship
- Missing required timestamp

**Warnings** (validation passes, but with caveats):
- No topics extracted
- No continuity link
- Missing optional metadata

**Use Cases:**
- Quality assurance after response
- Debugging storage issues
- Monitoring data integrity
- Automated testing

**Best Practice**: Use in development/testing to ensure proper workflow. In production, consider logging warnings but not blocking on them.

---

## Cognitive Workflow Integration

### Complete Response Cycle

```typescript
async function handleUserQuery(user: string, input: string) {
  // 1. THINK: Get context
  const context = await skynetThink({ user, input });
  
  // 2. PROCESS: Use context to generate response
  const output = generateResponse(input, context);
  
  // 3. RESPOND: Store interaction
  const result = await skynetRespond({
    user,
    input,
    output,
    intent: detectIntent(input),
    sentiment: detectSentiment(input),
    topics: context.extractedTopics,
    entities: extractEntities(input)
  });
  
  // 4. VALIDATE: Ensure storage succeeded
  const validation = await skynetValidateMemory({
    interactionId: result.interactionId
  });
  
  if (!validation.valid) {
    console.error("Storage validation failed", validation.errors);
  }
  
  return output;
}
```

### Context Utilization

```typescript
const context = await skynetThink({ user, input });

// Use recent interactions for continuity
if (context.context.recentInteractions.length > 0) {
  const lastInteraction = context.context.recentInteractions[0];
  console.log(`Continuing from: ${lastInteraction.input}`);
}

// Use memories for personalization
const preferences = context.context.relevantMemories.filter(
  m => m.metadata.type === "preference"
);

// Use profile for customization
const isNewUser = context.context.userProfile.totalInteractions === 0;
if (isNewUser) {
  console.log("Welcome! This is your first interaction.");
}
```

### Error Handling

```typescript
try {
  const context = await skynetThink({ user, input });
  // ... process ...
} catch (error) {
  if (error.message.includes("database")) {
    console.error("Database connection failed. Check stack_status.");
  } else if (error.message.includes("timeout")) {
    console.error("Query timeout. Reduce time range or limit.");
  } else {
    throw error;  // Unexpected error
  }
}
```

---

## Technical Details

### Performance Characteristics

**skynet_think:**
- **Time**: 100-500ms (depending on history size)
- **Database Queries**: 3-4 (user profile, interactions, memories)
- **Memory Search**: Semantic search can be slow for large collections
- **Optimization**: Disable topic extraction for simple queries

**skynet_respond:**
- **Time**: 50-200ms
- **Database Writes**: 1-2 (interaction + optional memory)
- **Graph Updates**: Creates node + relationships atomically
- **Optimization**: Batch multiple responses if possible

**skynet_validateMemory:**
- **Time**: 20-50ms
- **Database Queries**: 1 (lightweight existence check)
- **Impact**: Minimal performance overhead

### Best Practices

**Think:**
- Call once per user query (cache result)
- Disable topic extraction for greetings/simple responses
- Handle empty context gracefully (new users)
- Use recent interactions for conversation threading

**Respond:**
- Always call after generating response
- Link to previous interaction when contextually relevant
- Store important insights as memories
- Use consistent intent/sentiment categorization

**Validate:**
- Use in testing/development extensively
- In production, log warnings but don't block
- Set up monitoring alerts on validation failures
- Retry logic for transient failures

### Integration Patterns

**Stateless Services:**
```typescript
// Each request gets fresh context
app.post("/chat", async (req) => {
  const context = await skynetThink({ user: req.user, input: req.body.message });
  const response = await generateAIResponse(req.body.message, context);
  await skynetRespond({ user: req.user, input: req.body.message, output: response });
  return { message: response };
});
```

**Stateful Sessions:**
```typescript
// Context cached per session
class ChatSession {
  private lastInteractionId?: string;
  
  async chat(input: string) {
    const context = await skynetThink({ user: this.user, input });
    const output = await this.generateResponse(input, context);
    
    const result = await skynetRespond({
      user: this.user,
      input,
      output,
      previousInteractionId: this.lastInteractionId
    });
    
    this.lastInteractionId = result.interactionId;
    return output;
  }
}
```

### See Also

- [Interaction Tools](/api/interactions) - Lower-level interaction storage
- [Memory Tools](/api/memory) - Semantic memory operations
- [Architecture](/guide/architecture) - System design overview
