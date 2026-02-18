import React, { useEffect, useRef, useState } from 'react';
import { useGridStore } from '../../store/gridStore';
import { useShallow } from 'zustand/react/shallow';
import { Maximize2, Minimize2, Move, X } from 'lucide-react';
import { gridToMarkdown } from '../../utils/markdownGenerator';

export const Preview: React.FC = () => {
    const { data, rows, cols, mode, rect, setRect, setMode, columnAlignments, mergedRows } = useGridStore(useShallow((state) => ({
        data: state.data,
        rows: state.rows,
        cols: state.cols,
        mode: state.previewMode,
        rect: state.previewRect,
        setRect: state.setPreviewRect,
        setMode: state.setPreviewMode,
        columnAlignments: state.columnAlignments,
        mergedRows: state.mergedRows,
    })));

    const markdown = gridToMarkdown(data, rows, cols, columnAlignments, mergedRows);

    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
    const hasInitializedMobileDefault = useRef(false);

    // Drag/Resize State
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isMobile && mode === 'floating') {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - rect.x,
                y: e.clientY - rect.y
            });
        }
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (isMobile) return;
        e.stopPropagation();
        setIsResizing(true);
    };

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

        setIsMobile(mediaQuery.matches);
        mediaQuery.addEventListener('change', onChange);
        return () => mediaQuery.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            hasInitializedMobileDefault.current = false;
            return;
        }

        if (!hasInitializedMobileDefault.current) {
            hasInitializedMobileDefault.current = true;
            setMode('hidden');
        }
    }, [isMobile, setMode]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setRect({ ...rect, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
            }
            if (isResizing) {
                setRect({ ...rect, width: Math.max(200, e.clientX - rect.x), height: Math.max(200, e.clientY - rect.y) });
            }
        };
        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (!isMobile && (isDragging || isResizing)) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, rect, dragOffset, setRect, isMobile]);

    if (isMobile) {
        const isOpen = mode !== 'hidden';

        return (
            <div
                className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
                style={{ minHeight: 220, height: '40vh', maxHeight: '60vh' }}
            >
                <div className="h-full bg-white border-t border-gray-200 rounded-t-xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b bg-gray-50 sticky top-0 z-10">
                        <span className="font-semibold text-sm text-gray-700">Live Preview</span>
                        <button
                            onClick={() => setMode('hidden')}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                            title="Close"
                            aria-label="Close live preview"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-0 bg-gray-50">
                        <textarea
                            className="w-full h-full p-4 font-mono text-xs text-gray-800 bg-gray-50 border-0 outline-none resize-none"
                            value={markdown}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const style: React.CSSProperties = mode === 'floating' ? {
        position: 'fixed',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: 50
    } : {
        height: '100%',
        width: rect.width, // Use stored width
        minWidth: 200,
        maxWidth: '80vw'
    };

    if (mode === 'hidden') return null;

    return (
        <div
            className={`bg-white border-l border-gray-200 flex flex-col shadow-lg ${mode === 'floating' ? 'rounded-lg border' : 'relative'}`}
            style={style}
        >
            {/* Docked Resize Handle (Left) */}
            {mode === 'docked' && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-10"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startWidth = rect.width;

                        const handleMouseMove = (ev: MouseEvent) => {
                            const delta = startX - ev.clientX;
                            setRect({ ...rect, width: Math.max(200, startWidth + delta) });
                        };
                        const handleMouseUp = () => {
                            window.removeEventListener('mousemove', handleMouseMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                        };
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                    }}
                />
            )}

            <div
                className={`flex items-center justify-between p-2 border-b bg-gray-50 ${mode === 'floating' ? 'cursor-move' : ''}`}
                onMouseDown={handleMouseDown}
            >
                <span className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                    {mode === 'floating' && <Move size={14} />}
                    Live Preview
                </span>
                <div className="flex space-x-1" onMouseDown={e => e.stopPropagation()}>
                    <button onClick={() => setMode(mode === 'docked' ? 'floating' : 'docked')} className="p-1 hover:bg-gray-200 rounded" title={mode === 'docked' ? "Float" : "Dock"}>
                        {mode === 'docked' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                    <button onClick={() => setMode('hidden')} className="p-1 hover:bg-red-100 text-red-600 rounded" title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-0 bg-gray-50">
                <textarea
                    className="w-full h-full p-4 font-mono text-xs text-gray-800 bg-gray-50 border-0 outline-none resize-none"
                    value={markdown}
                    readOnly
                    spellCheck={false}
                />
            </div>

            {mode === 'floating' && (
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 rounded-tl"
                    onMouseDown={handleResizeMouseDown}
                />
            )}
        </div>
    );
};
