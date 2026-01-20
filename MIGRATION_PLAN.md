# Migration Plan: Legacy '2026' Board -> New Shared Board

## Objective
Migrate the data from the legacy `years/2026` Firestore document into a new, fully-featured Board in the `boards` collection. 
The new board will be owned by **Sara** and shared with **Sunit** as an Editor.

## 1. Data Source
- **Collection:** `years`
- **Document ID:** `2026`
- **Data Points to Extract:**
  - `items`: The array of bingo goals (text, completion status).
  - `title`: Board title (if exists, otherwise "2026 Bingo").
  - `isLocked`: Lock status.

## 2. User Resolution
We need the Firebase `uid` for the specific users to set permissions.
- **Reference Emails:**
  - Owner: `sarawbush@gmail.com`
  - Editor: `sunit.mathur@gmail.com`
- **Method:**
  - Query the `users` collection: `where('email', '==', email_address)`.
  - Captures `UID_SARA` and `UID_SUNIT`.

## 3. Data Transformation Schema
The data will be restructured to match the new `Board` interface:

```typescript
{
  title: "2026 Bingo", // or title from legacy
  gridSize: 5,         // Legacy boards are 5x5
  ownerId: UID_SARA,   // Transferred ownership
  createdAt: Timestamp.now(),
  members: {
    [UID_SARA]: 'owner',
    [UID_SUNIT]: 'editor'
  },
  items: [
    // Transform legacy items to new BingoItem objects
    {
      id: 0,
      text: "Read 12 books...",
      isCompleted: true, // Preserve status
      isFreeSpace: false,
      targetCount: 1,
      currentCount: 1,   // if completed
      completedBy: UID_SARA // Defaults to owner for legacy completions
    },
    // ... repeat for 25 items
  ]
}
```

## 4. Implementation Strategy
To execute this secure database operation, we will create a temporary **Client-Side Migration Tool**.

### Step 1: Create Migration Component
- Build a new component `src/components/admin/MigrateLegacy.tsx`.
- Map it to a hidden route: `/admin/migrate`.

### Step 2: The Logic (Script)
1.  **Fetch Legacy:** `getDoc(doc(db, 'years', '2026'))`.
2.  **Fetch Users:** Run queries to find UIDs for Sara and Sunit.
3.  **Map Data:** Loop through legacy items.
    - If index `12` (Center) -> Ensure it's marked as Free Space.
    - Copy text and completion status.
4.  **Write New Board:** `addDoc(collection(db, 'boards'), newBoardData)`.
5.  **Success Feedback:** Display the new `Board ID` and a link to open it.

## 5. Execution Steps
1.  Deploy the migration code.
2.  A user (ideally Sara or Sunit, assuming they have read access to the legacy doc) logs in.
3.  Navigate to `/admin/migrate`.
4.  Click **"Run Migration"**.
5.  Verify the new board appears on the Dashboard.

## 6. Cleanup
- Once verified, remove the migration route and component.
- Optionally archive the old `years/2026` document to prevent confusion (rename to `years/2026_backup`).
