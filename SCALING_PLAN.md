# Scaling Plan: Multi-Tenant Social Bingo Platform

This document outlines the roadmap to transform the current single-board application into a SaaS-style platform where users can create, manage, and share their own Bingo boards.

## 1. Core Architecture Changes

### Data Model Evolution
We need to move from a singleton `years/2026` document to a relational-style model in Firestore.

**New Collections:**

1.  **`boards`** (The main game instances)
    *   `id`: Auto-generated UUID
    *   `title`: string (e.g., "Smith Family 2026")
    *   `ownerId`: string (User UID)
    *   `members`: Map/Object
        *   `Key`: User UID
        *   `Value`: Role ('owner', 'editor', 'viewer')
    *   `items`: Array (Existing BingoItem structure)
    *   `theme`: string (e.g., 'dark', 'light', 'neon')
    *   `isLocked`: boolean
    *   `createdAt`: Timestamp

2.  **`users`** (Profile & directory)
    *   `uid`: string
    *   `email`: string
    *   `displayName`: string
    *   `photoURL`: string
    *   `boardIds`: Array of strings (Denormalized list of boards they belong to for fast loading)

### Routing Structure
Transition from a single-page app to a multi-view application using `react-router-dom`:

*   **`/` (Public)**: Landing page with "Login" / "Get Started".
*   **`/dashboard` (Protected)**: Main hub. Lists "My Boards" and "Shared Boards".
*   **`/board/:boardId` (Protected)**: The active game board (Current `BingoBoard.tsx` logic, but parameterized).
*   **`/create` (Protected)**: Wizard to generate a new board.

---

## 2. Implementation Roadmap

### Phase 1: Foundation & Dashboard
**Objective**: Allow users to see a list of boards and create a new one.

1.  **Refactor Root**: Wrap the app in `BrowserRouter`.
2.  **Create Dashboard Component**:
    *   Fetch `boards` where `members.{uid}` exists.
    *   Display cards for each board.
3.  **Board Creation Wizard**:
    *   Input: Title, Theme.
    *   Logic: Generates a new document in `boards` with default 2026 items (or user-selected template).
    *   Action: Redirects to `/board/:newId`.

### Phase 2: Dynamic Board Logic
**Objective**: Make the Game Board agnostic to the specific document ID.

1.  **Update `useBingo` Hook**:
    *   Accept `boardId` as a parameter.
    *   Listen to `doc(db, 'boards', boardId)` instead of `years/2026`.
2.  **Update `BingoBoard` Component**:
    *   Read `boardId` from URL params (`useParams`).
    *   Pass `boardId` to `useBingo`.

### Phase 3: Sharing & Permissions
**Objective**: Collaborate with others.

1.  **Share Modal**:
    *   Input: Email address.
    *   Logic:
        *   Check if user exists in `users` collection.
        *   If yes -> Add UID to board's `members` map.
        *   If no -> Send email invite (requires backend/Cloud Function) OR add to `invitedEmails` array and resolve when they sign up.
2.  **Security Rules (Firestore)**:
    *   Strictly enforce that only users in `members` map can read/write to a board.

---

## 3. Features & Optimizations

### 🚀 Optimizations
*   **Lazy Loading**: Use `React.lazy()` for the Board component to speed up the initial Dashboard load.
*   **Image Optimization**: Enforce stricter Cloudinary transformations (auto-format, quality limit) to reduce bandwidth as user base grows.
*   **Drag-and-Drop Editor**: For the "Create" phase, allow users to drag items around to customize their initial customized logic.

### ✨ New Features
1.  **Templates Library**:
    *   "Corpo Bingo": (HTML email, "Circle back", "Synergy")
    *   "Fitness Challenge": (Run 5k, 100 pushups, Yoga)
    *   "Travel Bucket List"
2.  **Activity Feed**:
    *   A timeline sidebar showing: *"Sunit uploaded a photo for 'Read 12 Books'"* or *"Sarah completed a row!"*
3.  **Comments / Reactions**:
    *   Allow members to comment on Proof Photos (e.g., "Wow, that look delicious!" on a cooking tile).
4.  **Competitive Mode**:
    *   Instead of *collaborating* on one board, generate an instance where 5 users get the **same items shuffled differently**. First to Get X Bingos wins a prize pool.

### ⚠️ Technical Debt to Address
*   **LocalStorage Scoping**: Currently flags like `celebrationDismissed` are global. They must be scoped to the board ID (e.g., `bingo_celebration_dismissed_${boardId}`) so users can win on multiple boards.
*   **Confetti**: Ensure confetti only triggers for the active user's session events if using real-time listeners.

## 4. Immediate "Next Steps" for POC
To start this transition without breaking the current app:

1.  Create the `boards` collection manually in Firebase Console.
2.  Copy the current `years/2026` data into a new board document.
3.  Implement the URL routing logic to point `/` to a temporary "select board" screen or default to the migration board.
