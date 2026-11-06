# Data States & Action Feedback

Any view that consumes asynchronous data or triggers mutations must handle every possible state in the component lifecycle. Never design only for the populated happy path.

---

## 1. The Four Essential UI States

Every data-driven interface exists in one of four states:

```
               ┌─────────────┐
               │ 1. LOADING  │
               └──────┬──────┘
                      │
       ┌──────────────┴──────────────┐
       ▼                             ▼
┌─────────────┐               ┌─────────────┐
│  2. EMPTY   │               │ 3. POPULATED│
└─────────────┘               └─────────────┘
       │                             ▲
       │        ┌─────────────┐      │
       └───────►│  4. ERROR   │──────┘ (Retry)
                └─────────────┘
```

---

## 2. State 1: Proportional Loading Skeletons

Avoid generic full-screen spinners that cause severe Layout Shift (CLS) when content loads. Skeletons must mimic the exact bounding box and proportions of the expected data.

```html
<!-- Table Skeleton: Matches row height and column widths -->
<div class="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading audit logs">
  <div class="h-8 bg-muted rounded w-full"></div>
  <div class="h-12 bg-muted/60 rounded w-full"></div>
  <div class="h-12 bg-muted/60 rounded w-full"></div>
  <div class="h-12 bg-muted/60 rounded w-full"></div>
</div>
```

- Match font size heights: `h-4` for body lines, `h-6` for headings, `h-10` for action buttons.
- Constrain width variance: alternate `w-3/4`, `w-1/2`, `w-5/6` on multi-line text to mirror natural paragraph shapes.

---

## 3. State 2: Concise Actionable Empty States

Empty states occur when a query returns zero records or an entity has not been initialized.

- **Banned:** Flowery essay copy ("It looks like you haven't created any projects yet! Don't worry, getting started is easy and fun...").
- **Enforced:** 1-sentence factual description followed by a primary creation trigger:

```html
<div class="py-12 px-4 text-center rounded-lg border border-dashed border-border">
  <div class="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
    <svg class="w-5 h-5" aria-hidden="true">...</svg>
  </div>
  <h3 class="text-sm font-semibold text-foreground">No webhooks configured</h3>
  <p class="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
    Endpoints will receive real-time HTTP POST notifications when events occur.
  </p>
  <div class="mt-4">
    <button type="button" class="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md">
      Create webhook endpoint
    </button>
  </div>
</div>
```

---

## 4. State 3: Error States with Inline Retry

Operational errors must be surfaced with actionable context. Never swallow errors silently or display opaque error codes without a recovery path.

```html
<div class="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-foreground flex items-start gap-3">
  <svg class="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true">...</svg>
  <div class="flex-1 text-xs space-y-1">
    <p class="font-medium text-destructive">Failed to load deployment metrics</p>
    <p class="text-muted-foreground">The telemetry service timed out after 5,000ms. Check network connection or retry.</p>
    <div class="pt-2">
      <button type="button" class="px-2.5 py-1 bg-background border border-border text-foreground rounded text-xs hover:bg-muted font-medium">
        Retry query
      </button>
    </div>
  </div>
</div>
```

---

## 5. Mutation Action Feedback: The Pending Lock

Mutations (create, update, delete, trigger) must give instantaneous feedback to prevent race conditions and double-submission.

```tsx
// React example for mutation feedback
function DeployButton({ onDeploy }: { onDeploy: () => Promise<void> }) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await onDeploy();
      toast.success("Deployment queued successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending && <Spinner className="w-4 h-4 animate-spin" />}
      <span>{isPending ? "Queuing deployment..." : "Deploy to production"}</span>
    </button>
  );
}
```

---

## 6. Localized Error Boundaries

Never allow an error in an auxiliary widget (e.g. recent activity feed, analytics graph) to crash the entire application shell or parent form.

Wrap distinct layout sections in localized error boundaries:
```tsx
<AppShell>
  <ErrorBoundary fallback={<TelemetryFallbackError />}>
    <RealtimeTelemetryChart />
  </ErrorBoundary>
  <ErrorBoundary fallback={<TableFallbackError />}>
    <DeploymentsTable />
  </ErrorBoundary>
</AppShell>
```

