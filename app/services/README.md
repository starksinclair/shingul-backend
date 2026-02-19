# Services Architecture

This directory follows a **hybrid interface-based architecture** that balances flexibility with simplicity.

## Architecture Overview

### Interface-Based Services (Swappable)

These services use interfaces and can have multiple implementations:

- **EmailService** (`IEmailService`) - Can swap between SendGrid, SES, SMTP, etc.
- **RateLimitService** (`IRateLimitService`) - Can swap between Redis, Database, Memory, etc.

### Static Utility Services (Simple)

These are pure utilities that don't need multiple implementations:

- **TokenService** - Cryptographic token generation/hashing
- **MagicLinkService** - Orchestrates magic link flow
- **AuthService** - Orchestrates authentication flow

## Structure

```
services/
├── interfaces/              # Service interfaces
│   ├── email_service_interface.ts
│   └── rate_limit_service_interface.ts
├── providers/              # Service implementations
│   ├── email_service_provider.ts      # Default email implementation
│   └── rate_limit_service_provider.ts # Database-based rate limiting
├── service_container.ts    # Dependency injection container
├── token_service.ts        # Static utility (no interface needed)
├── magic_link_service.ts   # Static orchestrator
└── auth_service.ts         # Static orchestrator
```

## Usage

### In Controllers

```typescript
import { EmailService, RateLimitService } from '#services/service_container'

// Use the services (automatically uses default providers)
await EmailService.sendMagicLink(email, token)
const isLimited = await RateLimitService.isRateLimited(email, 1)
```

### Dependency Injection (Advanced)

```typescript
import { serviceContainer } from '#services/service_container'
import type { IEmailService } from '#services/interfaces/email_service_interface'

// Get service instance
const emailService = serviceContainer.emailService

// Or inject custom implementation (useful for testing)
serviceContainer.setEmailService(mockEmailService)
```

## Creating Alternative Implementations

### Example: Redis Rate Limiter

```typescript
// app/services/providers/redis_rate_limit_service_provider.ts
import type { IRateLimitService } from '../interfaces/rate_limit_service_interface.js'
import redis from 'ioredis' // or your Redis client

export class RedisRateLimitServiceProvider implements IRateLimitService {
  private redis: redis

  constructor() {
    this.redis = new redis(process.env.REDIS_URL)
  }

  async isRateLimited(email: string, limitMinutes: number = 1): Promise<boolean> {
    const key = `rate_limit:${email}`
    const exists = await this.redis.exists(key)
    return exists === 1
  }

  async getTimeRemaining(email: string, limitMinutes: number = 1): Promise<number> {
    const key = `rate_limit:${email}`
    const ttl = await this.redis.ttl(key)
    return Math.max(0, ttl)
  }
}

// Usage:
// serviceContainer.setRateLimitService(new RedisRateLimitServiceProvider())
```

### Example: SendGrid Email Service

```typescript
// app/services/providers/sendgrid_email_service_provider.ts
import type { IEmailService } from '../interfaces/email_service_interface.js'
import sgMail from '@sendgrid/mail'

export class SendGridEmailServiceProvider implements IEmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
  }

  async sendMagicLink(email: string, token: string): Promise<void> {
    const apiUrl = process.env.API_URL || 'http://localhost:3333'
    const magicLink = `${apiUrl}/api/auth/email/callback?token=${token}`

    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL!,
      subject: 'Your Magic Link',
      html: `<a href="${magicLink}">Click here to login</a>`,
    })
  }
}

// Usage:
// serviceContainer.setEmailService(new SendGridEmailServiceProvider())
```

## Testing

The interface-based approach makes testing much easier:

```typescript
import { serviceContainer } from '#services/service_container'
import type { IEmailService } from '#services/interfaces/email_service_interface'

test('should send magic link', async () => {
  const mockEmailService: IEmailService = {
    sendMagicLink: async (email, token) => {
      // Mock implementation
    },
  }

  serviceContainer.setEmailService(mockEmailService)

  // Test your code...

  serviceContainer.reset() // Clean up
})
```

## Benefits

1. **Testability** - Easy to mock services for unit tests
2. **Flexibility** - Swap implementations without changing business logic
3. **Maintainability** - Clear separation of concerns
4. **Scalability** - Easy to add new providers (e.g., switch to Redis for rate limiting)
5. **Backward Compatibility** - Old code still works via convenience exports

## When to Add Interfaces

Add interfaces when:

- ✅ Service has external dependencies (email, storage, APIs)
- ✅ Multiple implementations are possible (different providers)
- ✅ Service needs to be mocked in tests
- ✅ Service might change based on environment

Keep static when:

- ✅ Pure utility functions (TokenService)
- ✅ Simple orchestrators (MagicLinkService, AuthService)
- ✅ No external dependencies
- ✅ Unlikely to need multiple implementations
