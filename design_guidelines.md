# CraveGames Responsive Design Guidelines

## Design Approach
**System-Based Approach:** Material Design principles adapted for gaming platforms, drawing inspiration from Steam, Discord, and modern game launchers. Prioritize dark UI optimized for extended viewing sessions with high contrast for readability.

## Core Design Principles
1. **Mobile-First Progression:** Design for 320px minimum, scale up gracefully
2. **Touch-Optimized:** 44px minimum touch targets, generous spacing
3. **Performance-Conscious:** Minimize animations, optimize images
4. **Gaming Aesthetic:** Maintain dark theme, vibrant accents, immersive experience

## Typography System
**Font Stack:** System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)

**Hierarchy:**
- Hero/Page Titles: 32px mobile → 48px desktop, bold (clamp(2rem, 5vw, 3rem))
- Section Headers: 20px mobile → 24px desktop, bold
- Body Text: 16px mobile → 16px desktop, regular
- Metadata/Labels: 14px, medium weight
- Captions: 12px, regular

**Line Heights:** 1.5 for body, 1.2 for headings

## Layout & Spacing System
**Tailwind-Inspired Units:** Use multiples of 4px for consistency
- Common spacing: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px
- Mobile padding: 16px (p-4), 20px (p-5)
- Desktop padding: 24px (p-6), 32px (p-8), 40px (p-10)
- Section gaps: 32px mobile, 50px desktop

**Breakpoints:**
- Mobile: 320px - 767px (base styles)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Container Widths:**
- Mobile: 100% with 16px padding
- Tablet: 100% with 24px padding
- Desktop: Max 1400px centered

## Navigation Components

**Mobile Navigation (< 768px):**
- Hamburger menu button (44px × 44px) top-left
- Slide-out sidebar overlay (280px width)
- Full-height backdrop (rgba(0,0,0,0.7))
- Slide-in animation (0.3s ease)
- Close button or tap-outside to dismiss
- Logo at top, categories scrollable, user info at bottom

**Desktop Navigation (≥ 768px):**
- Fixed sidebar (240px width)
- Always visible
- Maintain existing visual treatment

**Search Bar:**
- Mobile: Full-width below hamburger, 48px height
- Tablet: Max 500px centered in header
- Desktop: 500px centered in header
- Dropdown results: Full-width mobile, max 500px desktop

## Game Display Components

**Game Cards:**
- Mobile: Single column grid, full-width cards
- Tablet: 2-column grid (grid-cols-2), gap-4
- Desktop: 3-4 column grid (grid-cols-3/4), gap-5
- Card aspect ratio: 4:3 maintained across devices
- Thumbnail optimization: Lazy load images
- Text overlay: Always readable with gradient backdrop

**Carousels:**
- Mobile: Swipe-enabled, show 1.2 cards (peek next), gap-3
- Tablet: Show 2.5 cards with arrows, gap-4
- Desktop: Show 4-5 cards with arrows, gap-5
- Touch: Enable horizontal scroll, hide scrollbar
- Arrows: 44px mobile, 45px desktop, hidden on mobile initially

**Game Player Page:**
- Mobile: Full-width iframe, 16:9 aspect ratio preserved
- Controls: 48px height bottom bar, icon buttons 44px
- Fullscreen: Native fullscreen API
- Recommendations: Below player (not flanking)
- Tablet/Desktop: Flanking columns return at 1024px+

## Form Components
**Input Fields:**
- Height: 48px mobile/desktop for touch
- Padding: 16px horizontal, 14px vertical
- Border radius: 12px
- Focus states: 2px border, subtle glow
- Labels: Above inputs, 14px, medium weight

**Buttons:**
- Primary: 48px height minimum, 16px horizontal padding
- Text: 16px, medium weight
- Hover: Subtle lift (translateY(-2px)), no background change on image overlays
- Active: Slight scale (0.98)
- Blurred background when over images (backdrop-filter: blur(8px))

## Section Layouts

**Homepage Sections:**
- Trending: Full-width, special treatment with fire icon
- Category sections: Standard carousel pattern
- Section spacing: 32px mobile, 50px desktop
- "See All" buttons: Top-right on desktop, below title on mobile

**Game Detail Page:**
- Mobile: Stacked (player → info → comments)
- Desktop: Three-column (recs | content | recs)
- Ad placement: Between content sections, never breaking flow

**Store/Inventory Grids:**
- Mobile: 2 columns, gap-3
- Tablet: 3 columns, gap-4
- Desktop: 4 columns, gap-5
- Cards: Consistent aspect ratio, centered content

## Color & Visual Treatment
**Maintain Existing Palette:**
- Background: #000
- Surface: rgba(10, 10, 10, 0.5) with backdrop-blur(12px)
- Text: #f5f5f5 (primary), rgba(255,255,255,0.7) (secondary)
- Accent: Linear gradient(45deg, #6366f1, #8b5cf6)
- Borders: rgba(255,255,255,0.08)

## Mobile-Specific Patterns
- Remove hover states, rely on active/pressed states
- Increase all clickable areas to 44px minimum
- Use bottom sheets for menus instead of dropdowns
- Safe area insets for notched devices (env(safe-area-inset-*))
- Prevent zoom on input focus (font-size: 16px minimum)
- Optimize scroll performance (will-change, transform)

## Accessibility
- Maintain color contrast ratios (4.5:1 minimum)
- Keyboard navigation support
- Screen reader friendly labels
- Focus indicators visible (2px outline)
- Skip to content link for keyboard users

## Performance Optimizations
- Lazy load images below fold
- Use CSS transforms for animations (not layout properties)
- Minimize JavaScript-driven animations
- Responsive images with srcset where applicable
- Compress and optimize all assets

## Images
**Thumbnail Images:** Game thumbnails throughout (existing)
**No Hero Images:** Gaming platform focuses on content discovery, not marketing landing

This responsive transformation maintains the immersive gaming aesthetic while ensuring excellent usability across all devices.