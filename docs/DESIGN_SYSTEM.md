# Buy Ghana Lands - Design System

## Brand Colors

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Primary Green** | `#1a3a2f` | Headers, buttons, text |
| **Primary Green Light** | `#2d5a47` | Hover states |
| **Accent Lime** | `#c5e063` | Highlights, badges, avatars |

### Secondary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Emerald** | `#10b981` | Success states, CTAs |
| **Emerald Light** | `#d1fae5` | Success backgrounds |
| **Amber** | `#f59e0b` | Warnings, pending states |
| **Amber Light** | `#fef3c7` | Warning backgrounds |
| **Red** | `#ef4444` | Errors, destructive actions |
| **Red Light** | `#fee2e2` | Error backgrounds |
| **Blue** | `#3b82f6` | Info, links |
| **Blue Light** | `#dbeafe` | Info backgrounds |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Gray 900** | `#111827` | Primary text |
| **Gray 600** | `#4b5563` | Secondary text |
| **Gray 400** | `#9ca3af` | Muted text, placeholders |
| **Gray 200** | `#e5e7eb` | Borders |
| **Gray 100** | `#f3f4f6` | Backgrounds |
| **Gray 50** | `#f9fafb` | Page backgrounds |
| **White** | `#ffffff` | Cards, modals |

---

## Typography

### Font Family
- **Primary**: `Inter` (sans-serif)
- **Monospace**: `font-mono` for IDs, codes

### Font Sizes (Tailwind)
| Class | Size | Usage |
|-------|------|-------|
| `text-2xl` | 24px | Page titles |
| `text-xl` | 20px | Section headers |
| `text-lg` | 18px | Card titles |
| `text-base` | 16px | Body text |
| `text-sm` | 14px | Secondary text |
| `text-xs` | 12px | Labels, captions |
| `text-[10px]` | 10px | Badges, tiny labels |

### Font Weights
| Class | Weight | Usage |
|-------|--------|-------|
| `font-bold` | 700 | Headings, emphasis |
| `font-semibold` | 600 | Subheadings, buttons |
| `font-medium` | 500 | Labels, navigation |
| `font-normal` | 400 | Body text |

---

## Spacing System

Use Tailwind's spacing scale consistently:

| Scale | Pixels | Usage |
|-------|--------|-------|
| `1` | 4px | Tight spacing |
| `1.5` | 6px | Icon gaps |
| `2` | 8px | Small gaps |
| `3` | 12px | Component padding |
| `4` | 16px | Standard padding |
| `5` | 20px | Section padding |
| `6` | 24px | Card padding |
| `8` | 32px | Large gaps |

---

## Border Radius

| Class | Radius | Usage |
|-------|--------|-------|
| `rounded` | 4px | Small elements |
| `rounded-lg` | 8px | Buttons, inputs |
| `rounded-xl` | 12px | Cards |
| `rounded-2xl` | 16px | Modals, large cards |
| `rounded-full` | 9999px | Avatars, pills |

---

## Shadows

| Class | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation |
| `shadow` | Cards |
| `shadow-md` | Dropdowns |
| `shadow-lg` | Modals |
| `shadow-xl` | Popovers |

---

## Component Standards

### Buttons

```tsx
// Primary Button
<button className="px-4 py-2 bg-[#1a3a2f] text-white rounded-lg text-sm font-medium hover:bg-[#2d5a47] transition-colors">
  Primary Action
</button>

// Secondary Button
<button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
  Secondary Action
</button>

// Danger Button
<button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
  Delete
</button>

// Icon Button
<button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
  <Icon className="h-3.5 w-3.5" />
</button>
```

### Cards

```tsx
// Standard Card
<div className="bg-white rounded-xl border border-gray-100 p-4">
  {/* Content */}
</div>

// Elevated Card
<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
  {/* Content */}
</div>
```

### Inputs

```tsx
// Text Input
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
/>

// Search Input
<div className="relative">
  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
  />
</div>
```

### Badges

```tsx
// Status Badges
<span className="px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">
  Active
</span>
<span className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
  Pending
</span>
<span className="px-2 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
  Suspended
</span>
<span className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
  Inactive
</span>
```

### Tables

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-100 bg-gray-50/50">
      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4 text-sm">Content</td>
    </tr>
  </tbody>
</table>
```

### Modals

```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <h2 className="font-semibold text-[#1a3a2f]">Modal Title</h2>
      <button className="text-gray-400 hover:text-gray-600">
        <X className="h-5 w-5" />
      </button>
    </div>
    {/* Content */}
    <div className="p-4">
      {/* Form or content */}
    </div>
  </div>
</div>
```

---

## Admin Dashboard Standards

### Page Header
```tsx
<div className="flex items-center justify-between mb-5">
  <div>
    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
      <Link href="/admin" className="hover:text-[#1a3a2f]">Dashboard</Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-[#1a3a2f]">Page Name</span>
    </div>
    <h1 className="text-lg font-semibold text-[#1a3a2f]">Page Title</h1>
    <p className="text-xs text-gray-400 mt-0.5">Page description</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Action buttons */}
  </div>
</div>
```

### Filter Bar
```tsx
<div className="bg-white rounded-xl border border-gray-100 p-3 mb-4">
  <div className="flex flex-wrap gap-3 items-center justify-between">
    <div className="flex gap-1.5">
      {filters.map((f) => (
        <button
          key={f}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            active === f
              ? "bg-[#1a3a2f] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
    {/* Search input */}
  </div>
</div>
```

### Bulk Actions Bar
```tsx
{selectedItems.size > 0 && (
  <div className="bg-[#1a3a2f] text-white rounded-xl p-3 mb-4 flex items-center justify-between">
    <span className="text-sm font-medium">{selectedItems.size} item(s) selected</span>
    <div className="flex items-center gap-2">
      {/* Action buttons */}
    </div>
  </div>
)}
```

---

## Icon Usage

Use **Lucide React** icons consistently:

```tsx
import {
  // Navigation
  ChevronRight, ArrowLeft, ArrowRight,
  // Actions
  Plus, Edit, Trash2, Eye, Download, Search,
  // Status
  CheckCircle, XCircle, AlertTriangle, Ban, Clock,
  // Selection
  Square, CheckSquare,
  // Users
  User, Users, UserPlus,
  // Content
  MapPin, Phone, Mail, Calendar,
  // Loading
  Loader2,
} from "lucide-react";
```

### Icon Sizes
| Size | Class | Usage |
|------|-------|-------|
| XS | `h-2.5 w-2.5` | Inline with tiny text |
| SM | `h-3 w-3` | Breadcrumbs |
| MD | `h-3.5 w-3.5` | Action buttons |
| LG | `h-4 w-4` | Standard icons |
| XL | `h-5 w-5` | Modal headers |
| 2XL | `h-6 w-6` | Empty states |

---

## Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

---

## Animation Standards

### Transitions
```tsx
// Standard transition
className="transition-colors"

// All properties
className="transition-all"

// Duration
className="transition-colors duration-200"
```

### Loading States
```tsx
// Spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Skeleton
<div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
```

---

## Accessibility

1. **Focus states**: Always include `focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]`
2. **Button titles**: Add `title` attribute for icon-only buttons
3. **Form labels**: Always associate labels with inputs
4. **Color contrast**: Ensure text meets WCAG AA standards
5. **Keyboard navigation**: Ensure all interactive elements are focusable
