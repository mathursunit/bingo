
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';

interface DraggableTileProps {
    id: string | number;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
}

export const DraggableTile: React.FC<DraggableTileProps> = ({ id, children, disabled, className, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto", // Ensure dragged item is on top
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={cn(
                "w-full h-full", // Ensure it fills the grid cell
                !disabled && "touch-none cursor-grab active:cursor-grabbing", // Prevent scroll on touch, show cursor
                isDragging && "opacity-0", // Hide the original element while dragging (we'll show DragOverlay instead usually, OR keep it opacity-50)
                className
            )}
        >
            {/* If not dragging, we show content. If dragging, we often hide this and show Overlay. 
                For simplicity in grid sortable, opacity-50 or 0 is common if using overlay.
                If NOT using Overlay, opacity-100 is fine but it won't be lifted out.
                We plan to use DragOverlay. So opacity-0 or opacity-20 is good.
            */}
            <div className={cn("w-full h-full", isDragging && "opacity-0")}>
                {children}
            </div>
        </div>
    );
};
