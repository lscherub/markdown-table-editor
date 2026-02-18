import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGridStore } from '../../store/gridStore';

interface CellProps {
    row: number;
    col: number;
    value: string;
}

export const Cell: React.FC<CellProps> = React.memo(({ row, col, value }) => {
    const isEditing = useGridStore((s) => s.editing && s.selection?.start.row === row && s.selection?.start.col === col);

    const setSelectionStart = useGridStore((s) => s.setSelectionStart);
    const setSelectionEnd = useGridStore((s) => s.setSelectionEnd);
    const setIsDragging = useGridStore((s) => s.setIsDragging);
    const isDragging = useGridStore((s) => s.isDragging);
    const isFilling = useGridStore((s) => s.isFilling);
    const setFillEnd = useGridStore((s) => s.setFillEnd);
    const setEditing = useGridStore((s) => s.setEditing);
    const setCellValue = useGridStore((s) => s.setCellValue);
    const setContextMenu = useGridStore((s) => s.setContextMenu);
    const alignment = useGridStore((s) => s.columnAlignments[col] ?? 'left');

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEditing && e.button === 0) {
            setSelectionStart(row, col);
            setIsDragging(true);
            setEditing(false);
        }
    };

    const handleMouseEnter = () => {
        if (isDragging) setSelectionEnd(row, col);
        if (isFilling) setFillEnd({ row, col });
    };

    const handleDoubleClick = () => {
        setSelectionStart(row, col);
        setEditing(true);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setSelectionStart(row, col);
        setContextMenu({ x: e.clientX, y: e.clientY, row, col });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCellValue(row, col, e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setCellValue(row, col, (e.target as HTMLInputElement).value ?? value);
            setEditing(false);
            useGridStore.getState().moveSelection('down');
            e.stopPropagation();
        }
        if (e.key === 'Escape') {
            setEditing(false);
            e.stopPropagation();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            setEditing(false);
            useGridStore.getState().moveSelection(e.shiftKey ? 'left' : 'right');
            e.stopPropagation();
        }
    };

    const alignClass = alignment === 'center' ? 'text-center justify-center' : alignment === 'right' ? 'text-right justify-end' : 'text-left justify-start';

    return (
        <div
            className={clsx(
                "border-r border-b border-gray-200 h-8 px-2 flex items-center text-sm relative select-none",
                !isEditing && "hover:bg-gray-50",
            )}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    className={clsx("w-full h-full absolute top-0 left-0 px-2 outline-none border-0 bg-white", alignClass)}
                    value={value}
                    onChange={handleChange}
                    onBlur={() => setEditing(false)}
                    onKeyDown={handleKeyDown}
                    aria-label={`Cell ${row + 1}-${col + 1}`}
                />
            ) : (
                <div className={clsx("w-full h-full overflow-hidden prose prose-xs max-w-none [&>p]:m-0 [&>p]:leading-normal flex items-center", alignClass)}>
                    {!value ? <span className="invisible">.</span> : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <p {...props} className="m-0 inline" />,
                                a: ({ node, ...props }) => <a {...props} className="text-blue-600 hover:underline" onClick={(e) => e.preventDefault()} />,
                            }}
                        >
                            {value}
                        </ReactMarkdown>
                    )}
                </div>
            )}
        </div>
    );
});
