import React, { useEffect } from 'react';
import { useGridStore } from '../store/gridStore';
import { X, HelpCircle, Download, Trash2, ClipboardPaste } from 'lucide-react';

const tips = [
    {
        icon: <Download size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />,
        title: 'Exporting a selection vs. the whole table',
        body: (
            <>
                By default, <strong>Export</strong> and <strong>Copy MD</strong> export the <em>entire table</em>.
                To export only specific rows or columns, <strong>select those cells first</strong> (click and drag across cells),
                then click <em>Export</em> or <em>Copy MD</em> — only the selected area will be exported.
                The Export button label changes to <em>"Export Selection"</em> when a multi-cell selection is active.
            </>
        ),
    },
    {
        icon: <Trash2 size={16} className="text-red-500 flex-shrink-0 mt-0.5" />,
        title: 'Deleting multiple rows or columns at once',
        body: (
            <>
                Click a <strong>row number</strong> on the left to select the entire row, or click a <strong>column header</strong> (A, B, C…) to select the entire column.
                Drag across multiple row numbers or column headers to select several at once and press{' '}
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded font-mono">Delete</kbd> to remove all selected rows or columns in one action. 
                <br/> <br/>
                <em>Toolbar Delete Row/Delete Column buttons only works on single row/column.</em>
            </>
        ),
    },
    {
        icon: <ClipboardPaste size={16} className="text-green-500 flex-shrink-0 mt-0.5" />,
        title: 'Pasting larger data auto-expands the grid',
        body: (
            <>
                When you paste an Excel table (Ctrl+V) that is <strong>larger than the current grid</strong>,
                the app automatically adds the necessary rows and/or columns to fit the pasted data — no manual resizing needed.
            </>
        ),
    },
    {/* {
        icon: <PanelLeftOpen size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />,
        title: 'Adding columns to the left or right',
        body: (
            <>
                Use the toolbar <strong>Insert Column Left</strong> or <strong>Insert Column Right</strong> buttons to add a column on either side of the currently selected column.
                You can also right-click any cell and choose <em>Insert Column Left</em> or <em>Insert Column Right</em> from the context menu.
            </>
        ),
    },*/}
];

export const HelpModal: React.FC = () => {
    const show = useGridStore((s) => s.showHelpModal);
    const setShow = useGridStore((s) => s.setShowHelpModal);

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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-800">
                        <HelpCircle size={18} className="text-blue-600" />
                        <h2 className="font-semibold text-base">Help & Tips</h2>
                    </div>
                    <button
                        onClick={() => setShow(false)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close help"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tips list */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto space-y-5">
                    {tips.map(({ icon, title, body }, i) => (
                        <div key={i} className="flex gap-3">
                            {icon}
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
                                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                        Press <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded">?</kbd> for keyboard shortcuts
                    </p>
                </div>
            </div>
        </div>
    );
};
