import React, { useRef, useState } from 'react';
import {
    Trash2, Download, Copy, Upload, Bold, Italic, Code, Strikethrough,
    FilePlus, Heading, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight,
    CopyPlus, ArrowUpFromLine, ArrowDownFromLine, Undo2, Redo2, Keyboard, Merge,
    HelpCircle, ArrowLeftToLine, ArrowRightToLine, X
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useGridStore } from '../../store/gridStore';
import type { HeaderLevel } from '../../store/gridStore';
import { parseMarkdownFull, gridToMarkdown } from '../../utils/markdownGenerator';

export const Toolbar: React.FC = () => {
    const {
        addRow, deleteRow, addColumn, deleteColumn,
        selection, setData, data, rows, cols,
        applyFormatting, setShowNewSheetModal,
        previewMode, setPreviewMode,
        duplicateRow, duplicateColumn,
        setColumnAlignment, columnAlignments,
        undo, redo, history, future,
        setShowShortcutsModal, setShowHelpModal,
        mergeCells, mergedRows,
        applyMergedRowHeader, removeMergedRowHeader,
    } = useGridStore(useShallow((state) => ({
        addRow: state.addRow,
        deleteRow: state.deleteRow,
        addColumn: state.addColumn,
        deleteColumn: state.deleteColumn,
        selection: state.selection,
        setData: state.setData,
        data: state.data,
        rows: state.rows,
        cols: state.cols,
        applyFormatting: state.applyFormatting,
        setShowNewSheetModal: state.setShowNewSheetModal,
        previewMode: state.previewMode,
        setPreviewMode: state.setPreviewMode,
        duplicateRow: state.duplicateRow,
        duplicateColumn: state.duplicateColumn,
        setColumnAlignment: state.setColumnAlignment,
        columnAlignments: state.columnAlignments,
        undo: state.undo,
        redo: state.redo,
        history: state.history,
        future: state.future,
        setShowShortcutsModal: state.setShowShortcutsModal,
        setShowHelpModal: state.setShowHelpModal,
        mergeCells: state.mergeCells,
        mergedRows: state.mergedRows,
        applyMergedRowHeader: state.applyMergedRowHeader,
        removeMergedRowHeader: state.removeMergedRowHeader,
    })));

    const selectionStart = selection?.start;
    const selectedCol = selectionStart?.col;
    const currentAlignment = selectedCol !== undefined ? (columnAlignments[selectedCol] ?? 'left') : 'left';

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Header picker popover state
    const [showHeaderPicker, setShowHeaderPicker] = useState(false);
    const headerBtnRef = useRef<HTMLDivElement>(null);

    // Determine if the currently selected row is a merged row
    const selectedRowIndex = selectionStart?.row;
    const selectedRowIsMerged = selectedRowIndex !== undefined && selectedRowIndex in mergedRows;

    // Detect current heading level of the selected merged row (if any)
    const currentMergedText = selectedRowIsMerged && selectedRowIndex !== undefined
        ? mergedRows[selectedRowIndex]
        : '';
    const currentHeadingLevel: HeaderLevel | 0 = (() => {
        const m = currentMergedText.match(/^(#{1,3})\s/);
        if (!m) return 0;
        return m[1].length as HeaderLevel;
    })();

    const stats = React.useMemo(() => {
        if (!selection) return null;
        const { start, end } = selection;
        const nums: number[] = [];
        const rMin = Math.min(start.row, end.row), rMax = Math.max(start.row, end.row);
        const cMin = Math.min(start.col, end.col), cMax = Math.max(start.col, end.col);
        for (let r = rMin; r <= rMax; r++) {
            for (let c = cMin; c <= cMax; c++) {
                const val = parseFloat(data[r][c]);
                if (!isNaN(val)) nums.push(val);
            }
        }
        if (nums.length === 0) return { count: 0, sum: 0, avg: 0 };
        const sum = nums.reduce((a, b) => a + b, 0);
        return { count: nums.length, sum: Number(sum.toFixed(2)), avg: Number((sum / nums.length).toFixed(2)) };
    }, [selection, data]);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                const parsed = parseMarkdownFull(text);
                if (parsed.grid.length > 0) {
                    setData(parsed.grid, parsed.mergedRows, parsed.columnAlignments);
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleCopy = () => {
        const md = gridToMarkdown(data, rows, cols, columnAlignments, mergedRows, selection);
        navigator.clipboard.writeText(md);
    };

    const handleDownload = () => {
        const md = gridToMarkdown(data, rows, cols, columnAlignments, mergedRows, selection);
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'table.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleHeaderLevel = (level: HeaderLevel) => {
        if (selectedRowIndex === undefined) return;
        if (currentHeadingLevel === level) {
            // Toggle off: remove heading
            removeMergedRowHeader(selectedRowIndex);
        } else {
            applyMergedRowHeader(selectedRowIndex, level);
        }
        setShowHeaderPicker(false);
    };

    const Btn: React.FC<{ onClick: () => void; title: string; disabled?: boolean; children: React.ReactNode; active?: boolean; danger?: boolean }> =
        ({ onClick, title, disabled, children, active, danger }) => (
            <button
                onClick={onClick}
                disabled={disabled}
                title={title}
                className={`p-1.5 rounded text-gray-700 disabled:opacity-30 transition-colors
                    ${active ? 'bg-blue-100 text-blue-700' : danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-gray-100'}`}
            >
                {children}
            </button>
        );

    const Sep = () => <div className="w-px h-5 bg-gray-200 mx-0.5 self-center flex-shrink-0" />;

    return (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-white flex-wrap">

            {/* New Sheet */}
            <button
                onClick={() => setShowNewSheetModal(true)}
                className="p-1.5 hover:bg-blue-50 text-blue-700 rounded flex items-center gap-1 mr-1"
                title="New Sheet"
            >
                <FilePlus size={15} />
                <span className="text-xs font-semibold">New</span>
            </button>
            <Sep />

            {/* Undo / Redo */}
            <Btn onClick={undo} title="Undo (Ctrl+Z)" disabled={history.length === 0}><Undo2 size={15} /></Btn>
            <Btn onClick={redo} title="Redo (Ctrl+Y)" disabled={future.length === 0}><Redo2 size={15} /></Btn>
            <Sep />

            {/* Row actions */}
            <Btn onClick={() => addRow(selectionStart?.row)} title="Insert Row Above"><ArrowUpFromLine size={15} /></Btn>
            <Btn onClick={() => addRow((selectionStart?.row ?? -1) + 1)} title="Insert Row Below"><ArrowDownFromLine size={15} /></Btn>
            <Btn onClick={() => selectionStart && duplicateRow(selectionStart.row)} title="Duplicate Row" disabled={!selection}><CopyPlus size={15} /></Btn>
            <Btn onClick={() => deleteRow(selectionStart ? selectionStart.row : -1)} title="Delete Row" disabled={!selection} danger><Trash2 size={15} /></Btn>
            <Sep />

            {/* Column actions */}
            <Btn onClick={() => addColumn(selectionStart?.col)} title="Insert Column Left"><ArrowLeftToLine size={15} /></Btn>
            <Btn onClick={() => addColumn((selectionStart?.col ?? -1) + 1)} title="Insert Column Right"><ArrowRightToLine size={15} /></Btn>
            <Btn onClick={() => selectionStart && duplicateColumn(selectionStart.col)} title="Duplicate Column" disabled={!selection}><CopyPlus size={15} className="rotate-90" /></Btn>
            <Btn onClick={() => deleteColumn(selectionStart ? selectionStart.col : -1)} title="Delete Column" disabled={!selection} danger><Trash2 size={15} /></Btn>
            <Sep />

            {/* Formatting */}
            <Btn onClick={() => applyFormatting('bold')} title="Bold (Ctrl+B)" disabled={selectedRowIsMerged}><Bold size={15} /></Btn>
            <Btn onClick={() => applyFormatting('italic')} title="Italic (Ctrl+I)" disabled={selectedRowIsMerged}><Italic size={15} /></Btn>
            <Btn onClick={() => applyFormatting('strikethrough')} title="Strikethrough" disabled={selectedRowIsMerged}><Strikethrough size={15} /></Btn>
            <Btn onClick={() => applyFormatting('code')} title="Inline Code" disabled={selectedRowIsMerged}><Code size={15} /></Btn>

            {/* Header button — only active/enabled for merged rows */}
            <div className="relative" ref={headerBtnRef}>
                <button
                    onClick={() => {
                        if (selectedRowIsMerged) setShowHeaderPicker(v => !v);
                    }}
                    disabled={!selectedRowIsMerged}
                    title={selectedRowIsMerged ? "Set heading level for this merged row" : "Select a merged row to use heading"}
                    className={`p-1.5 rounded transition-colors disabled:opacity-30
                        ${selectedRowIsMerged && currentHeadingLevel > 0
                            ? 'bg-blue-100 text-blue-700'
                            : selectedRowIsMerged
                                ? 'text-gray-700 hover:bg-gray-100'
                                : 'text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <Heading size={15} />
                </button>

                {/* Header level picker popover */}
                {showHeaderPicker && selectedRowIsMerged && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[160px]">
                        <div className="flex items-center justify-between mb-1.5 px-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Heading Level</span>
                            <button
                                onClick={() => setShowHeaderPicker(false)}
                                className="p-0.5 hover:bg-gray-100 rounded text-gray-400"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        {([1, 2, 3] as HeaderLevel[]).map((level) => {
                            const labels = { 1: 'H1 — #', 2: 'H2 — ##', 3: 'H3 — ###' };
                            const sizes = { 1: 'text-base font-bold', 2: 'text-sm font-bold', 3: 'text-xs font-bold' };
                            const isActive = currentHeadingLevel === level;
                            return (
                                <button
                                    key={level}
                                    onClick={() => handleHeaderLevel(level)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors
                                        ${isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <span className={`font-mono ${sizes[level]}`}>{'#'.repeat(level)}</span>
                                    <span className="text-xs text-gray-500">{labels[level]}</span>
                                    {isActive && (
                                        <span className="ml-auto text-xs text-blue-500 font-medium">✓ active</span>
                                    )}
                                </button>
                            );
                        })}
                        {currentHeadingLevel > 0 && (
                            <>
                                <div className="border-t border-gray-100 my-1.5" />
                                <button
                                    onClick={() => {
                                        if (selectedRowIndex !== undefined) removeMergedRowHeader(selectedRowIndex);
                                        setShowHeaderPicker(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-red-50 text-red-600 transition-colors text-xs"
                                >
                                    <X size={12} />
                                    Remove heading
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <Sep />

            {/* Alignment */}
            <Btn
                onClick={() => selectedCol !== undefined && setColumnAlignment(selectedCol, 'left')}
                title="Align Left"
                disabled={selectedCol === undefined}
                active={currentAlignment === 'left'}
            ><AlignLeft size={15} /></Btn>
            <Btn
                onClick={() => selectedCol !== undefined && setColumnAlignment(selectedCol, 'center')}
                title="Align Center"
                disabled={selectedCol === undefined}
                active={currentAlignment === 'center'}
            ><AlignCenter size={15} /></Btn>
            <Btn
                onClick={() => selectedCol !== undefined && setColumnAlignment(selectedCol, 'right')}
                title="Align Right"
                disabled={selectedCol === undefined}
                active={currentAlignment === 'right'}
            ><AlignRight size={15} /></Btn>

            <Sep />

            {/* Merge to text line */}
            {(() => {
                const hasMultiSelection = selection
                    ? (Math.abs(selection.start.row - selection.end.row) > 0 ||
                       Math.abs(selection.start.col - selection.end.col) > 0)
                    : false;
                return selectedRowIsMerged ? (
                    <Btn
                        onClick={() => selectedRowIndex !== undefined && useGridStore.getState().unmergeCells(selectedRowIndex)}
                        title="Unmerge Row (restore to table cells)"
                        active
                    >
                        <Merge size={15} />
                    </Btn>
                ) : (
                    <Btn
                        onClick={mergeCells}
                        title="Merge selected cells into a plain text line"
                        disabled={!hasMultiSelection}
                    >
                        <Merge size={15} />
                    </Btn>
                );
            })()}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Stats */}
            {stats && stats.count > 1 && (
                <div className="flex space-x-3 text-xs text-gray-600 font-medium px-2 border-r border-gray-200">
                    <span title="Count">Count: {stats.count}</span>
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigator.clipboard.writeText(stats.sum.toString())} title="Click to Copy Sum">Sum: {stats.sum}</span>
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigator.clipboard.writeText(stats.avg.toString())} title="Click to Copy Avg">Avg: {stats.avg}</span>
                </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} className="hidden" accept=".md,.txt" onChange={handleImport} aria-label="Import Markdown" />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                    <Upload size={13} /><span>Import</span>
                </button>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                    <Copy size={13} /><span>Copy MD</span>
                </button>
                <button
                    onClick={handleDownload}
                    title={selection && (Math.abs(selection.start.row - selection.end.row) > 0 || Math.abs(selection.start.col - selection.end.col) > 0)
                        ? "Export selected area only"
                        : "Export entire table (select cells to export a specific area)"}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-gray-900 hover:bg-black rounded"
                >
                    <Download size={13} />
                    <span>
                        {selection && (Math.abs(selection.start.row - selection.end.row) > 0 || Math.abs(selection.start.col - selection.end.col) > 0)
                            ? "Export Selection"
                            : "Export"}
                    </span>
                </button>
                <Sep />
                <button
                    onClick={() => setShowShortcutsModal(true)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    title="Keyboard Shortcuts (?)"
                >
                    <Keyboard size={15} />
                </button>
                <button
                    onClick={() => setShowHelpModal(true)}
                    className="p-1.5 rounded hover:bg-gray-100 text-blue-500"
                    title="Help & Tips"
                >
                    <HelpCircle size={15} />
                </button>
                <button
                    onClick={() => setPreviewMode(previewMode === 'hidden' ? 'docked' : 'hidden')}
                    className={`p-1.5 rounded flex items-center gap-1 ${previewMode !== 'hidden' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                    title={previewMode === 'hidden' ? "Show Preview" : "Hide Preview"}
                >
                    {previewMode === 'hidden' ? <Eye size={15} /> : <EyeOff size={15} />}
                    <span className="text-xs font-semibold">{previewMode === 'hidden' ? 'Preview' : 'Hide'}</span>
                </button>
            </div>

            {/* Click-outside handler for header picker */}
            {showHeaderPicker && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHeaderPicker(false)}
                />
            )}
        </div>
    );
};
