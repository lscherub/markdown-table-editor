
import React, { useRef } from 'react';
import { useGridStore } from '../../store/gridStore';

interface RowNumberColumnProps {
    rows: number;
}

export const RowNumberColumn: React.FC<RowNumberColumnProps> = ({ rows }) => {
    const cols = useGridStore((s) => s.cols);
    const selection = useGridStore((s) => s.selection);
    const setSelectionStart = useGridStore((s) => s.setSelectionStart);
    const setIsDragging = useGridStore((s) => s.setIsDragging);

    const isDraggingRow = useRef(false);

    // Check if an entire row is selected (all columns covered)
    const isRowSelected = (rowIndex: number): boolean => {
        if (!selection) return false;
        const rMin = Math.min(selection.start.row, selection.end.row);
        const rMax = Math.max(selection.start.row, selection.end.row);
        const cMin = Math.min(selection.start.col, selection.end.col);
        const cMax = Math.max(selection.start.col, selection.end.col);
        return rowIndex >= rMin && rowIndex <= rMax && cMin === 0 && cMax === cols - 1;
    };

    const handleMouseDown = (e: React.MouseEvent, rowIndex: number) => {
        e.preventDefault();
        isDraggingRow.current = true;
        setIsDragging(true);
        // Select entire row: from col 0 to last col
        setSelectionStart(rowIndex, 0);
        useGridStore.getState().setSelectionEnd(rowIndex, cols - 1);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingRow.current) return;
            // Find which row the mouse is over by y position
            const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
            const rowEl = target?.closest('[data-row-index]');
            if (rowEl) {
                const idx = parseInt(rowEl.getAttribute('data-row-index') ?? '0', 10);
                useGridStore.getState().setSelectionEnd(idx, cols - 1);
            }
        };

        const handleMouseUp = () => {
            isDraggingRow.current = false;
            setIsDragging(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="flex flex-col flex-shrink-0 sticky left-0 z-10 bg-gray-100 border-r border-gray-300">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    data-row-index={rowIndex}
                    onMouseDown={(e) => handleMouseDown(e, rowIndex)}
                    className={`h-8 w-10 flex items-center justify-center text-xs font-medium border-b border-gray-200 select-none cursor-pointer transition-colors
                        ${isRowSelected(rowIndex)
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                    title="Click or drag to select entire row(s)"
                >
                    {rowIndex + 1}
                </div>
            ))}
        </div>
    );
};
