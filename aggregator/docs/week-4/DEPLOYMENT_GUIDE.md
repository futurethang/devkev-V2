# Deployment Guide - AI Content Aggregator

## 🚀 Production Deployment Options

### **Option 1: Vercel Deployment (Recommended)**

The system is designed to deploy seamlessly on Vercel with the Next.js portfolio site.

#### **Prerequisites**
```bash
# Ensure you have the Vercel CLI
npm i -g vercel

# Ensure all dependencies are installed
pnpm install
```

#### **Environment Setup**
Create `.env.local` for local development:
```bash
# AI Provider Configuration
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Database (if using external storage)
DATABASE_URL=your_database_url_here

# Optional: Custom configuration paths
AGGREGATOR_CONFIG_PATH=/path/to/config
```

#### **Deploy to Vercel**
```bash
# Deploy with Vercel
vercel

# Set environment variables in Vercel dashboard
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY

# Production deployment
vercel --prod
```

#### **Vercel Configuration**
Add to `vercel.json`:
```json
{
  "functions": {
    "app/api/aggregator/route.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "framework": "nextjs"
}
```

### **Option 2: Docker Deployment**

#### **Create Dockerfile**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Contentlayer files
RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/aggregator ./aggregator

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### **Docker Compose**
```yaml
version: '3.8'
services:
  aggregator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./aggregator/config:/app/aggregator/config:ro
      - aggregator_data:/app/aggregator/output
    restart: unless-stopped

volumes:
  aggregator_data:
```

### **Option 3: Railway/Render Deployment**

#### **Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### **Render**
1. Connect your GitHub repository
2. Set build command: `pnpm install && pnpm build`
3. Set start command: `pnpm start`
4. Add environment variables in dashboard

## ⚙️ Configuration Management

### **Production Configuration**

#### **Environment Variables**
```bash
# Required for AI features
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional performance settings
AGGREGATOR_MAX_CONCURRENCY=5
AGGREGATOR_CACHE_TTL=300
AGGREGATOR_TIMEOUT=30000

# Optional database for persistence
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

#### **Configuration Files**
Ensure these files are properly deployed:
```
aggregator/
├── config/
│   ├── sources.json          # Source definitions
│   └── profiles/
│       ├── ai-product.json   # Focus profiles
│       ├── ml-engineering.json
│       └── design-systems.json
```

### **Production Optimizations**

#### **Next.js Configuration**
Update `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk']
  },
  
  // Enable output tracing for Docker
  output: 'standalone',
  
  // Optimize for production
  swcMinify: true,
  
  // API route timeout
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  
  // Headers for better performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
        ],
      },
    ]
  }
}

export default nextConfig
```

#### **Performance Monitoring**
Add monitoring to API routes:
```typescript
// Add to api/aggregator/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... existing code
    
    // Log performance metrics
    console.log(`Aggregator API: ${Date.now() - startTime}ms`)
    
    return NextResponse.json(result, {
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })
  } catch (error) {
    // Log errors for monitoring
    console.error('Aggregator API Error:', {
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}
```

## 🔒 Security Considerations

### **API Key Management**
- Store all API keys in environment variables
- Use Vercel's secure environment variable storage
- Rotate keys regularly
- Monitor usage and set limits

### **Rate Limiting**
Implement rate limiting for production:
```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimit = new Map()

export function checkRateLimit(request: NextRequest, limit = 10) {
  const ip = request.ip || 'anonymous'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  
  const userRequests = rateLimit.get(ip) || []
  const recentRequests = userRequests.filter((time: number) => now - time < windowMs)
  
  if (recentRequests.length >= limit) {
    return false
  }
  
  recentRequests.push(now)
  rateLimit.set(ip, recentRequests)
  return true
}
```

### **Input Validation**
```typescript
// lib/validation.ts
import { z } from 'zod'

export const AggregatorRequestSchema = z.object({
  profile: z.string().min(1).max(50),
  ai: z.boolean().optional(),
  includeItems: z.boolean().optional()
})

export function validateRequest(data: unknown) {
  return AggregatorRequestSchema.safeParse(data)
}
```

## 📊 Monitoring & Observability

### **Health Check Endpoint**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      aggregator: 'ok',
      ai: 'ok',
      config: 'ok'
    }
  }
  
  return NextResponse.json(health)
}
```

### **Logging Configuration**
```typescript
// lib/logger.ts
const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },
  
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}

export default logger
```

## 🧪 Testing in Production

### **Smoke Tests**
```bash
# Test API endpoints
curl -X GET "https://your-domain.com/api/health"
curl -X GET "https://your-domain.com/api/aggregator/config?type=status"

# Test aggregation
curl -X GET "https://your-domain.com/api/aggregator?profile=ai-product&ai=false"
```

### **Load Testing**
```bash
# Install k6 for load testing
brew install k6

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let response = http.get('https://your-domain.com/api/aggregator?profile=ai-product');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });
}
EOF

# Run load test
k6 run load-test.js
```

## 🚨 Troubleshooting

### **Common Issues**

#### **API Timeouts**
- Increase Vercel function timeout limit
- Add request queuing for heavy operations
- Implement response caching

#### **Memory Issues**
- Monitor Node.js memory usage
- Implement streaming for large responses
- Add garbage collection optimization

#### **AI Provider Errors**
- Implement fallback providers
- Add retry logic with exponential backoff
- Monitor API usage and quotas

### **Debug Commands**
```bash
# Check system status
curl https://your-domain.com/api/health

# Test configuration loading
curl https://your-domain.com/api/aggregator/config?type=status

# Debug specific profile
curl "https://your-domain.com/api/aggregator?profile=ai-product&includeItems=false"
```

## 📈 Scaling Considerations

### **Horizontal Scaling**
- Use serverless functions for API routes
- Implement caching layer (Redis)
- Add database for persistent storage
- Use CDN for static assets

### **Performance Optimizations**
- Implement request batching
- Add background job processing
- Use streaming responses for large datasets
- Optimize database queries

---

This deployment guide ensures your AI Content Aggregator runs reliably in production with proper monitoring, security, and performance optimizations.