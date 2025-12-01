# Momento UI/UX Redesign Plan

## Vision
Transform Momento into a premium, inviting personal journal that feels like a sanctuary for thoughts. The design will support both **Light** and **Dark** modes, ensuring a comfortable writing experience at any time of day.

## 1. Design System: "Violet & Slate"

### Color Palette

We will use a semantic color system that adapts to the active theme.

| Semantic Name | Dark Mode ("Midnight Violet") | Light Mode ("Daylight Lavender") | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Main screen background |
| `surface` | `#1E293B` (Slate 800) | `#FFFFFF` (White) | Cards, headers, bottom sheets |
| `surfaceHighlight` | `#334155` (Slate 700) | `#E2E8F0` (Slate 200) | Borders, dividers, pressed states |
| `textPrimary` | `#F8FAFC` (Slate 50) | `#0F172A` (Slate 900) | Headings, main text |
| `textSecondary` | `#CBD5E1` (Slate 300) | `#64748B` (Slate 500) | Body text, subtitles |
| `textMuted` | `#94A3B8` (Slate 400) | `#94A3B8` (Slate 400) | Timestamps, placeholders |
| `primary` | `#8B5CF6` (Violet 500) | `#7C3AED` (Violet 600) | Main actions, active tabs, links |
| `primaryLight` | `#A78BFA` (Violet 400) | `#DDD6FE` (Violet 200) | Background tints, subtle highlights |
| `secondary` | `#10B981` (Emerald 500) | `#059669` (Emerald 600) | Success, streaks |
| `error` | `#EF4444` (Red 500) | `#DC2626` (Red 600) | Destructive actions, errors |

### Typography & Spacing
*   **Font:** System font (San Francisco/Roboto).
    *   Headings: Bold / Heavy.
    *   Body: Regular, line-height 1.5.
*   **Spacing:** Generous padding (16px/20px).
*   **Radius:** `20px` for cards, `12px` for smaller elements.

## 2. Component Redesign

### Navigation
*   **Tab Bar:**
    *   Dark: Deep Slate background with border top.
    *   Light: White background with subtle shadow.
*   **Icons:** `react-native-vector-icons` (Feather/Ionicons).

### Cards (Entry Preview)
*   **Style:** Clean cards with subtle borders in dark mode, shadow in light mode.
*   **Layout:** Date & Time top, Content middle, Tags bottom.

### Entry Composer
*   **Experience:** Distraction-free.
*   **Visuals:** Minimalist text area. Background matches screen background.

## 3. Screen-by-Screen Updates

### 🏠 Journal (Home)
*   **Header:** Greeting + Streak Fire Icon.
*   **Composer:** "Capture the moment..." input area.
*   **List:** Timeline of cards.

### 📅 Calendar
*   **Visuals:** Custom calendar grid adapting to theme.
*   **Interaction:** Selected day highlights with primary color.

### 📊 Insights
*   **Charts:** Modernize bars/charts.
*   **Stats:** Grid of "Bento box" style cards.

### 👤 Profile
*   **Header:** Large centered avatar.
*   **Stats:** Row of stats.

### ⚙️ Settings
*   **Layout:** Grouped list items. Theme toggle (System/Light/Dark).

## 4. Implementation Steps
1.  **Setup:** Create `src/theme/theme.ts` (Theme Context & Hooks) and `src/components/ui` folder.
2.  **Icons:** Integrate Vector Icons.
3.  **Components:** Build `Button`, `Card`, `ScreenLayout`, `Text` primitives that consume the theme.
4.  **Screens:** Refactor each screen to use the new primitives and theme hooks.