
import { create } from 'zustand';

export type GridCell = string;
export type GridData = GridCell[][];
export type CellCoord = { row: number; col: number };
export type SelectionRange = { start: CellCoord; end: CellCoord };
export type ColumnAlignment = 'left' | 'center' | 'right';
export type HeaderLevel = 1 | 2 | 3;

export interface GridState {
    data: GridData;
    rows: number;
    cols: number;
    selection: SelectionRange | null;
    editing: boolean;
    isDragging: boolean;
    isFilling: boolean;
    fillEnd: CellCoord | null;

    previewMode: 'docked' | 'floating' | 'hidden';
    previewRect: { x: number; y: number; width: number; height: number };

    initialized: boolean;
    showNewSheetModal: boolean;
    showShortcutsModal: boolean;
    showHelpModal: boolean;

    // Undo / Redo
    history: GridData[];
    future: GridData[];

    // Column metadata
    columnWidths: number[];
    columnAlignments: ColumnAlignment[];

    // Context menu
    contextMenu: { x: number; y: number; row: number; col: number } | null;

    // Merged rows: rowIndex -> merged text content
    mergedRows: Record<number, string>;

    // Actions
    setShowNewSheetModal: (show: boolean) => void;
    setShowShortcutsModal: (show: boolean) => void;
    setShowHelpModal: (show: boolean) => void;
    setPreviewMode: (mode: 'docked' | 'floating' | 'hidden') => void;
    setPreviewRect: (rect: { x: number; y: number; width: number; height: number }) => void;
    setContextMenu: (menu: { x: number; y: number; row: number; col: number } | null) => void;

    setData: (data: GridData, mergedRows?: Record<number, string>, columnAlignments?: ColumnAlignment[]) => void;
    setCellValue: (row: number, col: number, value: string) => void;
    setSelection: (selection: SelectionRange | null) => void;
    setSelectionStart: (row: number, col: number) => void;
    setSelectionEnd: (row: number, col: number) => void;
    fillRange: (targetRange: SelectionRange) => void;
    deleteSelection: () => void;
    setIsDragging: (isDragging: boolean) => void;
    setIsFilling: (isFilling: boolean) => void;
    setFillEnd: (coord: CellCoord | null) => void;
    applyFormatting: (format: 'bold' | 'italic' | 'strikethrough' | 'code') => void;
    setEditing: (editing: boolean) => void;
    initializeGrid: (rows: number, cols: number) => void;
    addRow: (index?: number) => void;
    deleteRow: (index: number) => void;
    addColumn: (index?: number) => void;
    deleteColumn: (index: number) => void;
    duplicateRow: (index: number) => void;
    duplicateColumn: (index: number) => void;

    // Merge / Unmerge
    mergeCells: () => void;
    unmergeCells: (rowIndex: number) => void;
    isMergedRow: (rowIndex: number) => boolean;
    applyMergedRowHeader: (rowIndex: number, level: HeaderLevel) => void;
    removeMergedRowHeader: (rowIndex: number) => void;

    // Column metadata
    setColumnWidth: (col: number, width: number) => void;
    setColumnAlignment: (col: number, align: ColumnAlignment) => void;

    // Navigation
    moveSelection: (direction: 'up' | 'down' | 'left' | 'right' | 'next' | 'prev') => void;

    // Clipboard
    pasteData: (rows2d: string[][], startRow: number, startCol: number) => void;

    // Undo / Redo
    undo: () => void;
    redo: () => void;
}

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 10;
const DEFAULT_COL_WIDTH = 128;

const createEmptyGrid = (rows: number, cols: number): GridData => {
    return Array.from({ length: rows }, () => Array(cols).fill(''));
};

const defaultWidths = (cols: number) => Array(cols).fill(DEFAULT_COL_WIDTH);
const defaultAlignments = (cols: number): ColumnAlignment[] => Array(cols).fill('left');

// Helper: push current data to history, clear future
const pushHistory = (state: GridState): Pick<GridState, 'history' | 'future'> => ({
    history: [...state.history.slice(-50), state.data], // cap at 50
    future: [],
});

export const useGridStore = create<GridState>((set, get) => ({
    data: createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS),
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    selection: null,
    editing: false,
    isDragging: false,
    isFilling: false,
    fillEnd: null,

    previewMode: 'docked',
    previewRect: { x: 20, y: 100, width: 400, height: 500 },

    initialized: true,
    showNewSheetModal: false,
    showShortcutsModal: false,
    showHelpModal: false,

    history: [],
    future: [],

    columnWidths: defaultWidths(DEFAULT_COLS),
    columnAlignments: defaultAlignments(DEFAULT_COLS),

    contextMenu: null,

    mergedRows: {},

    setShowNewSheetModal: (showNewSheetModal) => set({ showNewSheetModal }),
    setShowShortcutsModal: (showShortcutsModal) => set({ showShortcutsModal }),
    setShowHelpModal: (showHelpModal) => set({ showHelpModal }),
    setPreviewMode: (previewMode) => set({ previewMode }),
    setPreviewRect: (previewRect) => set({ previewRect }),
    setContextMenu: (contextMenu) => set({ contextMenu }),

    setData: (data, mergedRows, columnAlignments) => set((state) => ({
        data,
        rows: data.length,
        cols: data[0]?.length || 0,
        initialized: true,
        mergedRows: mergedRows ?? {},
        columnAlignments: columnAlignments
            ? columnAlignments
            : Array(data[0]?.length || 0).fill('left'),
        columnWidths: Array(data[0]?.length || 0).fill(DEFAULT_COL_WIDTH),
        history: [...state.history.slice(-50), state.data],
        future: [],
    })),

    setCellValue: (row, col, value) => set((state) => {
        const newData = [...state.data];
        newData[row] = [...newData[row]];
        newData[row][col] = value;
        return { data: newData, ...pushHistory(state) };
    }),

    setSelection: (selection) => set({ selection }),

    setSelectionStart: (row, col) => set({
        selection: { start: { row, col }, end: { row, col } }
    }),

    setSelectionEnd: (row, col) => set((state) => {
        if (!state.selection) return {};
        return { selection: { ...state.selection, end: { row, col } } };
    }),

    setIsDragging: (isDragging) => set({ isDragging }),
    setIsFilling: (isFilling) => set({ isFilling }),
    setFillEnd: (fillEnd) => set({ fillEnd }),
    setEditing: (editing) => set({ editing }),

    initializeGrid: (rows, cols) => set({
        rows,
        cols,
        data: createEmptyGrid(rows, cols),
        columnWidths: defaultWidths(cols),
        columnAlignments: defaultAlignments(cols),
        mergedRows: {},
        history: [],
        future: [],
        initialized: true
    }),

    addRow: (index) => set((state) => {
        const insertIdx = index ?? (state.selection ? state.selection.end.row + 1 : state.rows);
        const newRow = Array(state.cols).fill('');
        const newData = [...state.data];
        newData.splice(insertIdx, 0, newRow);
        return { data: newData, rows: state.rows + 1, ...pushHistory(state) };
    }),

    deleteRow: (index) => set((state) => {
        if (state.rows <= 1) return state;
        const targetIdx = index >= 0 ? index : (state.selection ? state.selection.start.row : -1);
        if (targetIdx < 0) return state;

        let deleteStart = targetIdx;
        let count = 1;

        if (state.selection && index === -1) {
            const start = Math.min(state.selection.start.row, state.selection.end.row);
            const end = Math.max(state.selection.start.row, state.selection.end.row);
            deleteStart = start;
            count = end - start + 1;
        } else if (index !== -1) {
            deleteStart = index;
        }

        const newData = state.data.filter((_, i) => i < deleteStart || i >= deleteStart + count);
        return { data: newData, rows: state.rows - count, selection: null, ...pushHistory(state) };
    }),

    addColumn: (index) => set((state) => {
        const insertIdx = index ?? (state.selection ? state.selection.end.col + 1 : state.cols);
        const newData = state.data.map(row => {
            const newRow = [...row];
            newRow.splice(insertIdx, 0, '');
            return newRow;
        });
        const newWidths = [...state.columnWidths];
        newWidths.splice(insertIdx, 0, DEFAULT_COL_WIDTH);
        const newAlignments = [...state.columnAlignments];
        newAlignments.splice(insertIdx, 0, 'left');
        return { data: newData, cols: state.cols + 1, columnWidths: newWidths, columnAlignments: newAlignments, ...pushHistory(state) };
    }),

    deleteColumn: (index) => set((state) => {
        if (state.cols <= 1) return state;

        let deleteStart = index;
        let count = 1;

        if (state.selection && index === -1) {
            const start = Math.min(state.selection.start.col, state.selection.end.col);
            const end = Math.max(state.selection.start.col, state.selection.end.col);
            deleteStart = start;
            count = end - start + 1;
        } else if (index !== -1) {
            deleteStart = index;
        }

        const newData = state.data.map(row => row.filter((_, i) => i < deleteStart || i >= deleteStart + count));
        const newWidths = state.columnWidths.filter((_, i) => i < deleteStart || i >= deleteStart + count);
        const newAlignments = state.columnAlignments.filter((_, i) => i < deleteStart || i >= deleteStart + count);
        return { data: newData, cols: state.cols - count, columnWidths: newWidths, columnAlignments: newAlignments, selection: null, ...pushHistory(state) };
    }),

    duplicateRow: (index) => set((state) => {
        const rowToCopy = [...state.data[index]];
        const newData = [...state.data];
        newData.splice(index + 1, 0, rowToCopy);
        return { data: newData, rows: state.rows + 1, ...pushHistory(state) };
    }),

    duplicateColumn: (index) => set((state) => {
        const newData = state.data.map(row => {
            const newRow = [...row];
            newRow.splice(index + 1, 0, row[index]);
            return newRow;
        });
        const newWidths = [...state.columnWidths];
        newWidths.splice(index + 1, 0, state.columnWidths[index] ?? DEFAULT_COL_WIDTH);
        const newAlignments = [...state.columnAlignments];
        newAlignments.splice(index + 1, 0, state.columnAlignments[index] ?? 'left');
        return { data: newData, cols: state.cols + 1, columnWidths: newWidths, columnAlignments: newAlignments, ...pushHistory(state) };
    }),

    setColumnWidth: (col, width) => set((state) => {
        const newWidths = [...state.columnWidths];
        newWidths[col] = Math.max(48, width); // min 48px
        return { columnWidths: newWidths };
    }),

    setColumnAlignment: (col, align) => set((state) => {
        const newAlignments = [...state.columnAlignments];
        newAlignments[col] = align;
        return { columnAlignments: newAlignments };
    }),

    moveSelection: (direction) => set((state) => {
        if (!state.selection) return { selection: { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } } };

        const { start } = state.selection;
        let newRow = start.row;
        let newCol = start.col;

        switch (direction) {
            case 'up': newRow = Math.max(0, start.row - 1); break;
            case 'down': newRow = Math.min(state.rows - 1, start.row + 1); break;
            case 'left': newCol = Math.max(0, start.col - 1); break;
            case 'right': newCol = Math.min(state.cols - 1, start.col + 1); break;
            case 'next':
                if (start.col < state.cols - 1) { newCol = start.col + 1; }
                else if (start.row < state.rows - 1) { newRow = start.row + 1; newCol = 0; }
                break;
            case 'prev':
                if (start.col > 0) { newCol = start.col - 1; }
                else if (start.row > 0) { newRow = start.row - 1; newCol = state.cols - 1; }
                break;
        }

        return { selection: { start: { row: newRow, col: newCol }, end: { row: newRow, col: newCol } } };
    }),

    fillRange: (targetRange) => set((state) => {
        if (!state.selection) return state;

        const sourceStart = state.selection.start;
        const sourceEnd = state.selection.end;
        const targetStart = targetRange.start;
        const targetEnd = targetRange.end;

        const newData = state.data.map(row => [...row]);

        const rMin = Math.min(sourceStart.row, sourceEnd.row);
        const rMax = Math.max(sourceStart.row, sourceEnd.row);
        const cMin = Math.min(sourceStart.col, sourceEnd.col);
        const cMax = Math.max(sourceStart.col, sourceEnd.col);

        const pRows = rMax - rMin + 1;
        const pCols = cMax - cMin + 1;

        const tRMin = Math.min(targetStart.row, targetEnd.row);
        const tRMax = Math.max(targetStart.row, targetEnd.row);
        const tCMin = Math.min(targetStart.col, targetEnd.col);
        const tCMax = Math.max(targetStart.col, targetEnd.col);

        for (let r = tRMin; r <= tRMax; r++) {
            for (let c = tCMin; c <= tCMax; c++) {
                const srcR = rMin + ((r - rMin) % pRows);
                const srcC = cMin + ((c - cMin) % pCols);
                newData[r][c] = state.data[srcR][srcC];
            }
        }

        return { data: newData, selection: targetRange, ...pushHistory(state) };
    }),

    applyFormatting: (format) => set((state) => {
        if (!state.selection) return state;

        const { start, end } = state.selection;
        const rMin = Math.min(start.row, end.row);
        const rMax = Math.max(start.row, end.row);
        const cMin = Math.min(start.col, end.col);
        const cMax = Math.max(start.col, end.col);

        const newData = state.data.map(row => [...row]);

        const patterns: Record<string, { p: string; len: number }> = {
            bold: { p: '\\*\\*', len: 2 },
            italic: { p: '_', len: 1 },
            strikethrough: { p: '~~', len: 2 },
            code: { p: '`', len: 1 },
        };

        const { p } = patterns[format];
        const regex = new RegExp(`^${p}(.*)${p}$`);

        let allFormatted = true;
        for (let r = rMin; r <= rMax; r++) {
            for (let c = cMin; c <= cMax; c++) {
                if (newData[r][c] && !regex.test(newData[r][c])) {
                    allFormatted = false;
                    break;
                }
            }
            if (!allFormatted) break;
        }

        for (let r = rMin; r <= rMax; r++) {
            for (let c = cMin; c <= cMax; c++) {
                const val = newData[r][c];
                if (!val) continue;

                if (allFormatted) {
                    const match = val.match(regex);
                    if (match) newData[r][c] = match[1];
                } else {
                    if (!regex.test(val)) {
                        const wrapper = format === 'bold' ? '**' : format === 'italic' ? '_' : format === 'strikethrough' ? '~~' : '`';
                        newData[r][c] = `${wrapper}${val}${wrapper}`;
                    }
                }
            }
        }

        return { data: newData, ...pushHistory(state) };
    }),

    deleteSelection: () => set((state) => {
        if (!state.selection) return state;

        const { start, end } = state.selection;
        const rMin = Math.min(start.row, end.row);
        const rMax = Math.max(start.row, end.row);
        const cMin = Math.min(start.col, end.col);
        const cMax = Math.max(start.col, end.col);

        const newData = state.data.map(row => [...row]);

        for (let r = rMin; r <= rMax; r++) {
            for (let c = cMin; c <= cMax; c++) {
                newData[r][c] = '';
            }
        }
        return { data: newData, ...pushHistory(state) };
    }),

    pasteData: (rows2d, startRow, startCol) => set((state) => {
        const pasteRows = rows2d.length;
        const pasteCols = rows2d.reduce((max, row) => Math.max(max, row.length), 0);

        const neededRows = startRow + pasteRows;
        const neededCols = startCol + pasteCols;

        let newData = state.data.map(row => [...row]);
        let currentRows = state.rows;
        let currentCols = state.cols;
        let newWidths = [...state.columnWidths];
        let newAlignments = [...state.columnAlignments];

        if (neededCols > currentCols) {
            const extraCols = neededCols - currentCols;
            newData = newData.map(row => [...row, ...Array(extraCols).fill('')]);
            newWidths = [...newWidths, ...Array(extraCols).fill(DEFAULT_COL_WIDTH)];
            newAlignments = [...newAlignments, ...Array<ColumnAlignment>(extraCols).fill('left')];
            currentCols = neededCols;
        }

        if (neededRows > currentRows) {
            const extraRows = neededRows - currentRows;
            const emptyRows = Array.from({ length: extraRows }, () => Array(currentCols).fill(''));
            newData = [...newData, ...emptyRows];
            currentRows = neededRows;
        }

        for (let r = 0; r < pasteRows; r++) {
            for (let c = 0; c < rows2d[r].length; c++) {
                newData[startRow + r][startCol + c] = rows2d[r][c];
            }
        }

        const newSelection = {
            start: { row: startRow, col: startCol },
            end: { row: startRow + pasteRows - 1, col: startCol + pasteCols - 1 }
        };

        return {
            data: newData,
            rows: currentRows,
            cols: currentCols,
            columnWidths: newWidths,
            columnAlignments: newAlignments,
            selection: newSelection,
            ...pushHistory(state)
        };
    }),

    undo: () => set((state) => {
        if (state.history.length === 0) return state;
        const previous = state.history[state.history.length - 1];
        const newHistory = state.history.slice(0, -1);
        return {
            data: previous,
            rows: previous.length,
            cols: previous[0]?.length ?? state.cols,
            history: newHistory,
            future: [state.data, ...state.future].slice(0, 50),
        };
    }),

    redo: () => set((state) => {
        if (state.future.length === 0) return state;
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
            data: next,
            rows: next.length,
            cols: next[0]?.length ?? state.cols,
            history: [...state.history, state.data].slice(-50),
            future: newFuture,
        };
    }),

    // Merge selected cells into plain text rows
    mergeCells: () => set((state) => {
        if (!state.selection) return state;

        const { start, end } = state.selection;
        const rMin = Math.min(start.row, end.row);
        const rMax = Math.max(start.row, end.row);
        const cMin = Math.min(start.col, end.col);
        const cMax = Math.max(start.col, end.col);

        const newData = state.data.map(row => [...row]);
        const newMergedRows = { ...state.mergedRows };

        for (let r = rMin; r <= rMax; r++) {
            // Collect all non-empty cell values from the selected columns in this row
            const parts: string[] = [];
            for (let c = cMin; c <= cMax; c++) {
                const val = newData[r][c];
                if (val && val.trim() !== '') parts.push(val.trim());
            }
            // Store merged text (join with space)
            newMergedRows[r] = parts.join(' ');
            // Clear the underlying cells so they don't double-render
            for (let c = 0; c < state.cols; c++) {
                newData[r][c] = '';
            }
        }

        return { data: newData, mergedRows: newMergedRows, selection: null, ...pushHistory(state) };
    }),

    // Unmerge a row: restore text to first cell, remove from mergedRows
    unmergeCells: (rowIndex) => set((state) => {
        if (!(rowIndex in state.mergedRows)) return state;

        const text = state.mergedRows[rowIndex];
        const newData = state.data.map(row => [...row]);
        newData[rowIndex][0] = text;

        const newMergedRows = { ...state.mergedRows };
        delete newMergedRows[rowIndex];

        return { data: newData, mergedRows: newMergedRows, ...pushHistory(state) };
    }),

    // Helper: check if a row is merged
    isMergedRow: (rowIndex): boolean => {
        return rowIndex in get().mergedRows;
    },

    // Apply a markdown heading level to a merged row
    applyMergedRowHeader: (rowIndex, level) => set((state) => {
        if (!(rowIndex in state.mergedRows)) return state;

        const currentText = state.mergedRows[rowIndex];
        // Strip any existing heading prefix
        const stripped = currentText.replace(/^#{1,6}\s*/, '');
        const prefix = '#'.repeat(level) + ' ';
        const newMergedRows = { ...state.mergedRows, [rowIndex]: prefix + stripped };
        return { mergedRows: newMergedRows, ...pushHistory(state) };
    }),

    // Remove heading prefix from a merged row
    removeMergedRowHeader: (rowIndex) => set((state) => {
        if (!(rowIndex in state.mergedRows)) return state;

        const currentText = state.mergedRows[rowIndex];
        const stripped = currentText.replace(/^#{1,6}\s*/, '');
        const newMergedRows = { ...state.mergedRows, [rowIndex]: stripped };
        return { mergedRows: newMergedRows, ...pushHistory(state) };
    }),
}));
