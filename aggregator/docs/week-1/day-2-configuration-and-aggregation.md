# Day 2: Configuration System & Basic Aggregation

## What I Learned

### Zod Schema Validation
Zod provides runtime type safety for configuration files:
- **Parse vs SafeParse**: Use `parse()` for throwing errors, `safeParse()` for error handling
- **Custom Error Messages**: Provide user-friendly validation messages
- **Complex Validation**: Validate nested objects, arrays, and conditional logic
- **Type Inference**: Get TypeScript types automatically from schemas

### Configuration-First Architecture
Building a system that's driven by JSON configuration rather than hardcoded values:
- **Separation of Concerns**: Business logic separate from configuration
- **Runtime Flexibility**: Change behavior without code deployment
- **Validation Layer**: Ensure configurations are valid before use
- **Default Patterns**: Sensible defaults with override capabilities

### Testing Strategy Evolution
Different types of tests serve different purposes:
- **Unit Tests**: Fast, isolated, mockable components
- **Integration Tests**: Real external dependencies, slower but more realistic
- **Demo Scripts**: Manual testing and system validation

## Code I Wrote

### Zod Schema System
```typescript
export const SourceConfigSchema = z.object({
  id: z.string().min(1, 'Source ID is required'),
  name: z.string().min(1, 'Source name is required'),
  type: SourceTypeSchema,
  url: z.string().url('Must be a valid URL'),
  fetchInterval: z.number().min(1, 'Fetch interval must be at least 1 minute'),
  weight: z.number().min(0).max(1, 'Weight must be between 0 and 1'),
  enabled: z.boolean()
})
```

**Key Benefits:**
- Runtime validation catches configuration errors early
- TypeScript integration provides compile-time safety
- Clear error messages help with debugging
- Schema evolution is easier to manage

### ConfigLoader Class
```typescript
export class ConfigLoader {
  async loadSources(): Promise<SourceConfig[]> {
    const sourcesData = JSON.parse(await fs.readFile(this.sourcesFile, 'utf-8'))
    const validatedSources = SourcesConfigSchema.parse(sourcesData)
    return validatedSources.sources
  }
  
  async getActiveProfiles(): Promise<FocusProfile[]> {
    // Load all profiles and filter enabled ones
    // Gracefully handle invalid profiles with warnings
  }
}
```

### Aggregator Architecture
```typescript
export class Aggregator {
  async fetchFromSource(source: SourceConfig): Promise<FetchResult> {
    // Route to appropriate parser based on source type
    // Measure performance and handle errors
    // Return structured result with metrics
  }
  
  async fetchFromAllActiveProfiles(): Promise<AggregationResult> {
    // Parallel processing across profiles and sources
    // Aggregate metrics and error handling
    // Store results for status reporting
  }
}
```

## Challenges & Solutions

### Problem: Path Resolution in Different Contexts
Tests, demo scripts, and actual runtime have different working directories.

**Solution:** Used `__dirname` relative paths in ConfigLoader and made paths configurable for testing.

```typescript
constructor(configDir?: string) {
  this.configDir = configDir || path.join(__dirname, '..', '..', 'config')
}
```

### Problem: Node.js Lacks Native Fetch
Integration tests needed real HTTP requests but Node.js doesn't have fetch.

**Solution:** Added `node-fetch` polyfill in test setup for integration tests while keeping unit tests mocked.

### Problem: Malformed RSS Feeds
Real RSS feeds often have invalid XML or non-standard formats.

**Solution:** Robust error handling with specific error messages and graceful degradation.

## Configuration System Design

### Focus Profile Structure
```json
{
  "id": "ai-product",
  "name": "AI Product Builder", 
  "keywords": {
    "boost": {
      "high": ["ai product", "user experience"],
      "medium": ["prototype", "mvp"],
      "low": ["startup", "revenue"]
    },
    "filter": {
      "exclude": ["academic", "research paper"],
      "require": ["ai", "product"]
    }
  },
  "processing": {
    "generateSummary": true,
    "minRelevanceScore": 0.3,
    "maxAgeDays": 7
  }
}
```

### Source Configuration
```json
{
  "id": "hn-rss",
  "name": "Hacker News",
  "type": "rss",
  "url": "https://hnrss.org/frontpage",
  "fetchInterval": 30,
  "weight": 0.7,
  "enabled": true
}
```

**Configuration Benefits:**
- Easy A/B testing of different keyword sets
- Quick source addition/removal
- Profile switching without code changes
- Debugging through configuration inspection

## Testing Approach

### Three-Layer Testing Strategy

**1. Unit Tests (Fast, Isolated)**
```typescript
// Mock all external dependencies
vi.mock('fs/promises')
vi.mock('../../lib/sources/rss-parser')

// Test business logic in isolation
expect(result.fetchResults).toHaveLength(2)
expect(result.successfulFetches).toBe(2)
```

**2. Integration Tests (Real Dependencies)**
```typescript
// Use real RSS feeds and file system
const items = await parser.fetchAndParse('https://hnrss.org/frontpage?count=5')
expect(items.length).toBeGreaterThan(0)
```

**3. Demo Scripts (Manual Validation)**
```typescript
// End-to-end system test with real configuration
const status = await aggregator.getStatus()
const result = await aggregator.fetchFromSource(testSource)
```

## Error Handling Patterns

### Graceful Degradation
- Invalid profiles are skipped with warnings, not fatal errors
- Failed sources don't stop other sources from processing
- Malformed RSS feeds log errors but don't crash the system

### Structured Error Results
```typescript
interface FetchResult {
  success: boolean
  itemCount: number
  duration: number
  error?: string  // Only present if success is false
}
```

### Error Context
- Source identification in all error messages
- Performance metrics even for failed requests
- Aggregated error reporting across multiple sources

## Performance Considerations

### Parallel Processing
- Fetch all sources in a profile simultaneously using `Promise.all()`
- Process multiple profiles in parallel
- Non-blocking error handling per source

### Metrics Collection
- Fetch duration timing
- Success/failure rates per source
- Item counts and processing statistics
- Memory-efficient result aggregation

## Next Steps

- [ ] Add retry logic for failed fetches
- [ ] Implement source-specific parsers (Twitter, GitHub, Reddit)
- [ ] Add rate limiting and request queuing
- [ ] Create a web dashboard for configuration management

## Resources for Deeper Learning

- [Zod Documentation](https://zod.dev/) - Schema validation and type inference
- [Node.js Path Module](https://nodejs.org/api/path.html) - Cross-platform path handling
- [Promise.all() vs Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) - Parallel async patterns
- [Error Handling Best Practices](https://nodejs.org/en/guides/error-handling/) - Node.js error patterns
- [RSS 2.0 Real-world Issues](https://www.rssboard.org/rss-profile) - Common RSS feed problems

## Key Insights

1. **Configuration as Code**: JSON configs provide flexibility without deployment
2. **Validation is Essential**: Real-world data is messy; validate everything
3. **Error Boundaries**: Isolate failures to prevent system-wide crashes
4. **Testing Pyramid**: Unit tests for logic, integration tests for contracts
5. **Metrics Matter**: Collect performance data from day one
6. **Parallel by Default**: Async operations should be concurrent when possible

---

**Time Investment:** ~6 hours
**Tests Written:** 14 unit tests + 5 integration tests
**Configuration Files:** 2 (sources + profile)
**Lines of Code:** ~800 (including tests and documentation)
**Next Session:** Source-specific parsers and rate limiting