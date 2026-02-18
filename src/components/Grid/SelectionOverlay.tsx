import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGridStore } from '../../store/gridStore';

const CELL_HEIGHT = 32; // h-8 = 2rem = 32px
const DEFAULT_COL_WIDTH = 128;

export const SelectionOverlay: React.FC = () => {
    const { selection, isFilling, fillEnd, columnWidths } = useGridStore(useShallow((s) => ({
        selection: s.selection,
        isFilling: s.isFilling,
        fillEnd: s.fillEnd,
        columnWidths: s.columnWidths,
    })));

    if (!selection) return null;

    // Helper: compute pixel left offset for a column index
    const colLeft = (colIndex: number): number => {
        let left = 0;
        for (let c = 0; c < colIndex; c++) {
            left += columnWidths[c] ?? DEFAULT_COL_WIDTH;
        }
        return left;
    };

    // Helper: compute pixel width spanning from cMin to cMax (inclusive)
    const colSpanWidth = (cMin: number, cMax: number): number => {
        let width = 0;
        for (let c = cMin; c <= cMax; c++) {
            width += columnWidths[c] ?? DEFAULT_COL_WIDTH;
        }
        return width;
    };

    const getRect = (r1: number, c1: number, r2: number, c2: number) => {
        const rMin = Math.min(r1, r2);
        const rMax = Math.max(r1, r2);
        const cMin = Math.min(c1, c2);
        const cMax = Math.max(c1, c2);
        return {
            top: rMin * CELL_HEIGHT,
            left: colLeft(cMin),
            width: colSpanWidth(cMin, cMax),
            height: (rMax - rMin + 1) * CELL_HEIGHT
        };
    };

    const { start, end } = selection;
    const selRect = getRect(start.row, start.col, end.row, end.col);

    // Calculate Fill Rect if filling
    let fillRect = null;
    if (isFilling && fillEnd) {
        const rMin = Math.min(start.row, end.row, fillEnd.row);
        const rMax = Math.max(start.row, end.row, fillEnd.row);
        const cMin = Math.min(start.col, end.col, fillEnd.col);
        const cMax = Math.max(start.col, end.col, fillEnd.col);
        fillRect = getRect(rMin, cMin, rMax, cMax);
    }

    return (
        <>
            <div
                className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-10 box-border"
                style={{
                    top: `${selRect.top}px`,
                    left: `${selRect.left}px`,
                    width: `${selRect.width}px`,
                    height: `${selRect.height}px`
                }}
            >
                {/* Fill Handle */}
                <div
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 cursor-crosshair pointer-events-auto border border-white"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        useGridStore.getState().setIsFilling(true);
                    }}
                />
            </div>

            {fillRect && (
                <div
                    className="absolute border-2 border-dashed border-gray-500 pointer-events-none z-20 box-border"
                    style={{
                        top: `${fillRect.top}px`,
                        left: `${fillRect.left}px`,
                        width: `${fillRect.width}px`,
                        height: `${fillRect.height}px`
                    }}
                />
            )}
        </>
    );
};
