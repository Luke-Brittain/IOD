## Objective

Generate a comprehensive technical description for a full-stack Next.js application based on the provided User Stories. The output should align with project architecture guidelines and follow the premium Kairos Capital-inspired design aesthetic.

---

## Context & Constraints

| Attribute | Specification |
|-----------|---------------|
| **Application Type** | Next.js 15 App Router (Server-First Architecture) |
| **Target Users** | Relationship Managers handling UHNW clients |
| **Design System** | Premium wealth management aesthetic (Kairos Capital-inspired) |
| **Database** | Graph database for relationship mapping + Supabase for transactional data |
| **Key Constraint** | Simple, intuitive UX; explainable AI/lead scoring |

---

## Source Materials

Provide the following inputs:

1. **User Stories** - Reference files from `docs/stories/` directory
2. **Implementation Plan** - High-level feature breakdown (optional)

---

## Technical Description Output Format

Structure the technical description in `docs/technical-description/` with these sections:

### 1. Application Overview

```markdown
## Application Overview

**Purpose:** [Brief description of what the application does]

**Architecture Pattern:** Next.js App Router with Server Components

**Key Capabilities:**
- [Capability 1]
- [Capability 2]
- [Capability 3]
```

### 2. Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 | Server components, App Router, built-in API routes |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS | Utility-first, design system support |
| Database | Supabase (PostgreSQL) | Real-time, auth, storage |
| Graph DB | Neo4j / Memgraph | Relationship mapping |
| State | React Server Components + Context | Minimal client state |
| Auth | Supabase Auth | Built-in, secure |
| AI/LLM | OpenAI / Anthropic | Chatbot, lead scoring |

### 3. Project Folder Structure

```
uhnw/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Main app route group
│   │   ├── page.tsx              # Dashboard home
│   │   ├── prospects/
│   │   │   ├── page.tsx          # Prospects list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Prospect detail
│   │   ├── signals/
│   │   │   └── page.tsx          # Liquidity signals
│   │   └── layout.tsx            # Dashboard layout
│   ├── api/                      # API routes
│   │   ├── prospects/
│   │   │   └── route.ts
│   │   ├── signals/
│   │   │   └── route.ts
│   │   └── chat/
│   │       └── route.ts          # AI chatbot endpoint
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI (Button, Card, Input)
│   ├── layout/                   # Header, Sidebar, Footer
│   └── features/                 # Feature components
│       ├── ProspectCard/
│       ├── SignalList/
│       ├── LeadScoreCard/
│       ├── FilterPanel/
│       └── ChatBot/
├── hooks/                        # Custom React hooks
│   ├── useProspects.ts
│   ├── useSignals.ts
│   └── useChat.ts
├── lib/                          # Utilities and helpers
│   ├── utils.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── graph/
│       └── client.ts             # Graph DB client
├── services/                     # API service layer
│   ├── prospectService.ts
│   ├── signalService.ts
│   └── chatService.ts
├── types/                        # TypeScript definitions
│   ├── prospect.ts
│   ├── signal.ts
│   └── api.ts
├── constants/                    # App constants
│   └── index.ts
├── docs/                         # Documentation
│   ├── stories/                  # User stories
│   └── technical-description/    # Technical specs
└── .github/
    ├── instructions/             # AI coding guidelines
    └── prompts/                  # Reusable prompts
```

### 4. Data Models

Define TypeScript interfaces following naming conventions:

```typescript
/**
 * Represents a prospect/client in the system
 * @interface Prospect
 */
interface Prospect {
  id: string;
  name: string;
  company: string;
  sector: string;
  city: string;
  leadScore: number;
  leadScoreExplanation: string;
  signals: Signal[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a liquidity signal event
 * @interface Signal
 */
interface Signal {
  id: string;
  type: SignalType;
  source: DataSource;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
  prospectId: string;
}

/**
 * API response wrapper
 * @interface ApiResponse
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### 5. API Endpoint Specification

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prospects` | List prospects with filters |
| `GET` | `/api/prospects/:id` | Get prospect details |
| `GET` | `/api/signals` | List liquidity signals |
| `GET` | `/api/signals/recent` | Get recent signals |
| `POST` | `/api/chat` | Send message to AI chatbot |
| `GET` | `/api/metrics` | Dashboard metrics |

### 6. Component Hierarchy

```
App (layout.tsx)
├── Header
│   ├── Logo
│   ├── Navigation
│   └── UserMenu
├── Sidebar
│   ├── FilterPanel
│   │   ├── CityFilter
│   │   ├── SectorFilter
│   │   └── NetworkFilter
│   └── MetricsCard
└── Main Content
    ├── Dashboard (page.tsx)
    │   ├── SignalList
    │   ├── TopProspects
    │   └── ActivityMetrics
    ├── ProspectList (prospects/page.tsx)
    │   └── ProspectCard (× n)
    │       ├── LeadScoreIndicator
    │       └── ActionButtons
    ├── ProspectDetail (prospects/[id]/page.tsx)
    │   ├── ProspectHeader
    │   ├── SignalTimeline
    │   ├── RelationshipGraph
    │   └── SuggestedActions
    └── ChatBot (floating)
        ├── ChatInput
        └── ChatMessages
```

---

## Design Guidelines

Follow the premium wealth management aesthetic:

**Colors:**
- Primary: Deep Navy (`#0A1628`), Royal Blue (`#1E3A5F`)
- Accent: Gold (`#C9A227`, `#D4AF37`)
- Background: White (`#FFFFFF`), Off-white (`#F8F9FA`)

**Typography:**
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

**Principles:**
- Clean, uncluttered layouts
- Generous whitespace
- Subtle animations
- Explainable, transparent data

---

## Documentation Checklist

Before finalizing, ensure:

- [ ] All data models have JSDoc comments
- [ ] API endpoints include request/response examples
- [ ] Component hierarchy reflects actual page structure
- [ ] Technology choices have clear rationale
- [ ] File naming follows conventions (PascalCase for components)
- [ ] Types are explicit, no `any` usage

