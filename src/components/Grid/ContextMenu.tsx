
import React, { useEffect, useRef } from 'react';
import { useGridStore } from '../../store/gridStore';
import {
    Scissors, Copy, Clipboard, Trash2, CopyPlus,
    ArrowUpFromLine, ArrowDownFromLine, Columns2, Merge, Ungroup,
    ArrowLeftToLine, ArrowRightToLine
} from 'lucide-react';

export const ContextMenu: React.FC = () => {
    const contextMenu = useGridStore((s) => s.contextMenu);
    const setContextMenu = useGridStore((s) => s.setContextMenu);
    const selection = useGridStore((s) => s.selection);
    const mergedRows = useGridStore((s) => s.mergedRows);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setContextMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [setContextMenu]);

    if (!contextMenu) return null;

    const { row, col } = contextMenu;

    const store = useGridStore.getState();

    const close = () => setContextMenu(null);

    const handleCut = () => {
        const state = useGridStore.getState();
        if (!state.selection) return close();
        const { start, end } = state.selection;
        const rMin = Math.min(start.row, end.row), rMax = Math.max(start.row, end.row);
        const cMin = Math.min(start.col, end.col), cMax = Math.max(start.col, end.col);
        const tsv = state.data.slice(rMin, rMax + 1).map(r => r.slice(cMin, cMax + 1).join('\t')).join('\n');
        navigator.clipboard.writeText(tsv).catch(() => { });
        state.deleteSelection();
        close();
    };

    const handleCopy = () => {
        const state = useGridStore.getState();
        if (!state.selection) return close();
        const { start, end } = state.selection;
        const rMin = Math.min(start.row, end.row), rMax = Math.max(start.row, end.row);
        const cMin = Math.min(start.col, end.col), cMax = Math.max(start.col, end.col);
        const tsv = state.data.slice(rMin, rMax + 1).map(r => r.slice(cMin, cMax + 1).join('\t')).join('\n');
        navigator.clipboard.writeText(tsv).catch(() => { });
        close();
    };

    const handlePaste = () => {
        navigator.clipboard.readText().then((text) => {
            if (!text) return;
            const rawRows = text.replace(/\r\n$/, '').replace(/\n$/, '').split(/\r?\n/);
            const parsed = rawRows.map(r => r.split('\t'));
            store.pasteData(parsed, row, col);
        }).catch(() => { });
        close();
    };

    const handleDeleteRow = () => { store.deleteRow(row); close(); };
    const handleDeleteCol = () => { store.deleteColumn(col); close(); };
    const handleInsertAbove = () => { store.addRow(row); close(); };
    const handleInsertBelow = () => { store.addRow(row + 1); close(); };
    const handleInsertColLeft = () => { store.addColumn(col); close(); };
    const handleInsertColRight = () => { store.addColumn(col + 1); close(); };
    const handleDuplicateRow = () => { store.duplicateRow(row); close(); };
    const handleDuplicateCol = () => { store.duplicateColumn(col); close(); };

    const handleMerge = () => { store.mergeCells(); close(); };
    const handleUnmerge = () => { store.unmergeCells(row); close(); };

    // Determine if the right-clicked row is already merged
    const isRowMerged = row in mergedRows;

    // Determine if there's a multi-cell selection (merge makes sense)
    const hasMultiSelection = selection
        ? (Math.abs(selection.start.row - selection.end.row) > 0 ||
           Math.abs(selection.start.col - selection.end.col) > 0)
        : false;

    // Clamp position to viewport
    const menuWidth = 200;
    const menuHeight = 380;
    const x = Math.min(contextMenu.x, window.innerWidth - menuWidth - 8);
    const y = Math.min(contextMenu.y, window.innerHeight - menuHeight - 8);

    const Item: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }> = ({ icon, label, onClick, danger, disabled }) => (
        <button
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left rounded transition-colors
                ${disabled ? 'opacity-40 cursor-not-allowed text-gray-400' : danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            <span className="opacity-60">{icon}</span>
            {label}
        </button>
    );

    const Divider = () => <div className="my-1 border-t border-gray-100" />;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 w-48"
            style={{ left: x, top: y }}
        >
            <Item icon={<Scissors size={14} />} label="Cut" onClick={handleCut} />
            <Item icon={<Copy size={14} />} label="Copy" onClick={handleCopy} />
            <Item icon={<Clipboard size={14} />} label="Paste" onClick={handlePaste} />
            <Divider />
            <Item icon={<ArrowUpFromLine size={14} />} label="Insert Row Above" onClick={handleInsertAbove} />
            <Item icon={<ArrowDownFromLine size={14} />} label="Insert Row Below" onClick={handleInsertBelow} />
            <Item icon={<CopyPlus size={14} />} label="Duplicate Row" onClick={handleDuplicateRow} />
            <Item icon={<Trash2 size={14} />} label="Delete Row" onClick={handleDeleteRow} danger />
            <Divider />
            <Item icon={<ArrowLeftToLine size={14} />} label="Insert Column Left" onClick={handleInsertColLeft} />
            <Item icon={<ArrowRightToLine size={14} />} label="Insert Column Right" onClick={handleInsertColRight} />
            <Item icon={<Columns2 size={14} />} label="Duplicate Column" onClick={handleDuplicateCol} />
            <Item icon={<Trash2 size={14} />} label="Delete Column" onClick={handleDeleteCol} danger />
            <Divider />
            {isRowMerged ? (
                <Item icon={<Ungroup size={14} />} label="Unmerge Row" onClick={handleUnmerge} />
            ) : (
                <Item
                    icon={<Merge size={14} />}
                    label="Merge to Text Line"
                    onClick={handleMerge}
                    disabled={!hasMultiSelection}
                />
            )}
        </div>
    );
};
