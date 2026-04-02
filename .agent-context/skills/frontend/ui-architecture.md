# Component Architecture & State Management

**Tier:** EXPERT | **Source:** awesome-copilot (smart/dumb) + minimax (design systems) + antigravity (React patterns)

## Part 1: Smart/Dumb Component Separation

### The Model

```
┌─────────────────────────────────────────────┐
│  SMART Component: Logic, State, Side Effects │
│  - Manages useState, useContext              │
│  - Calls APIs, handles business logic        │
│  - Passes clean props DOWN                   │
└────────────────┬────────────────────────────┘
                 │ props + callbacks
                 ↓
┌─────────────────────────────────────────────┐
│  DUMB Component: Pure Presentation           │
│  - Receives all data via props               │
│  - No side effects, no API calls             │
│  - Renders UI, calls props.on*() handlers    │
└─────────────────────────────────────────────┘
```

### Example: Payment Form

 **CORRECT (Smart + Dumb):**

**Smart Container:**
```javascript
function PaymentFormContainer() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const handleSubmit = async (value) => {
    setStatus('loading');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: value })
      });
      if (!res.ok) throw new Error('Payment failed');
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <PaymentFormUI
      onSubmit={handleSubmit}
      isLoading={status === 'loading'}
      error={error}
    />
  );
}
```

**Dumb UI Component (Testable):**
```javascript
function PaymentFormUI({ onSubmit, isLoading, error }) {
  const [amount, setAmount] = useState('');

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(amount); }}>
      <input
        value={amount}
        onChange={e => setAmount(e.target.value)}
        disabled={isLoading}
      />
      <button disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Pay'}
      </button>
      {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}
    </form>
  );
}
```

**Benefits:**
- Dumb component testable without API mocking
- Reuse PaymentFormUI with different handlers
- Clear responsibility separation

---

## Part 2: State Management Trade-Offs

### When to Use What

| Use Case | Solution | Why |
|----------|----------|-----|
| Form input | `useState()` | Scoped to component, simplest |
| Global UI state (theme) | `Zustand` | Centralized, performant |
| Server data (API responses) | `TanStack Query` | Caching, invalidation, sync |
| Complex workflows | `Redux` or `Zustand` | Structured, debuggable |

###  Anti-Pattern: Context for Everything

```javascript
// WRONG: Using context for list data
const DataContext = createContext();
function App() {
  const [items, setItems] = useState([]);  // <- Entire app re-renders on list update
  return <DataContext.Provider value={{ items }}><App /></DataContext.Provider>;
}
```

###  CORRECT: TanStack Query for Server State

```javascript
import { useQuery } from '@tanstack/react-query';

function ItemList() {
  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await fetch('/api/items');
      return res.json();
    },
  });

  return (
    <ul>
      {items?.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```

**Benefits:**  Automatic caching, background sync, stale data handling

---

## Part 3: Component Contracts (Props Interface)

```javascript
interface ButtonProps {
  // Design tokens (not hardcoded colors/sizes)
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;

  // Content
  children: React.ReactNode;

  // Behavior
  onClick: () => void;
  loading?: boolean;
}

function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
  loading = false
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
```

**Rule:** Props describe WHAT to render, not HOW.

---

## Part 4: Anti-Patterns to Avoid

### Prop Drilling (Passing Through Many Levels)

 WRONG  ​​​​​​​​​​​​​​​​​​​​​​:
```javascript
function App() {
  const [theme, setTheme] = useState('light');
  return <Layout theme={theme} setTheme={setTheme} />;  // Level 1->2
}
function Layout({ theme, setTheme }) {
  return <Header theme={theme} setTheme={setTheme} />;  // Level 2->3
}
function Header({ theme, setTheme }) {
  return <ThemeToggle theme={theme} setTheme={setTheme} />;  // Level 3->4
}
```

 CORRECT: Use Zustand
```javascript
const useTheme = create(set => ({
  theme: 'light',
  setTheme: (t) => set({ theme: t })
}));

function ThemeToggle() {
  const { theme, setTheme } = useTheme();  // Direct access, no drilling
  return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle</button>;
}
```

---

## Checklist

- [ ] Components split into Smart (logic) + Dumb (UI)
- [ ] No prop drilling beyond 2 levels
- [ ] Server state handled by TanStack Query
- [ ] Context only for global UI state (theme, user)
- [ ] Design tokens used (no hardcoded colors/sizes)
- [ ] Component props clearly documented
- [ ] Dumb components testable without mocks
- Avoid prop drilling when composition is cleaner.