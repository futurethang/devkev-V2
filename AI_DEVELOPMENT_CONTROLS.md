# AI Development Controls

This document explains how to control AI processing during development to prevent excessive API usage.

## Development Environment Setup

The project now includes controls to prevent automatic AI processing during development. This saves API tokens while still allowing you to test AI features when needed.

### Environment Variables

The following environment variables are set in `.env.development`:

```
DISABLE_AUTO_AI_PROCESSING=true
AGGREGATOR_AI_ENABLED=false
```

### What This Does

1. **Disables automatic AI processing** - Articles are fetched and stored but not processed with AI
2. **Prevents initialization of AI processors** - No API calls on startup
3. **Allows manual AI processing** - You can still trigger AI processing when you want to test

## Manual AI Processing

When you want to test AI features during development, you have several options:

### Option 1: Process a Small Batch via Script

```bash
# Process 5 articles (default)
pnpm ai:process-batch

# Process 3 articles for a specific profile
pnpm ai:process-batch profile-id 3

# Process 1 article for testing
node scripts/process-single-batch.js null 1
```

### Option 2: Enable AI for Current Session

Set the environment variable temporarily:

```bash
AGGREGATOR_AI_ENABLED=true pnpm dev
```

Or add it to your `.env.local` file temporarily:
```
AGGREGATOR_AI_ENABLED=true
```

### Option 3: Manual URL Submission

The manual URL submission feature will still work but won't trigger AI processing in development mode. You'll see a message indicating AI is disabled.

## Production Behavior

In production:
- AI processing is **enabled by default**
- All automatic processing works normally
- Scheduled jobs run with AI enhancement
- Manual submissions are processed with AI

## Database Connectivity

**Important**: Even in development mode, all operations still connect to your **remote Supabase database**. This means:

- ✅ Articles are stored in your production database
- ✅ Engagement tracking still works
- ✅ You can test the UI with real data
- ❌ No AI tokens are consumed for automatic processing

## Re-enabling AI Processing

To re-enable AI processing in development:

1. **Temporarily**: Set `AGGREGATOR_AI_ENABLED=true` in your environment
2. **Permanently**: Remove or set `AGGREGATOR_AI_ENABLED=false` to `true` in `.env.development`
3. **Per-operation**: Use the manual processing script for specific batches

## API Endpoints Affected

The following endpoints respect the development AI controls:

- `GET /api/aggregator` - No AI initialization
- `POST /api/aggregator/sync` - Skips AI processing steps
- `POST /api/aggregator/submit-url` - Skips AI analysis of submitted URLs
- `POST /api/aggregator/process-batch` - Returns early with disabled message

## Testing Strategy

Recommended workflow for development:

1. **Most of the time**: Develop with AI disabled (default)
2. **When testing AI features**: Use `pnpm ai:process-batch` to process a few articles
3. **When testing UI**: The interface works fully with non-AI articles
4. **Before deployment**: Test with AI enabled to ensure everything works

This approach ensures you get fast iteration cycles while preserving your API quota for when you actually need to test AI functionality.