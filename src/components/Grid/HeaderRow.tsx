
import React, { useCallback, useRef } from 'react';
import { getColumnLabel } from '../../utils/gridUtils';
import { useGridStore } from '../../store/gridStore';

interface HeaderRowProps {
    cols: number;
}

export const HeaderRow: React.FC<HeaderRowProps> = ({ cols }) => {
    const columnWidths = useGridStore((s) => s.columnWidths);
    const setColumnWidth = useGridStore((s) => s.setColumnWidth);
    const rows = useGridStore((s) => s.rows);
    const selection = useGridStore((s) => s.selection);
    const setSelectionStart = useGridStore((s) => s.setSelectionStart);
    const setIsDragging = useGridStore((s) => s.setIsDragging);

    // Track resize state in a ref to avoid re-renders during drag
    const resizeState = useRef<{ col: number; startX: number; startWidth: number } | null>(null);
    const isDraggingCol = useRef(false);

    // Check if an entire column is selected (all rows covered)
    const isColSelected = (colIndex: number): boolean => {
        if (!selection) return false;
        const rMin = Math.min(selection.start.row, selection.end.row);
        const rMax = Math.max(selection.start.row, selection.end.row);
        const cMin = Math.min(selection.start.col, selection.end.col);
        const cMax = Math.max(selection.start.col, selection.end.col);
        return colIndex >= cMin && colIndex <= cMax && rMin === 0 && rMax === rows - 1;
    };

    const handleColHeaderMouseDown = (e: React.MouseEvent, colIndex: number) => {
        // Don't trigger column selection if clicking the resize handle area (last 6px)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        if (e.clientX > rect.right - 8) return; // resize handle zone

        e.preventDefault();
        isDraggingCol.current = true;
        setIsDragging(true);
        // Select entire column: from row 0 to last row
        setSelectionStart(0, colIndex);
        useGridStore.getState().setSelectionEnd(rows - 1, colIndex);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingCol.current) return;
            const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
            const colEl = target?.closest('[data-col-index]');
            if (colEl) {
                const idx = parseInt(colEl.getAttribute('data-col-index') ?? '0', 10);
                useGridStore.getState().setSelectionEnd(rows - 1, idx);
            }
        };

        const handleMouseUp = () => {
            isDraggingCol.current = false;
            setIsDragging(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeMouseDown = useCallback((e: React.MouseEvent, colIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        const startWidth = columnWidths[colIndex] ?? 128;
        resizeState.current = { col: colIndex, startX: e.clientX, startWidth };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizeState.current) return;
            const delta = moveEvent.clientX - resizeState.current.startX;
            const newWidth = resizeState.current.startWidth + delta;
            setColumnWidth(resizeState.current.col, newWidth);
        };

        const handleMouseUp = () => {
            resizeState.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [columnWidths, setColumnWidth]);

    return (
        <div className="flex border-b border-gray-300 bg-gray-100 font-semibold text-xs text-gray-500 sticky top-0 z-20">
            {/* Corner Cell */}
            <div className="w-10 flex-shrink-0 border-r border-gray-300 bg-gray-100 flex items-center justify-center">
            </div>

            {/* Column Headers */}
            {Array.from({ length: cols }).map((_, colIndex) => {
                const width = columnWidths[colIndex] ?? 128;
                const selected = isColSelected(colIndex);
                return (
                    <div
                        key={colIndex}
                        data-col-index={colIndex}
                        onMouseDown={(e) => handleColHeaderMouseDown(e, colIndex)}
                        className={`relative flex-shrink-0 flex items-center justify-center border-r border-gray-300 h-8 uppercase select-none cursor-pointer transition-colors
                            ${selected ? 'bg-blue-200 text-blue-800' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                        style={{ width }}
                        title="Click or drag to select entire column(s)"
                    >
                        {getColumnLabel(colIndex)}

                        {/* Resize Handle */}
                        <div
                            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 hover:opacity-60 z-10"
                            onMouseDown={(e) => handleResizeMouseDown(e, colIndex)}
                            title="Drag to resize column"
                        />
                    </div>
                );
            })}
        </div>
    );
};
