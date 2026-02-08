---
applyTo: '**'
---

# Documentation Rules

## Purpose
Ensure uniformity in technical documentation and automate the creation of accurate, up-to-date artefacts across the project.

---

## Documentation Standards

### File Documentation Headers

Every significant file should include a documentation header:

```typescript
/**
 * @file UserDashboard.tsx
 * @description Main dashboard component for UHNW client portfolio overview
 * @module components/dashboard
 * @author Team
 * @created 2025-01-15
 * @modified 2025-01-20
 * 
 * @dependencies
 * - @/components/ui/Card
 * - @/hooks/usePortfolio
 * - @/services/api
 */
```

### Component Documentation

```typescript
/**
 * PortfolioCard - Displays client portfolio summary with key metrics
 * 
 * @component
 * @category Dashboard
 * 
 * @description
 * A premium card component that shows portfolio value, returns,
 * and allocation breakdown. Supports real-time updates and
 * interactive drill-down to asset details.
 * 
 * @param {PortfolioCardProps} props - Component props
 * @param {Portfolio} props.portfolio - Portfolio data object
 * @param {boolean} [props.showChart=true] - Whether to display allocation chart
 * @param {Function} [props.onAssetClick] - Callback when asset is clicked
 * 
 * @returns {JSX.Element} Rendered portfolio card
 * 
 * @example
 * // Basic usage
 * <PortfolioCard portfolio={clientPortfolio} />
 * 
 * @example
 * // With interaction handler
 * <PortfolioCard 
 *   portfolio={clientPortfolio}
 *   showChart={true}
 *   onAssetClick={(asset) => navigateToAsset(asset.id)}
 * />
 * 
 * @see {@link Portfolio} for data structure
 * @see {@link AssetAllocation} for allocation breakdown
 */
```

### Function Documentation

```typescript
/**
 * Calculates the weighted average return for a portfolio
 * 
 * @function calculateWeightedReturn
 * @category Finance/Calculations
 * 
 * @description
 * Computes the portfolio's weighted average return based on
 * individual asset returns and their allocation percentages.
 * Handles edge cases like zero allocations and missing data.
 * 
 * @param {Asset[]} assets - Array of portfolio assets
 * @param {TimeFrame} [timeFrame='1Y'] - Return calculation period
 * @returns {number} Weighted return as a decimal (e.g., 0.12 for 12%)
 * 
 * @throws {Error} If assets array is empty
 * @throws {Error} If allocations don't sum to 100%
 * 
 * @example
 * const assets = [
 *   { name: 'Equities', allocation: 0.6, return: 0.15 },
 *   { name: 'Bonds', allocation: 0.4, return: 0.05 }
 * ];
 * const weightedReturn = calculateWeightedReturn(assets);
 * // Returns: 0.11 (11%)
 * 
 * @since 1.0.0
 * @version 1.2.0
 */
```

### API Documentation

```typescript
/**
 * @api {POST} /api/clients/:id/portfolio Create Portfolio
 * @apiName CreatePortfolio
 * @apiGroup Portfolio
 * @apiVersion 1.0.0
 * 
 * @apiDescription
 * Creates a new investment portfolio for an UHNW client.
 * Validates asset allocations and risk parameters before creation.
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type application/json
 * 
 * @apiParam {String} id Client's unique ID
 * 
 * @apiBody {String} name Portfolio name
 * @apiBody {String} [strategy] Investment strategy identifier
 * @apiBody {Object[]} allocations Initial asset allocations
 * @apiBody {String} allocations.assetClass Asset class code
 * @apiBody {Number} allocations.percentage Allocation percentage (0-100)
 * 
 * @apiSuccess {Boolean} success Operation status
 * @apiSuccess {Object} data Created portfolio object
 * @apiSuccess {String} data.id Portfolio ID
 * @apiSuccess {String} data.name Portfolio name
 * @apiSuccess {Date} data.createdAt Creation timestamp
 * 
 * @apiError {Object} error Error details
 * @apiError {String} error.code Error code
 * @apiError {String} error.message Human-readable message
 * 
 * @apiSuccessExample {json} Success Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "pf_abc123",
 *     "name": "Growth Portfolio",
 *     "createdAt": "2025-01-15T10:30:00Z"
 *   }
 * }
 * 
 * @apiErrorExample {json} Validation Error:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "INVALID_ALLOCATION",
 *     "message": "Allocations must sum to 100%"
 *   }
 * }
 */
```

---

## Type Documentation

### Interface Documentation

```typescript
/**
 * Represents a client's investment portfolio
 * 
 * @interface Portfolio
 * @category Types/Finance
 * 
 * @property {string} id - Unique portfolio identifier (format: pf_*)
 * @property {string} clientId - Reference to owning client
 * @property {string} name - Display name for the portfolio
 * @property {PortfolioType} type - Classification of portfolio
 * @property {Asset[]} assets - Array of holdings
 * @property {PortfolioMetrics} metrics - Calculated performance metrics
 * @property {RiskProfile} riskProfile - Risk assessment data
 * @property {Date} createdAt - Portfolio creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 * 
 * @example
 * const portfolio: Portfolio = {
 *   id: 'pf_abc123',
 *   clientId: 'cl_xyz789',
 *   name: 'Growth Portfolio',
 *   type: 'DISCRETIONARY',
 *   assets: [...],
 *   metrics: { totalValue: 5000000, ytdReturn: 0.12 },
 *   riskProfile: { score: 7, category: 'AGGRESSIVE' },
 *   createdAt: new Date('2025-01-01'),
 *   updatedAt: new Date('2025-01-15')
 * };
 */
interface Portfolio {
  id: string;
  clientId: string;
  name: string;
  type: PortfolioType;
  assets: Asset[];
  metrics: PortfolioMetrics;
  riskProfile: RiskProfile;
  createdAt: Date;
  updatedAt: Date;
}
```

### Enum Documentation

```typescript
/**
 * Portfolio type classifications
 * 
 * @enum {string} PortfolioType
 * @category Types/Finance
 * 
 * @property {string} DISCRETIONARY - Managed by advisor with full authority
 * @property {string} ADVISORY - Client makes final decisions
 * @property {string} EXECUTION_ONLY - Client manages independently
 * @property {string} FAMILY_OFFICE - Multi-generational family wealth
 */
enum PortfolioType {
  /** Managed by advisor with full authority */
  DISCRETIONARY = 'DISCRETIONARY',
  /** Client makes final decisions */
  ADVISORY = 'ADVISORY',
  /** Client manages independently */
  EXECUTION_ONLY = 'EXECUTION_ONLY',
  /** Multi-generational family wealth */
  FAMILY_OFFICE = 'FAMILY_OFFICE',
}
```

---

## README Documentation

### Project README Template

```markdown
# Project Name

> Brief one-line description of the project

## Overview

Detailed description of what this project does and its purpose
in the UHNW wealth management context.

## Features

- ✨ Feature one with brief description
- 🔒 Feature two with brief description
- 📊 Feature three with brief description

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase |
| Auth | Supabase Auth |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account

### Installation

\`\`\`bash
# Clone the repository
git clone <repo-url>

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development server
pnpm dev
\`\`\`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## Project Structure

\`\`\`
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── services/           # API and external services
├── types/              # TypeScript type definitions
└── constants/          # Application constants
\`\`\`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[License Type] - See [LICENSE](./LICENSE) for details.
```

---

## Component README Template

```markdown
# ComponentName

> Brief description of what this component does

## Usage

\`\`\`tsx
import { ComponentName } from '@/components/ui/ComponentName';

<ComponentName
  prop1="value"
  prop2={100}
  onAction={handleAction}
/>
\`\`\`

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `prop1` | `string` | - | Yes | Description of prop1 |
| `prop2` | `number` | `0` | No | Description of prop2 |
| `onAction` | `() => void` | - | No | Callback when action occurs |

## Variants

### Primary
\`\`\`tsx
<ComponentName variant="primary" />
\`\`\`

### Secondary
\`\`\`tsx
<ComponentName variant="secondary" />
\`\`\`

## Examples

### Basic Example
\`\`\`tsx
<ComponentName prop1="Hello" />
\`\`\`

### With Custom Styling
\`\`\`tsx
<ComponentName 
  prop1="Hello" 
  className="custom-class"
/>
\`\`\`

## Accessibility

- Keyboard navigation supported
- ARIA labels included
- Screen reader friendly

## Related Components

- [RelatedComponent1](../RelatedComponent1)
- [RelatedComponent2](../RelatedComponent2)
```

---

## Changelog Documentation

### CHANGELOG.md Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature description

### Changed
- Modified feature description

### Fixed
- Bug fix description

## [1.2.0] - 2025-01-15

### Added
- Portfolio rebalancing feature
- Multi-currency support for international clients
- Real-time market data integration

### Changed
- Improved dashboard loading performance by 40%
- Updated chart library to v3.0

### Fixed
- Fixed calculation error in weighted returns
- Resolved timezone issues in transaction history

### Security
- Updated dependencies to patch CVE-2025-XXXX

## [1.1.0] - 2025-01-01

### Added
- Initial release with core portfolio management
- Client onboarding workflow
- Basic reporting features
```

---

## Inline Documentation Rules

### Comment Styles

```typescript
// ============================================
// SECTION: Portfolio Calculations
// ============================================

/**
 * Block comment for complex logic explanation
 * Spanning multiple lines when needed
 */

// Single line comment for brief notes

// TODO: Add caching for performance
// FIXME: Handle edge case for empty portfolios
// NOTE: This assumes UTC timezone
// HACK: Temporary fix, refactor in v2.0
// WARNING: Deprecated, use newFunction() instead
```

### Magic Numbers & Constants

```typescript
// ❌ Avoid magic numbers
if (portfolio.riskScore > 7) { ... }

// ✅ Use documented constants
/**
 * Risk score threshold for aggressive portfolios
 * Scores above this indicate high risk tolerance
 */
const AGGRESSIVE_RISK_THRESHOLD = 7;

if (portfolio.riskScore > AGGRESSIVE_RISK_THRESHOLD) { ... }
```

### Complex Algorithm Documentation

```typescript
/**
 * Modern Portfolio Theory (MPT) Optimization
 * 
 * @description
 * Implements mean-variance optimization to find the efficient frontier.
 * Uses quadratic programming to minimize portfolio variance for a
 * given expected return.
 * 
 * Algorithm Steps:
 * 1. Calculate expected returns for each asset
 * 2. Compute covariance matrix of asset returns
 * 3. Define constraints (weights sum to 1, no short selling)
 * 4. Solve quadratic optimization problem
 * 5. Return optimal weights
 * 
 * @see https://en.wikipedia.org/wiki/Modern_portfolio_theory
 * @see Markowitz, H. (1952). Portfolio Selection
 * 
 * @complexity O(n³) where n = number of assets
 */
function optimizePortfolio(assets: Asset[]): OptimalWeights {
  // Implementation...
}
```

---

## Auto-Generated Documentation

### TypeDoc Configuration

```json
// typedoc.json
{
  "entryPoints": ["./src"],
  "entryPointStrategy": "expand",
  "out": "./docs/api",
  "exclude": ["**/*.test.ts", "**/*.spec.ts"],
  "excludePrivate": true,
  "excludeProtected": true,
  "includeVersion": true,
  "categorizeByGroup": true,
  "categoryOrder": ["Components", "Hooks", "Services", "Types", "Utils"],
  "navigationLinks": {
    "GitHub": "https://github.com/org/repo"
  },
  "plugin": ["typedoc-plugin-markdown"]
}
```

### Storybook for Component Documentation

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * Premium button component following the Kairos Capital design system.
 * Supports multiple variants for different use cases in the UHNW platform.
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      description: 'Visual style variant',
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      description: 'Button size',
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Primary button for main actions like "Submit", "Confirm"
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Secondary button for alternative actions
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};
```

---

## Documentation Checklist

Before code review, ensure:

- [ ] All exported functions have JSDoc comments
- [ ] Complex algorithms have step-by-step explanations
- [ ] Public interfaces/types are documented
- [ ] README is up-to-date with new features
- [ ] CHANGELOG is updated for significant changes
- [ ] Environment variables are documented
- [ ] API endpoints have request/response examples
- [ ] Breaking changes are clearly marked
- [ ] Dependencies are documented with versions
- [ ] Setup instructions are tested and accurate
