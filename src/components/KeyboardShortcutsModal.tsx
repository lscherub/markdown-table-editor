
import React, { useEffect } from 'react';
import { useGridStore } from '../store/gridStore';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
    { keys: ['Enter'], desc: 'Confirm & move down' },
    { keys: ['Tab'], desc: 'Move right' },
    { keys: ['Shift', 'Tab'], desc: 'Move left' },
    { keys: ['Shift', 'Enter'], desc: 'Move up' },
    { keys: ['Arrow keys'], desc: 'Navigate cells' },
    { keys: ['Double-click'], desc: 'Edit cell' },
    { keys: ['Delete / Backspace'], desc: 'Clear selected cell content' },
    { keys: ['Ctrl', 'C'], desc: 'Copy cells (TSV)' },
    { keys: ['Ctrl', 'V'], desc: 'Paste from Excel (auto-expands grid)' },
    { keys: ['Ctrl', 'Z'], desc: 'Undo' },
    { keys: ['Ctrl', 'Y'], desc: 'Redo' },
    { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo (alt)' },
    { keys: ['Ctrl', 'B'], desc: 'Bold' },
    { keys: ['Ctrl', 'I'], desc: 'Italic' },
    { keys: ['?'], desc: 'Show this help' },
    { keys: ['Esc'], desc: 'Close dialogs' },
];

export const KeyboardShortcutsModal: React.FC = () => {
    const show = useGridStore((s) => s.showShortcutsModal);
    const setShow = useGridStore((s) => s.setShowShortcutsModal);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && show) setShow(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, setShow]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShow(false)}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Keyboard size={18} className="text-blue-600" />
                        <h2 className="font-semibold text-base">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={() => setShow(false)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close keyboard shortcuts"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Shortcuts list */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto space-y-4">
                    <div className="space-y-1">
                        {shortcuts.map(({ keys, desc }, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5">
                                <span className="text-sm text-gray-600">{desc}</span>
                                <div className="flex items-center gap-1">
                                    {keys.map((k, ki) => (
                                        <React.Fragment key={ki}>
                                            {ki > 0 && <span className="text-gray-300 text-xs">+</span>}
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-gray-100 border border-gray-200 rounded text-gray-700 shadow-sm">
                                                {k}
                                            </kbd>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Help / Tips section 
                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-1.5 mb-2 text-blue-700">
                            <Info size={14} />
                            <span className="text-xs font-semibold uppercase tracking-wide">Tips</span>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-600">
                            <li className="flex gap-2">
                                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                                <span>
                                    <strong>Exporting without a selection exports the entire table.</strong> To export only specific rows or columns, select those cells first, then click <em>Export</em> or <em>Copy MD</em> — only the selected area will be exported.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                                <span>
                                    <strong>Delete entire rows or columns:</strong> Select multiple rows or columns (click & drag across row numbers or column headers), then use the toolbar <em>Delete Row</em> / <em>Delete Column</em> buttons or the right-click context menu to remove all selected rows or columns at once.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                                <span>
                                    <strong>Pasting larger data auto-expands the grid.</strong> If you paste an Excel table that is larger than the current grid, new rows and/or columns are added automatically to fit the pasted data.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                                <span>
                                    <strong>Add columns left or right:</strong> Use the toolbar buttons or right-click a cell to insert a column to the left or right of the selected column.
                                </span>
                            </li>
                        </ul>
                    </div> */}
                </div> 

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">Press <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded">?</kbd> anytime to show this</p>
                </div>
            </div>
        </div>
    );
};
