---
applyTo: '**'
---

# Architecture & Design Guidelines

## Purpose
Standardize system design patterns and technical structures while ensuring compliance with architectural principles and security protocols.

---

## Design Inspiration: Premium Wealth Management Aesthetic

*Inspired by Kairos Capital (https://kairoscapital.mu/) and premium financial services aesthetic*

### Branding & Logo

- Use the Kairos Capital wordmark and iconography for all public-facing assets. Prefer the official logo in vector (SVG) format when available.
- Primary logo source: https://kairoscapital.mu/ (download the official SVG for high-resolution use).
- Logo usage: place the logo on dark backgrounds using the white/negative variant; on light backgrounds use the full-color or dark variant depending on contrast.
- Clearspace: maintain at least 24px of clear space around the logo on most UI elements; scale proportionally for larger layouts.
- Do not alter the logo proportions, colors, or add effects that obscure legibility. Use the color variables defined in this document for accents and highlights.

Add any official brand assets (SVGs, color tokens) to the `public/brand/` folder and reference them from components as `/brand/kairos-logo.svg`.

### Color Palette

**Primary Colors (Kairos Capital)**
```css
--primary-ink: #031926;            /* Very deep ink - trust, stability */
--primary-teal: #007B7A;           /* Teal - modern finance, confidence */
--primary-cerulean: #00B3C6;       /* Cerulean accent - clarity and insight */
--primary-gold: #C9A84A;           /* Warm gold - prestige and premium highlights */
```

**Secondary Colors**
```css
--secondary-deep: #0F3440;         /* Deep teal-slate - sophistication */
--secondary-charcoal: #111319;     /* Charcoal - depth */
--secondary-silver: #BFC9CC;       /* Silver - elegance */
--secondary-platinum: #E9ECEC;     /* Platinum - refinement */
```

**Background & Surface**
```css
--bg-primary: #FFFFFF;              /* Clean white - clarity */
--bg-secondary: #F6F8F8;            /* Off-white - subtle warmth */
--bg-dark: #031926;                 /* Deep ink - contrast sections */
--bg-card: #FFFFFF;                 /* Card backgrounds */
--bg-overlay: rgba(3, 25, 38, 0.92); /* Modal overlays */
```

**Text Colors**
```css
--text-primary: #0E1B20;            /* Near-black ink - readability */
--text-secondary: #4F6467;          /* Muted teal-gray */
--text-light: #FFFFFF;              /* White text on dark */
--text-accent: #00B3C6;             /* Cerulean highlights */
--text-muted: #8A9899;              /* Subtle hints */
```

**Semantic Colors**
```css
--success: #28A745;                 /* Green - positive growth */
--success-light: #D4EDDA;
--warning: #FFB74D;                 /* Warm amber - caution */
--warning-light: #FFF3CD;
--error: #DC3545;                   /* Red - alerts */
--error-light: #F8D7DA;
--info: #00A3B2;                    /* Kairos teal - informational */
```

### Typography

**Font Stack**
```css
--font-heading: 'Merriweather', 'Georgia', serif;     /* Refined headings */
--font-body: 'Inter', 'Helvetica Neue', sans-serif;   /* Clean body text */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* Code/numbers */
```

**Type Scale**
```css
--text-xs: 0.75rem;     /* 12px - captions */
--text-sm: 0.875rem;    /* 14px - small text */
--text-base: 1rem;      /* 16px - body */
--text-lg: 1.125rem;    /* 18px - lead text */
--text-xl: 1.25rem;     /* 20px - subheadings */
--text-2xl: 1.5rem;     /* 24px - section titles */
--text-3xl: 1.875rem;   /* 30px - page titles */
--text-4xl: 2.25rem;    /* 36px - hero text */
--text-5xl: 3rem;       /* 48px - display */
```

**Font Weights**
```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
--space-10: 4rem;     /* 64px */
--space-12: 6rem;     /* 96px */
```

### UI Component Styling

**Cards**
```css
.card-premium {
  background: var(--bg-card);
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(2, 18, 22, 0.06),
              0 10px 36px rgba(2, 18, 22, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.card-premium:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08),
              0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

**Buttons**
```css
/* Primary - Kairos teal & gold accent */
.btn-primary {
  background: linear-gradient(135deg, var(--primary-teal) 0%, var(--primary-cerulean) 70%, var(--primary-gold) 100%);
  color: var(--text-light);
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 6px;
  transition: all 0.28s ease;
}

/* Secondary - Navy outline */
.btn-secondary {
  background: transparent;
  border: 2px solid var(--primary-teal);
  color: var(--primary-teal);
  padding: 10px 30px;
  border-radius: 6px;
}

/* Ghost - Minimal */
.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  padding: 12px 24px;
}
```

**Form Inputs**
```css
.input-premium {
  background: var(--bg-secondary);
  border: 1px solid #E1E5EB;
  border-radius: 4px;
  padding: 14px 16px;
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input-premium:focus {
  border-color: var(--primary-cerulean);
  box-shadow: 0 0 0 4px rgba(0, 179, 198, 0.12);
  outline: none;
}
```

### Layout Principles

**Grid System**
- Use 12-column grid for flexibility
- Maximum content width: 1280px
- Generous whitespace for premium feel
- Consistent gutters: 24px (desktop), 16px (mobile)

**Section Spacing**
```css
.section {
  padding: var(--space-12) 0; /* 96px vertical */
}

.section-tight {
  padding: var(--space-8) 0;  /* 48px vertical */
}
```

**Visual Hierarchy**
- Clear distinction between primary and secondary content
- Use of Kairos teal and warm gold accents sparingly for emphasis
- Ample negative space around key elements
- Progressive disclosure for complex information

### Animation & Transitions

```css
/* Subtle, professional animations */
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
--transition-slow: 500ms ease;

/* Entrance animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Use sparingly - wealth brands favor subtlety */
.animate-fade-in {
  animation: fadeInUp 0.6s ease forwards;
}
```

### Design Principles for Wealth Management

1. **Trust & Credibility**
   - Clean, uncluttered layouts
   - Professional photography
   - Consistent, polished typography
   - Subtle, refined color palette

2. **Exclusivity**
  - Premium feel through whitespace
  - Kairos teal + gold accents for luxury signaling
  - High-quality imagery
  - Refined micro-interactions

3. **Clarity**
   - Clear information hierarchy
   - Easy-to-read data visualizations
   - Intuitive navigation
   - Accessible contrast ratios

4. **Security**
   - Trust badges and certifications
   - Secure iconography
   - Professional tone in copy
   - Clear privacy indicators

---

## System Architecture Principles

### Separation of Concerns
- Keep UI, business logic, and data access layers separate
- Each module/component should have a single, well-defined responsibility
- Avoid mixing concerns within the same file or function

### Modularity
- Design components to be self-contained and reusable
- Use clear interfaces between modules
- Minimize dependencies between unrelated modules

### Scalability
- Design systems to handle increased load gracefully
- Use stateless components where possible
- Consider horizontal scaling in architecture decisions

---

## Design Patterns

### Component Architecture (Next.js/React)
```
app/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI elements (Button, Input, Card)
│   ├── layout/          # Layout components (Header, Footer, Sidebar)
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and helpers
├── services/            # API and external service integrations
├── types/               # TypeScript type definitions
└── constants/           # Application constants
```

### Server vs Client Components
- **Default to Server Components** for better performance
- Use Client Components (`'use client'`) only when:
  - Using React hooks (useState, useEffect, etc.)
  - Handling user interactions (onClick, onChange)
  - Accessing browser-only APIs
  - Using third-party client libraries

### Data Flow Patterns
- **Unidirectional data flow**: Props down, events up
- Use React Context sparingly for truly global state
- Prefer composition over prop drilling
- Colocate state as close to where it's used as possible

### API Design
- Follow RESTful conventions for API routes
- Use consistent response structures:
  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
    };
  }
  ```
- Implement proper error handling and status codes
- Version APIs when breaking changes are necessary

---

## Security Protocols

### Authentication & Authorization
- Never expose sensitive credentials in client-side code
- Use environment variables for secrets (`.env.local`)
- Implement proper session management
- Validate user permissions on both client and server

### Data Protection
- Sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement CSRF protection for forms
- Validate and sanitize data on the server, never trust client input

### API Security
- Implement rate limiting on API routes
- Use HTTPS for all communications
- Validate request origins with CORS policies
- Never expose internal error details to clients

### Environment Variables
```bash
# Public (exposed to browser) - prefix with NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=https://api.example.com

# Private (server-only) - no prefix
DATABASE_URL=postgresql://...
API_SECRET_KEY=...
```

---

## Code Organization Standards

### File Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `User.types.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| Routes/Pages | lowercase-kebab | `user-settings/page.tsx` |

### Import Organization
```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import Image from 'next/image';

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 3. Types
import type { User } from '@/types/User';

// 4. Relative imports (styles, local files)
import styles from './Component.module.css';
```

### Absolute Imports
Configure and use absolute imports for cleaner paths:
```typescript
// ✅ Good
import { Button } from '@/components/ui/Button';

// ❌ Avoid
import { Button } from '../../../components/ui/Button';
```

---

## Error Handling Architecture

### Error Boundaries
- Implement error boundaries for graceful failure handling
- Provide user-friendly error messages
- Log errors for debugging (server-side)

### Try-Catch Patterns
```typescript
async function fetchData(): Promise<Result<Data, Error>> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return { success: false, error };
  }
}
```

### Error Logging
- Use structured logging format
- Include context (user ID, request ID, timestamp)
- Never log sensitive information (passwords, tokens)

---

## Performance Guidelines

### Rendering Optimization
- Use React.memo() for expensive pure components
- Implement proper key props for lists
- Avoid inline function definitions in JSX
- Use useMemo/useCallback appropriately (not everywhere)

### Data Fetching
- Leverage Next.js caching strategies
- Implement loading and error states
- Use optimistic updates for better UX
- Deduplicate requests where possible

### Bundle Optimization
- Use dynamic imports for code splitting
- Analyze bundle size regularly
- Tree-shake unused code
- Lazy load below-the-fold content

---

## Testing Architecture

### Test Structure
```
__tests__/
├── unit/           # Unit tests for functions/hooks
├── components/     # Component tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

### Testing Priorities
1. **Critical paths**: Authentication, payments, core features
2. **Business logic**: Utility functions, calculations
3. **Component behavior**: User interactions
4. **Edge cases**: Error states, empty states

---

## Documentation Requirements

### Code Documentation
- Document complex business logic with comments
- Use JSDoc for public APIs and utilities
- Keep README files updated
- Document architectural decisions (ADRs)

### Component Documentation
```typescript
/**
 * Button component with gaming aesthetic styling.
 * 
 * @param label - Button text content
 * @param variant - Visual style variant
 * @param onClick - Click handler function
 * @param disabled - Whether the button is disabled
 * 
 * @example
 * <Button label="Start Game" variant="primary" onClick={handleStart} />
 */
```

---

## Compliance Checklist

Before merging code, ensure:
- [ ] Follows separation of concerns
- [ ] Uses appropriate design patterns
- [ ] Implements proper error handling
- [ ] Follows security protocols
- [ ] Has necessary documentation
- [ ] Passes all tests
- [ ] No sensitive data exposed
- [ ] Follows naming conventions
