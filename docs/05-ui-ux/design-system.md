# LogiFlows Design System & UI Specification

## 1. Brand Identity
- **Product Name**: LogiFlows
- **Brand Character**: Trustworthy, high-availability, precision logistics operating system.
- **Visual Aesthetic**: Sleek enterprise dark mode with glassmorphic cards, crisp borders, and subtle glow highlights.

---

## 2. Color Palette & Tokens
| Category | Token | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Background Primary** | `--bg-primary` | `#070d19` | Deepest foundation background |
| **Background Secondary** | `--bg-secondary` | `#0c172a` | Header, sidebar, and container background |
| **Card / Surface** | `--bg-card` | `#111f38` | Interactive glassmorphism panels |
| **Border Subtle** | `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Default card and divider borders |
| **Border Accent** | `--border-accent` | `rgba(37, 99, 235, 0.3)` | Hover and focus highlight borders |
| **Brand Primary (Blue)**| `--brand-blue` | `#2563eb` | Primary buttons, active tabs, main accents |
| **Brand Hover** | `--brand-blue-hover` | `#1d4ed8` | Interactive button hover state |
| **Brand Accent (Teal)** | `--brand-teal` | `#0d9488` | Planned badges, telemetry indicators |
| **Text Primary** | `--text-primary` | `#f8fafc` | Headings, high-contrast readable text |
| **Text Secondary** | `--text-secondary` | `#94a3b8` | Body copy, table headers, descriptions |
| **Text Muted** | `--text-muted` | `#64748b` | Timestamps, helper hints, breadcrumbs |
| **Status Success** | `--status-success` | `#10b981` | Healthy indicators, active probes |
| **Status Warning** | `--status-warning` | `#f59e0b` | Degraded service alerts, pending handoffs |
| **Status Error** | `--status-error` | `#ef4444` | Unreachable dependencies, exceptions |

---

## 3. Typography
- **Primary Typeface**: `Inter`, system-ui, sans-serif.
- **Monospace Typeface**: JetBrains Mono, SF Mono, Menlo, monospace (for endpoints, UUIDs, code snippets).
- **Hierarchy**:
  - `h1`: 36px–60px (2.25rem–3.75rem), Font weight 800 (Extrabold).
  - `h2`: 24px–30px (1.5rem–1.875rem), Font weight 700 (Bold).
  - `h3`: 16px–20px (1rem–1.25rem), Font weight 600 (Semibold).
  - `body`: 14px (0.875rem), Font weight 400 (Regular).
  - `caption / badges`: 11px–12px (0.6875rem–0.75rem), Font weight 500 (Medium).

---

## 4. Reusable UI Components
- **Button**: `primary`, `secondary`, `outline`, `ghost`, `teal` with sizes `sm`, `md`, `lg` and loading spinner.
- **Badge**: `success`, `warning`, `error`, `info`, `neutral`, `teal` with status pulse dots.
- **Card**: Modular `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
- **Input**: Accessible form inputs with left icon slots, labels, helper hints, and error alerts.
- **Breadcrumbs**: Hierarchical trail with Home icon and clickable route steps.
- **Logo**: SVG mark featuring cubic parcel geometry with cyan/teal gradient.
