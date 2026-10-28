# LogiFlows Design System — Phase 00 Foundation

## 1. Design Principles
- **Clarity under Pressure**: High-contrast, dark-mode-first aesthetic optimized for dispatcher control rooms and fleet tracking desks.
- **Micro-Animations & Depth**: Subtle glassmorphism (`backdrop-filter: blur(12px)`) with elevation glows and tactile transitions.
- **Honest Operational Status**: Clear visual segregation between live database telemetry probes and architectural baseline indicators. Dummy records disguised as live operations are strictly prohibited.

## 2. Color Tokens
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-primary` | `#090d16` | Main background |
| `--bg-secondary`| `#0f172a` | Sidebar and panels |
| `--bg-card` | `rgba(15, 23, 42, 0.75)` | Glassmorphic card surfaces |
| `--brand-primary`| `#3b82f6` | Brand blue accent |
| `--brand-gradient`| `linear-gradient(135deg, #3b82f6, #6366f1)` | Hero badges & CTAs |
| `--status-success`| `#10b981` | Delivered, healthy probes |
| `--status-warning`| `#f59e0b` | Out for delivery, degraded state |
| `--status-error` | `#ef4444` | Exceptions, service errors |
| `--status-info` | `#06b6d4` | In transit, telematics |

## 3. Typography
- **Primary Body & Headings**: `Inter` (weights: 400, 500, 600, 700)
- **Monospace & Telemetry**: `JetBrains Mono` (weights: 400, 500) for tracking numbers, latency numbers, and code blocks.

## 4. Shipment State Indicators
Each state features a dedicated color badge:
- `DRAFT`: Muted slate (`#94a3b8`)
- `BOOKED`: Electric blue (`#60a5fa`)
- `DISPATCHED`: Purple (`#a78bfa`)
- `IN_TRANSIT`: Cyan (`#22d3ee`)
- `OUT_FOR_DELIVERY`: Amber (`#fbbf24`)
- `DELIVERED`: Emerald (`#34d399`)
- `EXCEPTION`: Rose / Crimson (`#f87171`)
- `CANCELLED`: Neutral grey (`#64748b`)
