import React, { useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGridStore } from '../../store/gridStore';
import { Cell } from './Cell';
import { HeaderRow } from './HeaderRow';
import { RowNumberColumn } from './RowNumberColumn';
import { SelectionOverlay } from './SelectionOverlay';
import { ContextMenu } from './ContextMenu';

export const Grid: React.FC = () => {
    const { data, rows, cols, columnWidths, mergedRows, selection, isDragging, isFilling } = useGridStore(useShallow((s) => ({
        data: s.data,
        rows: s.rows,
        cols: s.cols,
        columnWidths: s.columnWidths,
        mergedRows: s.mergedRows,
        selection: s.selection,
        isDragging: s.isDragging,
        isFilling: s.isFilling,
    })));

    const moveSelection = useGridStore((s) => s.moveSelection);
    const setEditing = useGridStore((s) => s.setEditing);
    const editing = useGridStore((s) => s.editing);
    const setIsDragging = useGridStore((s) => s.setIsDragging);
    const setIsFilling = useGridStore((s) => s.setIsFilling);
    const fillEnd = useGridStore((s) => s.fillEnd);
    const fillRange = useGridStore((s) => s.fillRange);
    const setFillEnd = useGridStore((s) => s.setFillEnd);
    const pasteData = useGridStore((s) => s.pasteData);
    const undo = useGridStore((s) => s.undo);
    const redo = useGridStore((s) => s.redo);
    const setShowShortcutsModal = useGridStore((s) => s.setShowShortcutsModal);
    const contextMenu = useGridStore((s) => s.contextMenu);
    const previewMode = useGridStore((s) => s.previewMode);
    const setPreviewMode = useGridStore((s) => s.setPreviewMode);
    const previewRect = useGridStore((s) => s.previewRect);
    const unmergeCells = useGridStore((s) => s.unmergeCells);
    const setSelectionStart = useGridStore((s) => s.setSelectionStart);
    const setSelectionEnd = useGridStore((s) => s.setSelectionEnd);
    const setContextMenu = useGridStore((s) => s.setContextMenu);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isFilling && selection && fillEnd) {
                const rMin = Math.min(selection.start.row, selection.end.row, fillEnd.row);
                const rMax = Math.max(selection.start.row, selection.end.row, fillEnd.row);
                const cMin = Math.min(selection.start.col, selection.end.col, fillEnd.col);
                const cMax = Math.max(selection.start.col, selection.end.col, fillEnd.col);
                fillRange({ start: { row: rMin, col: cMin }, end: { row: rMax, col: cMax } });
            }
            setIsDragging(false);
            setIsFilling(false);
            setFillEnd(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [setIsDragging, isFilling, selection, fillEnd, fillRange, setIsFilling, setFillEnd]);

    useEffect(() => {
        if (containerRef.current && !editing) {
            containerRef.current.focus();
        }
    }, [editing]);

    // Auto-float preview when grid content overflows the viewport
    useEffect(() => {
        const ROW_NUM_WIDTH = 40;
        const totalGridWidth = ROW_NUM_WIDTH + columnWidths.reduce((sum, w) => sum + (w ?? 128), 0);
        const viewportWidth = window.innerWidth;
        if (totalGridWidth > viewportWidth - 100 && previewMode === 'docked') {
            setPreviewMode('floating');
        }
    }, [columnWidths, previewMode, setPreviewMode, previewRect]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (editing) return;

        // Ctrl+Z — Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
            return;
        }

        // Ctrl+Y or Ctrl+Shift+Z — Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
            return;
        }

        // Ctrl+V — Paste from Excel / clipboard (TSV format)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
                if (!text) return;
                const rawRows = text.replace(/\r\n$/, '').replace(/\n$/, '').split(/\r?\n/);
                const parsed = rawRows.map(row => row.split('\t'));
                if (parsed.length === 0) return;
                const state = useGridStore.getState();
                const startRow = state.selection?.start.row ?? 0;
                const startCol = state.selection?.start.col ?? 0;
                pasteData(parsed, startRow, startCol);
            }).catch(() => { });
            return;
        }

        // Ctrl+C — Copy selected range to clipboard as TSV
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            const state = useGridStore.getState();
            if (!state.selection) return;
            const { start, end } = state.selection;
            const rMin = Math.min(start.row, end.row);
            const rMax = Math.max(start.row, end.row);
            const cMin = Math.min(start.col, end.col);
            const cMax = Math.max(start.col, end.col);
            const tsv = data
                .slice(rMin, rMax + 1)
                .map(row => row.slice(cMin, cMax + 1).join('\t'))
                .join('\n');
            navigator.clipboard.writeText(tsv).catch(() => { });
            return;
        }

        // ? — Show keyboard shortcuts
        if (e.key === '?') {
            e.preventDefault();
            setShowShortcutsModal(true);
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                moveSelection('up');
                break;
            case 'ArrowDown':
            case 'Enter':
                e.preventDefault();
                moveSelection(e.shiftKey ? 'up' : 'down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveSelection('left');
                break;
            case 'ArrowRight':
            case 'Tab':
                e.preventDefault();
                moveSelection(e.shiftKey ? 'left' : 'right');
                break;
            case 'Delete':
            case 'Backspace':
                if (!editing) {
                    e.preventDefault();
                    const state = useGridStore.getState();
                    if (state.selection) {
                        const { start, end } = state.selection;
                        const rMin = Math.min(start.row, end.row);
                        const rMax = Math.max(start.row, end.row);
                        const cMin = Math.min(start.col, end.col);
                        const cMax = Math.max(start.col, end.col);
                        const fullRowsSelected = cMin === 0 && cMax === state.cols - 1 && rMax > rMin;
                        const fullColsSelected = rMin === 0 && rMax === state.rows - 1 && cMax > cMin;
                        if (fullRowsSelected) {
                            // Delete all selected rows at once
                            state.deleteRow(-1);
                        } else if (fullColsSelected) {
                            // Delete all selected columns at once
                            state.deleteColumn(-1);
                        } else {
                            state.deleteSelection();
                        }
                    } else {
                        state.deleteSelection();
                    }
                }
                break;
            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    setEditing(true);
                }
                break;
        }
    };

    // Compute total grid width for merged row spans
    const totalGridWidth = columnWidths.reduce((sum, w) => sum + (w ?? 128), 0);

    return (
        <div className="flex flex-col h-full overflow-hidden select-none">
            <div
                className="flex-1 overflow-auto relative grid-container outline-none"
                tabIndex={0}
                ref={containerRef}
                onKeyDown={handleKeyDown}
            >
                <div className="inline-block min-w-full">
                    <HeaderRow cols={cols} />

                    <div className="flex">
                        <RowNumberColumn rows={rows} />

                        <div className="flex flex-col">
                            <div className="relative">
                                <SelectionOverlay />
                                {data.map((row, rowIndex) => {
                                    // Render merged rows as a plain text line
                                    if (rowIndex in mergedRows) {
                                        const rawText = mergedRows[rowIndex];
                                        const headingMatch = rawText.match(/^(#{1,3})\s+(.*)/);
                                        const headingLevel = headingMatch ? headingMatch[1].length : 0;
                                        const displayText = headingMatch ? headingMatch[2] : rawText;

                                        const headingStyles: Record<number, string> = {
                                            1: 'text-lg font-bold text-gray-900',
                                            2: 'text-base font-bold text-gray-800',
                                            3: 'text-sm font-semibold text-gray-700',
                                        };
                                        const headingBadgeStyles: Record<number, string> = {
                                            1: 'bg-blue-100 text-blue-700',
                                            2: 'bg-indigo-100 text-indigo-700',
                                            3: 'bg-purple-100 text-purple-700',
                                        };

                                        const textClass = headingLevel > 0
                                            ? headingStyles[headingLevel]
                                            : 'text-sm text-gray-800';
                                        const isSelected = (() => {
                                            if (!selection) return false;
                                            const rMin = Math.min(selection.start.row, selection.end.row);
                                            const rMax = Math.max(selection.start.row, selection.end.row);
                                            const cMin = Math.min(selection.start.col, selection.end.col);
                                            const cMax = Math.max(selection.start.col, selection.end.col);
                                            return rowIndex >= rMin && rowIndex <= rMax && cMin === 0 && cMax === cols - 1;
                                        })();

                                        return (
                                            <div
                                                key={rowIndex}
                                                data-row-index={rowIndex}
                                                className={`flex items-center border-b border-gray-200 px-2 select-none group ${isSelected ? 'bg-blue-100' : 'bg-amber-50'}`}
                                                style={{
                                                    width: totalGridWidth,
                                                    minHeight: '32px',
                                                    height: '32px',
                                                }}
                                                onMouseDown={(e) => {
                                                    if (e.button !== 0) return;
                                                    e.preventDefault();
                                                    setSelectionStart(rowIndex, 0);
                                                    setSelectionEnd(rowIndex, cols - 1);
                                                    setEditing(false);
                                                    setIsDragging(true);
                                                }}
                                                onMouseEnter={() => {
                                                    if (isDragging) setSelectionEnd(rowIndex, cols - 1);
                                                    if (isFilling) setFillEnd({ row: rowIndex, col: cols - 1 });
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setSelectionStart(rowIndex, 0);
                                                    setSelectionEnd(rowIndex, cols - 1);
                                                    setContextMenu({ x: e.clientX, y: e.clientY, row: rowIndex, col: 0 });
                                                }}
                                                onDoubleClick={() => unmergeCells(rowIndex)}
                                                title="Double-click to unmerge this row"
                                            >
                                                {headingLevel > 0 && (
                                                    <span className={`text-xs font-mono font-bold mr-2 px-1 py-0.5 rounded flex-shrink-0 ${headingBadgeStyles[headingLevel]}`}>
                                                        {'#'.repeat(headingLevel)}
                                                    </span>
                                                )}
                                                <span className={`flex-1 truncate ${textClass}`}>{displayText}</span>
                                                <span className="text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                                                    ↩ unmerge
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={rowIndex} className="flex h-8">
                                            {row.map((cellValue, colIndex) => {
                                                const width = columnWidths[colIndex] ?? 128;
                                                return (
                                                    <div key={`${rowIndex}-${colIndex}`} className="flex-shrink-0" style={{ width }}>
                                                        <Cell row={rowIndex} col={colIndex} value={cellValue} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && <ContextMenu />}
        </div>
    );
};
