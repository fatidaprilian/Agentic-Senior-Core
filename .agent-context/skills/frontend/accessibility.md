# Accessibility (WCAG Compliance)

**Tier:** ADVANCE | **Source:** awesome-copilot (WCAG) + minimax (motion and dark mode) + antigravity (UX patterns)

## Rule: Accessibility Is Part of Core Quality

- Web Content Accessibility Guidelines (WCAG) 2.1 AA is the minimum baseline.
- Accessible implementations reduce rework and production risk.
- Accessibility defects should be treated as quality defects, not cosmetic issues.

---

## Part 1: Semantic HTML

Bad (non-semantic structure):
```javascript
<div onClick={handleOpen} className="menu-trigger">Menu</div>
<div className="menu">
	<div onClick={() => navigate('/')}>Home</div>
	<div onClick={() => navigate('/about')}>About</div>
</div>
```

Good (semantic structure):
```javascript
<nav>
	<button aria-expanded={isOpen} aria-controls="menu">Menu</button>
	<ul id="menu" hidden={!isOpen}>
		<li><a href="/">Home</a></li>
		<li><a href="/about">About</a></li>
	</ul>
</nav>
```

---

## Part 2: Keyboard Navigation

All interactive controls must be reachable and operable from keyboard.

```javascript
// Native button is keyboard accessible by default.
<button onClick={handleDelete}>Delete</button>

// If non-semantic element is required, add role and keyboard handling.
<div
	onClick={handleDelete}
	onKeyDown={e => e.key === 'Enter' && handleDelete()}
	tabIndex={0}
	role="button"
>
	Delete
</div>
```

---

## Part 3: Contrast and Readability

- Normal text contrast ratio: at least 4.5:1
- Large text contrast ratio: at least 3:1
- Avoid low-contrast gray-on-white variants for body content

```javascript
<p style={{ color: '#333333', backgroundColor: '#ffffff' }}>
	High-contrast text for readable content.
</p>
```

---

## Part 4: ARIA Labels

```javascript
<button onClick={handleClose} aria-label="Close menu">
	X
</button>
```

Use explicit labels for icon-only controls so screen readers announce intent.

---

## Part 5: Reduced Motion Support

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const variants = {
	visible: {
		opacity: 1,
		transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }
	}
};
```

---

## Checklist

- [ ] Semantic HTML for navigation, controls, and form structures
- [ ] Full keyboard support for interactive elements
- [ ] Color contrast meets WCAG AA thresholds
- [ ] Icon-only controls include aria-label
- [ ] Visible focus indicators are preserved
- [ ] Reduced-motion user preference is respected