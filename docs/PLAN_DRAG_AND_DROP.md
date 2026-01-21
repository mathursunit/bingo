# Drag and Drop Implementation Plan for Bingo Tiles

This document outlines the strategy for implementing drag-and-drop tile reordering within the `BingoBoard` component, specifically for the "Edit Board" mode.

## 1. Technology Selection

We will use **@dnd-kit** for this implementation.
- **Why?** It offers excellent support for **Grid Layouts** (via `rectSortingStrategy`), which is difficult to achieve robustly with Framer Motion's list-based `Reorder` component. It is also accessible and highly customizable.
- **Packages Required:**
  - `@dnd-kit/core`: Main context and sensors.
  - `@dnd-kit/sortable`: Logic for sortable items within a context.
  - `@dnd-kit/utilities`: Helper for CSS transformations.

## 2. Implementation Steps

### Phase 1: Setup & Dependencies
1.  Install dependencies:
    ```bash
    npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
    ```

### Phase 2: Create `DraggableTile` Component
Create a wrapper component `src/components/ui/DraggableTile.tsx` that handles the drag interactions.
- **Props:** `id`, `children`, `disabled` (for non-edit mode).
- **Logic:**
  - Use `useSortable({ id })`.
  - Apply `transform` and `transition` styles.
  - Render a "Drag Handle" (or make the whole tile draggable) visible only during Edit Mode.
  - Integrate with existing visual styles (`bingo-tile`).

### Phase 3: Integrate into `BingoBoard.tsx`

1.  **Local State Management:**
    - Introduce local state `items` initialized from `board.items`.
    - This ensures instant UI feedback during drag operations before persisting to the database.

2.  **Wrappers:**
    - Wrap the grid container in `<DndContext>` and `<SortableContext>`.
    - `DndContext` needs sensors (Mouse, Touch) and collision detection (`closestCenter`).
    - `SortableContext` needs the list of item IDs and `strategy={rectSortingStrategy}` (Crucial for grids).

3.  **Render Loop:**
    - Update the `displayItems.map` loop.
    - If `editMode` is **active**, render `<DraggableTile>`.
    - If `editMode` is **inactive**, render the standard static tile.
    - *Optimization:* Always render `DraggableTile` but pass `disabled={!editMode}` to allow seamless transitions.

4.  **Handling Drag End:**
    - Implement `handleDragEnd(event)` function.
    - check `event.over`.
    - Use `arrayMove` (from dnd-kit) to swap the items in the local state.
    - **Free Space Handling:**
      - **Option A (Preferred):** Allow the Free Space to be moved just like any other tile.
      - **Option B (Strict):** If the center tile is "Free Space", prevent it from being sorted (using `disabled` prop on that specific Item ID).

### Phase 4: Visual Feedback & styles
1.  **Drag Overlay:**
    - Use `<DragOverlay>` to show a semi-transparent ghost of the tile being dragged.
    - Ensure it retains the "Glassmorphism" look (`bingo-tile` class) so it looks natural.
2.  **Cursor:**
    - Change cursor to `grab` / `grabbing` when hovering tiles in Edit Mode.
3.  **Wobble Animation (Optional "Jiggle" Mode):**
    - When `editMode` is on, apply a subtle rotation animation to all tiles (like iOS) to indicate they are editable.

### Phase 5: Persistence
1.  **Save Logic:**
    - The drag operation updates *local state* only.
    - The `Edit Board` modal/mode already has a "Save Changes" button (or distinct "Done" action).
    - When the user exits Edit Mode or clicks Save, write the new `items` array order to Firestore via `updateBoard`.

## 3. Code Structure Preview

```tsx
// BingoBoard.tsx structure
<DndContext 
  sensors={sensors} 
  collisionDetection={closestCenter} 
  onDragEnd={handleDragEnd}
>
  <SortableContext items={localItems} strategy={rectSortingStrategy}>
    <div className="grid ...">
      {localItems.map((item) => (
        <DraggableTile key={item.id} id={item.id} disabled={!editMode}>
           {/* Existing Tile Content */}
        </DraggableTile>
      ))}
    </div>
  </SortableContext>
  <DragOverlay>
     {/* Render active item clone here /}
  </DragOverlay>
</DndContext>
```

## 4. Risks & Mitigations
- **Mobile Scrolling:** Dragging on mobile can conflict with page scrolling.
  - *Mitigation:* Use `TouchSensor` with a `delay` or `tolerance` (e.g., press and hold to drag), OR use a dedicated "Drag Handle" icon on the tile.
- **Grid Responsiveness:** dnd-kit handles responsive grids well, but we must ensure the `SortableContext` items list stays in sync.
- **Free Space Logic:** If we lock the Free Space, the rect sorting strategy might react weirdly around the locked item.
  - *Mitigation:* It is smoothest to allow the Free Space to be moved freely during editing, and just rely on the user to place it where they want.
