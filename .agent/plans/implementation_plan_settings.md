# Implementation Plan: Settings Menu

This document limits the scope to the requested features (Wallpaper, Font) and suggests additional relevant settings.

## 1. Objective
Create a user-customizable Settings Menu accessible from the Dashboard and Bingo Board to personalize the application's appearance and behavior.

## 2. Proposed Settings Structure

### Core Features (Requested)
1.  **Wallpaper / Background Selection**
    *   **Preset Gradients:** Select from curated CSS gradients (e.g., "Dawn (Default)", "Midnight", "Ocean", "Forest", "Sunset").
    *   **Styles:** Option to toggle the background particle animation on/off.
2.  **Font Selection**
    *   **Typeface Options:** select from 4-5 distinct styles:
        *   *Modern* (Outfit - Current)
        *   *Clean* (Inter/Roboto)
        *   *Playful* (Fredoka/Comic Neue)
        *   *Elegant* (Playfair Display/Lora)
        *   *Monospace* (Fira Code - for tech/nerdy vibe)

### Suggested Additional Settings
3.  **Accent Color**
    *   Change the primary brand color (currently Pink/Gold) to Blue, Purple, Green, or Orange. This dramatically changes the app's "vibe" without breaking layout.
4.  **Accessibility**
    *   **Reduced Motion:** Disable background animations and large transitions.
    *   **High Contrast:** Make text clearer and borders more defined.
5.  **Sounds (Future)**
    *   Enable/Disable sound effects for marking tiles or completing rows.

## 3. Technical Architecture

### A. Data Persistence
To ensure a seamless experience across devices, settings should be stored in **Firestore** under the user's profile, falling back to local defaults.

*   **Collection:** `users`
*   **Document Field:** `settings: { background: string, font: string, enableAnimation: boolean, ... }`

### B. State Management (`SettingsContext`)
We will create a `SettingsContext` that:
1.  Fetches user settings on load.
2.  Provides a `updateSettings(partialSettings)` function.
3.  **Automatically applies** visual changes:
    *   It will update CSS Variables on the `document.documentElement` (Root) for fonts and colors.
    *   It will expose the current `background` class/value to the main layout components.

### C. Implementation Steps

#### Step 1: Styles & Assets (Setup)
*   Update `index.html` to pre-load the additional Google Fonts.
*   Define CSS variables in `index.css` for `font-family` and background layers so they can be overridden by JS.

#### Step 2: Settings Context
*   Create `src/contexts/SettingsContext.tsx`.
*   Implement `useEffect` to sync Firestore data.
*   Implement `useEffect` to apply `style` properties to the `<body>` or `:root`.

#### Step 3: Components
*   **`SettingsDialog.tsx`**: A polished modal using our `DialogContext` system (or a standalone specialized modal).
    *   **Preview Area:** Show a mini "Tile" or text sample that updates instantly as you click options.
    *   **Background Picker:** Grid of colored circles/rectangles representing the themes.
    *   **Font Picker:** a list where each item is rendered *in* that font.

#### Step 4: Integration
*   Add a "Settings" (Gear Icon) button to:
    *   **Dashboard:** Top right header.
    *   **BingoBoard:** Header row (next to Share/User).

## 4. UI/UX Design Mockup

**Modal Layout:**
```
+--------------------------------------------------+
|  Settings                                     X  |
+--------------------------------------------------+
|  [ Appearance ]   [ Account ]                    | <-- Tabs
+--------------------------------------------------+
|                                                  |
|  Background                                      |
|  [ (o) Default ] [ ( ) Night ] [ ( ) Ocean ]     | <-- Visual Swatches
|  [x] Enable Particle Animation                   |
|                                                  |
|  Font Style                                      |
|  [ Outfit (Modern)            v ]                | <-- Dropdown or List
|  The quick brown fox jumps over...               | <-- Preview
|                                                  |
|  Accent Color                                    |
|  (O) Pink   ( ) Blue   ( ) Teal                  |
|                                                  |
+--------------------------------------------------+
|                                  [ Save Changes ]|
+--------------------------------------------------+
```

## 5. Development Phases
1.  **Phase 1:** Setup Context & Basic Font/Background switching using local state.
2.  **Phase 2:** Save/Load for Firestore.
3.  **Phase 3:** Polish UI (Previews).
