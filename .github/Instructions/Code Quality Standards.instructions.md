---
applyTo: '**'
---

# Code Quality Standards

## Purpose
Establish consistent coding practices and quality standards to ensure maintainable, readable, and reliable code across the project.

---

## TypeScript Standards

### Type Safety

**Explicit Typing**
```typescript
// ✅ Good - Explicit return types for functions
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ✅ Good - Interface for component props
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
}

// ❌ Avoid - Using 'any'
function processData(data: any) { ... }

// ✅ Good - Use 'unknown' if type is truly unknown
function processData(data: unknown) {
  if (isValidData(data)) {
    // Now TypeScript knows the type
  }
}
```

**Type Inference**
```typescript
// ✅ Let TypeScript infer when obvious
const count = 0;                    // inferred as number
const users = [];                   // ❌ inferred as never[]
const users: User[] = [];           // ✅ explicit for empty arrays

// ✅ Explicit for function parameters and returns
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Utility Types**
```typescript
// Use built-in utility types
type PartialUser = Partial<User>;           // All props optional
type RequiredUser = Required<User>;         // All props required
type UserName = Pick<User, 'firstName' | 'lastName'>;
type UserWithoutId = Omit<User, 'id'>;
type ReadonlyUser = Readonly<User>;
```

### Null Handling

```typescript
// ✅ Use optional chaining
const userName = user?.profile?.name;

// ✅ Use nullish coalescing
const displayName = user.name ?? 'Anonymous';

// ✅ Type guards for narrowing
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

---

## React & Next.js Standards

### Component Structure

**Functional Components**
```typescript
// ✅ Standard component structure
interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
  className?: string;
}

export default function UserCard({ 
  user, 
  onSelect, 
  className 
}: UserCardProps) {
  // 1. Hooks at the top
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 2. Derived state / computations
  const fullName = `${user.firstName} ${user.lastName}`;
  
  // 3. Event handlers
  const handleClick = () => {
    onSelect?.(user);
  };
  
  // 4. Early returns for edge cases
  if (!user) return null;
  
  // 5. Main render
  return (
    <div className={className} onClick={handleClick}>
      <h3>{fullName}</h3>
    </div>
  );
}
```

**Server vs Client Components**
```typescript
// Server Component (default) - No directive needed
export default async function UserList() {
  const users = await fetchUsers(); // Direct data fetching
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// Client Component - Must have 'use client' directive
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Hooks Best Practices

**useState**
```typescript
// ✅ Type the state when not obvious
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// ✅ Use functional updates for derived state
setCount(prevCount => prevCount + 1);
```

**useEffect**
```typescript
// ✅ Always include dependencies
useEffect(() => {
  const controller = new AbortController();
  
  async function loadData() {
    const data = await fetchData({ signal: controller.signal });
    setData(data);
  }
  
  loadData();
  
  // ✅ Cleanup function
  return () => controller.abort();
}, [userId]); // ✅ Complete dependency array
```

**Custom Hooks**
```typescript
// ✅ Prefix with 'use', return meaningful values
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // fetch logic
  }, [userId]);

  return { user, loading, error };
}
```

### Performance Optimization

```typescript
// ✅ Memoize expensive calculations
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// ✅ Memoize callbacks passed to children
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data);
}, [submitForm]);

// ✅ Use React.memo for expensive pure components
const ExpensiveList = memo(function ExpensiveList({ items }: Props) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});
```

---

## Code Style Guidelines

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `UserProfile`, `DashboardCard` |
| Functions | camelCase | `getUserById`, `formatDate` |
| Variables | camelCase | `userName`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `User`, `ApiResponse` |
| Enums | PascalCase | `UserRole`, `PaymentStatus` |
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| CSS classes | kebab-case | `user-profile`, `nav-item` |

### Boolean Naming

```typescript
// ✅ Use is/has/can/should prefixes
const isLoading = true;
const hasPermission = user.role === 'admin';
const canEdit = hasPermission && !isLocked;
const shouldRefresh = lastUpdate < Date.now() - 60000;

// ❌ Avoid
const loading = true;
const permission = true;
```

### Function Naming

```typescript
// ✅ Verb + Noun pattern for actions
function fetchUser() { }
function createOrder() { }
function updateProfile() { }
function deleteItem() { }
function validateEmail() { }

// ✅ Handle + Event pattern for handlers
function handleClick() { }
function handleSubmit() { }
function handleInputChange() { }

// ✅ Descriptive names for transformations
function formatCurrency(amount: number): string { }
function parseUserData(json: unknown): User { }
function sortByDate<T>(items: T[]): T[] { }
```

---

## Error Handling

### Try-Catch Pattern

```typescript
// ✅ Structured error handling
async function fetchData<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: response.statusText,
        },
      };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Fetch failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

### Error Boundaries

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

---

## Code Organization

### Import Order

```typescript
// 1. React and Next.js imports
import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 2. Third-party libraries
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. Internal absolute imports
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

// 4. Types (use 'import type' when possible)
import type { User, ApiResponse } from '@/types';

// 5. Relative imports
import { LocalComponent } from './LocalComponent';
import styles from './styles.module.css';
```

### File Structure

```typescript
// Component file structure
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Helper functions (if small and specific to component)
// 5. Component definition
// 6. Export

// Example:
import { useState } from 'react';
import type { User } from '@/types';

interface UserCardProps {
  user: User;
}

const AVATAR_SIZE = 48;

function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

export default function UserCard({ user }: UserCardProps) {
  // Component logic
}
```

---

## Comments & Documentation

### When to Comment

```typescript
// ✅ Explain WHY, not WHAT
// Using setTimeout to debounce rapid user input
const debouncedSearch = useMemo(() => 
  debounce(searchFn, 300), 
[searchFn]);

// ✅ Document complex business logic
// Users get premium features if they:
// 1. Have an active subscription OR
// 2. Are in the trial period (first 14 days) OR
// 3. Were grandfathered from the old pricing plan
const hasPremiumAccess = 
  hasActiveSubscription || 
  isInTrialPeriod || 
  isGrandfathered;

// ❌ Avoid obvious comments
// Set the user name
setUserName(name);
```

### JSDoc for Public APIs

```typescript
/**
 * Formats a number as currency with the specified locale and currency code.
 * 
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale string (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // '$1,234.56'
 * formatCurrency(1234.56, 'EUR', 'de-DE') // '1.234,56 €'
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
```

### TODO Comments

```typescript
// TODO: Implement pagination for large datasets
// TODO(username): Refactor this after API v2 release
// FIXME: Handle edge case when user has no email
// HACK: Temporary workaround for Safari bug, remove after v15.4
```

---

## Testing Standards

### Test Structure

```typescript
describe('UserService', () => {
  // Group related tests
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };
      
      // Act
      const result = await createUser(userData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('John');
    });

    it('should fail with invalid email', async () => {
      const userData = { name: 'John', email: 'invalid' };
      const result = await createUser(userData);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_EMAIL');
    });
  });
});
```

### Test Naming

```typescript
// ✅ Descriptive test names
it('should return null when user is not found', () => {});
it('should throw error when API rate limit is exceeded', () => {});
it('should format date in user timezone', () => {});

// ❌ Vague test names
it('works', () => {});
it('handles error', () => {});
```

---

## Git Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build, config, dependencies |

### Examples

```bash
feat(auth): add Google OAuth login

fix(dashboard): resolve chart rendering on mobile

docs(readme): update installation instructions

refactor(api): extract validation logic to separate module

chore(deps): upgrade Next.js to 14.1.0
```

---

## Code Review Checklist

Before submitting code for review:

- [ ] Code compiles without errors or warnings
- [ ] All tests pass
- [ ] No `console.log` statements (except intentional logging)
- [ ] No `any` types (use `unknown` if necessary)
- [ ] Proper error handling implemented
- [ ] Loading and error states handled in UI
- [ ] Accessibility considerations addressed
- [ ] No hardcoded values (use constants/env vars)
- [ ] Proper TypeScript types defined
- [ ] Code follows naming conventions
- [ ] Complex logic is commented
- [ ] No sensitive data exposed
