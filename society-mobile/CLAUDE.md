# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Society is a React Native mobile application built with Expo SDK 53, based on the [Obytes Starter](https://starter.obytes.com) template. It's a social feed/community app with authentication, posts, and user management.

**Critical**: This project uses **pnpm** as the package manager (enforced via preinstall hook). All commands and package installations must use pnpm.

## Commands

### Development

```bash
# Install dependencies (use pnpm only)
pnpm install

# Run development server
pnpm start              # Development environment (default)
pnpm start:staging      # Staging environment
pnpm start:production   # Production environment

# Run on platforms
pnpm ios               # iOS simulator (development)
pnpm android           # Android emulator (development)
pnpm ios:staging       # iOS with staging env
pnpm android:staging   # Android with staging env

# Generate native projects
pnpm prebuild          # Creates ios/ and android/ folders
pnpm xcode            # Open Xcode project
```

### Building

```bash
# EAS Cloud Builds
pnpm build:development:ios      # Dev build for TestFlight
pnpm build:development:android  # Dev build APK
pnpm build:staging:ios          # Staging build
pnpm build:staging:android      # Staging APK
pnpm build:production:ios       # Production App Store build
pnpm build:production:android   # Production Play Store build
```

### Testing and Quality

```bash
# Testing
pnpm test              # Run Jest tests
pnpm test:watch        # Watch mode
pnpm test:ci           # With coverage (for CI)

# Code Quality
pnpm lint              # ESLint
pnpm type-check        # TypeScript validation
pnpm lint:translations # Validate i18n JSON files
pnpm check-all         # Run all checks (used in CI)

# E2E Testing
pnpm install-maestro   # Install Maestro CLI (first time only)
pnpm e2e-test          # Run Maestro E2E tests
```

### Versioning

```bash
pnpm app-release       # Bump version, prebuild, commit (uses 'np' package)
```

## Architecture

### Environment & Configuration

**Three-Environment System**: development, staging, production

- Environment files: `.env.development`, `.env.staging`, `.env.production`
- Environment is selected via `APP_ENV` environment variable
- `EXPO_NO_DOTENV=1` is set in all scripts to use custom env system (not Expo's)
- Client env variables are accessed via `@env` import alias (mapped to `expo-constants`)
- Environment switching changes bundle IDs: adds `.staging` or `.development` suffix

**Key**: The custom env system provides Zod validation and type safety. Never use Expo's built-in `.env` loading.

### Navigation (Expo Router v5)

File-based routing with app structure:
```
src/app/
├── _layout.tsx              # Root layout with providers
├── (app)/                   # Protected routes (tab navigation)
│   ├── _layout.tsx          # Tab bar + route protection logic
│   ├── index.tsx            # Feed tab (default)
│   ├── style.tsx            # Style examples tab
│   └── settings.tsx         # Settings tab
├── feed/
│   ├── [id].tsx            # Dynamic route: /feed/:id
│   └── add-post.tsx        # Modal route
├── login.tsx               # Login screen
├── onboarding.tsx          # First-time user flow
└── [...messing].tsx        # 404 catch-all
```

**Route Protection Pattern**:
- Protection logic lives in `(app)/_layout.tsx` (not middleware)
- Checks auth status and redirects: first-time → onboarding, signed-out → login
- Uses `useAuth.use.status()` from Zustand store

**Key Convention**: Routes in `(app)` folder are protected. Routes outside are public.

### State Management

**Zustand with Custom Selector Pattern**:

```typescript
// Store definition uses createSelectors wrapper
const useAuth = createSelectors(_useAuth);

// Usage: Access specific state slices
const status = useAuth.use.status();      // Subscribe to status only
const signIn = useAuth.use.signIn();      // Get action (no subscription)
```

**Auth Store** (`src/lib/auth/`):
- State: `token: {access: string, refresh: string}`, `status: 'idle' | 'signIn' | 'signOut'`
- Persisted to MMKV storage via `getToken()/setToken()`
- Hydrated at module level (before React renders) in `_layout.tsx` via `hydrateAuth()`

**Important**: The app uses Zalo SDK for authentication via custom `useAuth` hook at `src/lib/hooks/use-auth.ts`. The authentication flow exchanges Zalo tokens with the backend for Society JWT tokens.

### Data Fetching (React Query + react-query-kit)

**Pattern**: Use `react-query-kit` factory functions for type-safe queries/mutations:

```typescript
// Query
export const usePosts = createQuery<Response, Variables, AxiosError>({
  queryKey: ['posts'],
  fetcher: (variables) => client.get('posts').then(res => res.data.posts),
});

// Mutation
export const useAddPost = createMutation<Response, Variables, AxiosError>({
  mutationFn: async (variables) =>
    client({ url: 'posts/add', method: 'POST', data: variables })
      .then(res => res.data),
});

// Usage
const { data, isLoading } = usePosts();
const { mutate } = useAddPost();
```

**Benefits of react-query-kit**:
- Auto-generated `getKey()` methods for cache invalidation
- Type inference for variables and responses
- Consistent patterns across features

**API Client**: Axios instance at `src/api/common/client.tsx` with `baseURL` from env.

**Error Handling**: Use `showError(axiosError)` from `@/components/ui` - it extracts nested error messages automatically.

### UI Components

**Multi-Library Approach**:
1. **NativeWind (Tailwind CSS)**: Primary styling system
2. **tailwind-variants**: For component variants with slots
3. **Tamagui**: Installed but not actively used

**Component Pattern with Variants**:

```typescript
import { tv } from 'tailwind-variants';

const button = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-md',
    label: 'font-inter text-base font-semibold',
  },
  variants: {
    variant: {
      default: { container: 'bg-black', label: 'text-white' },
      outline: { container: 'border border-neutral-400', label: 'text-black' },
    },
    size: {
      default: { container: 'h-10 px-4' },
      lg: { container: 'h-12 px-8' },
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});
```

**Form Components Pattern**:
- Base component: `Input` (standalone)
- Controlled wrapper: `ControlledInput<T>` (generic, react-hook-form integrated)
- Applies to: Input, Select, Checkbox

**Testing**: All interactive components have `testID` props with consistent suffixes:
```typescript
testID="login-button"
testID={`${testID}-label`}     // Compositional pattern
testID={`${testID}-error`}      // Error message
```

### Forms (Zod + React Hook Form)

**Standard Pattern**:

```typescript
// 1. Schema with validation messages
const schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// 2. Infer type
type FormType = z.infer<typeof schema>;

// 3. Create form
const { control, handleSubmit } = useForm<FormType>({
  resolver: zodResolver(schema),
});

// 4. Use controlled inputs (type-safe)
<ControlledInput<FormType>
  name="email"           // Type-checked against FormType
  control={control}
  label="Email"
/>
```

**Key**: `ControlledInput<T>` is generic - the `name` prop is type-safe (`Path<T>`) and errors display automatically.

### Internationalization (i18next)

**Usage**:
```typescript
import { translate, type TxKeyPath } from '@/lib/i18n';

const text = translate('login.title');  // Type-safe key paths
```

**Language Switching**:
```typescript
const { language, setLanguage } = useSelectedLanguage();
setLanguage('ar');  // Triggers app restart for RTL
```

**Important**: Language changes cause app restarts (`RNRestart.restart()`) because RTL requires native layout updates.

**Custom ESLint Rule**: `./scripts/i18next-syntax-validation.js` ensures translation keys match across all language files in `src/translations/`.

### Theme System

**Three Layers**:

1. **Color Palette** (`src/components/ui/colors.js`):
   - CommonJS module with comprehensive scales (50-900)
   - Palettes: charcoal, neutral, primary, success, warning, danger, **brand** (champagne gold), **midnight** (black)

2. **React Navigation Theme** (`src/lib/use-theme-config.tsx`):
   - Maps color palette to React Navigation format
   - Switches based on NativeWind's `colorScheme`

3. **User Preference** (`src/lib/hooks/use-selected-theme.tsx`):
   - Type: `'light' | 'dark' | 'system'`
   - Persisted to MMKV
   - Loaded at startup via `loadSelectedTheme()`

**Key Pattern**: Two separate states:
- `colorScheme` (NativeWind) - actual rendered theme
- `selectedTheme` (MMKV) - user's choice

**Usage**:
```typescript
// Tailwind classes
className="bg-brand-400 dark:bg-midnight"

// Hook
const { selectedTheme, setSelectedTheme } = useSelectedTheme();
```

## Code Conventions

### File Organization

```
src/
├── api/                    # Feature-based API modules
│   ├── common/             # Axios client, providers, utilities
│   └── posts/              # Each resource gets own folder
│       ├── index.ts        # Public exports
│       ├── types.ts        # TypeScript types
│       ├── use-posts.ts    # Query hook
│       └── use-add-post.ts # Mutation hook
├── app/                    # Expo Router screens (file-based)
├── components/
│   ├── ui/                 # Base UI primitives
│   │   ├── index.tsx       # Barrel export
│   │   └── button.tsx/button.test.tsx  # Co-located tests
│   └── [feature]/          # Feature-specific components
├── lib/                    # Utilities, hooks, auth, i18n
└── translations/           # i18n JSON files
```

**Patterns**:
- Each module has `index.ts` barrel export
- Tests co-located with implementation
- Feature-based organization (not by type)

### Naming Conventions

**Files**: `kebab-case` (enforced by ESLint `unicorn/filename-case`)
```
button.tsx          ✓
login-form.tsx      ✓
LoginForm.tsx       ✗
```

**Components**: `PascalCase`
```typescript
export const Button = ...
export function LoginForm() ...
```

**Test IDs**: `kebab-case`
```typescript
testID="login-button"
testID="email-input"
```

### Import Patterns

**Alias Usage** (configured in `tsconfig.json` + `babel.config.js`):
```typescript
import { Button } from '@/components/ui';  // ✓ Use @/ for src/
import { Env } from '@env';                // ✓ For expo-constants
import { ... } from '../../../ui';         // ✗ Avoid relative imports across folders
```

**Import Order** (auto-sorted by `simple-import-sort`):
1. React imports
2. Third-party imports
3. `@/` imports
4. Relative imports
5. Type imports

**Type Imports** (enforced by ESLint):
```typescript
import type { Post } from '@/api';           // Type-only import
import { usePosts, type Post } from '@/api'; // Inline type import (preferred)
```

### TypeScript Conventions

- Use `type` over `interface`
- Use `const` objects with `as const` instead of enums
- Explicit return types for all functions
- Avoid `try/catch` unless necessary for error translation
- Use discriminated unions for complex state

### Component Structure

**Standard Pattern**:
```typescript
import * as React from 'react';
import { Text, View } from '@/components/ui';

// Props at top
type Props = {
  title: string;
  onPress: () => void;
};

// Favor named exports
export function Card({ title, onPress }: Props) {
  // Component logic
  return (
    <View className="rounded-lg bg-white p-4">
      <Text className="text-xl font-bold">{title}</Text>
    </View>
  );
}
```

**Rules**:
- Functional components only (no classes)
- Props defined at top
- Named exports (not default)
- Max 80 lines per component
- Use `useMemo`/`useCallback` appropriately to prevent re-renders

### Package Installation

**Critical**: Use `npx expo install <package>` (not `pnpm add`) for React Native packages. Expo CLI ensures version compatibility with the SDK.

```bash
npx expo install react-native-maps        # ✓ Correct
pnpm add react-native-maps                # ✗ May install incompatible version
```

For non-RN packages, `pnpm add` is fine.

## Git Workflow

### Commit Messages (Conventional Commits)

Format: `<type>: <description>`

Types:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `docs:` - Documentation
- `style:` - Formatting changes
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

Rules:
- Lowercase messages
- Max 100 characters
- Reference issue numbers when applicable

### Pre-commit Hooks (Husky)

Automatically runs:
1. Branch protection (blocks main/master commits, skippable via `SKIP_BRANCH_PROTECTION=1`)
2. `pnpm type-check`
3. Lint-staged (auto-fixes ESLint errors)

**Lint-staged targets**:
- JS/TS: ESLint with auto-fix
- MD/JSON: Prettier formatting
- Translation files: i18n validation

## Testing

### Unit Tests (Jest + React Native Testing Library)

**Pattern**:
```typescript
// button.test.tsx
import { render, screen } from '@/lib/test-utils';  // Custom render with providers
import { Button } from './button';

describe('Button', () => {
  it('renders label', () => {
    render(<Button label="Click me" testID="btn" />);
    expect(screen.getByTestId('btn-label')).toHaveTextContent('Click me');
  });
});
```

**Conventions**:
- Co-locate tests: `component.test.tsx` next to `component.tsx`
- Use custom `render()` from `@/lib/test-utils` (includes providers)
- Test complex components and utilities, skip simple display-only components
- Use `testID` for queries

### E2E Tests (Maestro)

**Flow Organization**:
```
.maestro/
├── config.yaml           # Execution order
├── auth/                 # Auth flows
├── app/                  # Feature flows
└── utils/                # Reusable utility flows
```

**Composable Flows**:
```yaml
# Main flow imports utility
- runFlow: utils/login.yaml
- assertVisible: "Feed"
```

**Environment Variables**:
```yaml
- inputText: ${EMAIL}
- inputText: ${PASSWORD}
```

Run with: `pnpm e2e-test -e APP_ID=com.obytes.development`

## Special Patterns

### Storage (MMKV)

**Generic Storage**:
```typescript
import { getItem, setItem, removeItem } from '@/lib/storage';

// Auto JSON serialize/deserialize
const user = getItem<User>('user');
setItem('user', userData);
```

**Primitive Hooks**:
```typescript
import { useMMKVString, useMMKVBoolean } from 'react-native-mmkv';
const [theme, setTheme] = useMMKVString('theme', storage);
```

### Error Handling

**API Errors**:
```typescript
import { showError, showErrorMessage } from '@/components/ui';

// For Axios errors (extracts nested messages)
mutate(data, {
  onError: (error: AxiosError) => showError(error)
});

// For simple messages
showErrorMessage('Something went wrong');
```

The `extractError()` utility recursively parses nested error objects/arrays from various API response formats.

### Modal System

**Bottom Sheet Modals**:
```typescript
import { useModal } from '@/components/ui';

const modal = useModal();

// Render
<Modal ref={modal.ref} snapPoints={['60%']}>
  <ModalContent />
</Modal>

// Control
modal.present();
modal.dismiss();
```

## Documentation Resources

- [Obytes Starter Docs](https://starter.obytes.com) - Comprehensive documentation for the template this project is based on
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based navigation
- [NativeWind](https://www.nativewind.dev/) - Tailwind CSS for React Native
- [React Query](https://tanstack.com/query/latest) - Data fetching
- [react-query-kit](https://github.com/liaoliao666/react-query-kit) - React Query factory pattern

## Common Pitfalls

1. **Don't use `npm` or `yarn`** - This project enforces pnpm (preinstall hook will error)
2. **Don't bypass custom env system** - Never remove `EXPO_NO_DOTENV=1` or use Expo's `.env` loading
3. **Don't import from `expo-constants` directly** - Use `@env` alias which re-exports properly
4. **Use Zalo for auth** - Authentication is handled via custom `useAuth` hook using Zalo SDK + backend JWT tokens
5. **Don't skip type imports** - ESLint enforces `import type` syntax
6. **Don't use relative imports across features** - Use `@/` alias for all cross-folder imports
7. **Don't install RN packages with pnpm** - Use `npx expo install` for compatibility
8. **Don't create classes** - Use functional components and hooks only
9. **Don't use enums** - Use `const` objects with `as const` instead
10. **Don't commit directly to main** - Pre-commit hook blocks (unless `SKIP_BRANCH_PROTECTION=1`)
11. **Don't use StyleSheet.create()** - Always use Tailwind CSS (NativeWind) classes via `className` prop for all styling

## Code Generation Guidelines

When generating new code:

1. **Components**: Use functional components with `type Props` at top, named exports, NativeWind classes
2. **Forms**: Always use Zod + react-hook-form + `ControlledInput<T>` generic pattern
3. **API Calls**: Use `react-query-kit`'s `createQuery/createMutation` factory pattern
4. **State**: Use Zustand with `createSelectors` wrapper for granular subscriptions
5. **Files**: kebab-case naming, max 80 lines per component, co-locate tests
6. **Imports**: Use `@/` alias, inline type imports, follow auto-sort order
7. **Testing**: Add `testID` props, write tests for complex logic, use custom render
8. **i18n**: Use `translate()` with type-safe `TxKeyPath` for all user-facing text
9. **Styling**: **Always use Tailwind CSS (NativeWind) classes** - never use StyleSheet.create(). Use `className` props for all styling. Use defined colors/fonts from Tailwind config, support dark mode
10. **Errors**: Use `showError()` for API errors, provide user-friendly messages

When in doubt, refer to existing patterns in `src/components/ui/button.tsx` (component structure), `src/api/posts/` (API pattern), and `src/app/(app)/_layout.tsx` (navigation/auth pattern).
