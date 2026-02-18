import type { GridData } from '../store/gridStore';
import type { ColumnAlignment, SelectionRange } from '../store/gridStore';

export const gridToMarkdown = (
    data: GridData,
    rows: number,
    cols: number,
    columnAlignments?: ColumnAlignment[],
    mergedRows?: Record<number, string>,
    selection?: SelectionRange | null
): string => {
    // If there is an active selection, export only the selected rows and columns
    if (selection) {
        const rMin = Math.min(selection.start.row, selection.end.row);
        const rMax = Math.max(selection.start.row, selection.end.row);
        const cMin = Math.min(selection.start.col, selection.end.col);
        const cMax = Math.max(selection.start.col, selection.end.col);

        // Only export if the selection spans more than a single cell
        const isMultiCell = rMax > rMin || cMax > cMin;
        if (isMultiCell) {
            const selRows = rMax - rMin + 1;
            const selCols = cMax - cMin + 1;

            // Slice alignments to selected columns
            const selAlignments = columnAlignments
                ? columnAlignments.slice(cMin, cMax + 1)
                : undefined;

            // Build a sub-grid from the selected range (skip merged rows)
            const subData: GridData = [];
            const subMergedRows: Record<number, string> = {};
            let subRowIdx = 0;
            for (let r = rMin; r <= rMax; r++) {
                if (mergedRows && r in mergedRows) {
                    subMergedRows[subRowIdx] = mergedRows[r];
                    subData.push(Array(selCols).fill(''));
                } else {
                    subData.push(data[r].slice(cMin, cMax + 1));
                }
                subRowIdx++;
            }

            return gridToMarkdown(subData, selRows, selCols, selAlignments, subMergedRows);
        }
    }

    // 1. Calculate max width for each column (only from non-merged rows)
    const colWidths = new Array(cols).fill(3);

    for (let r = 0; r < rows; r++) {
        if (mergedRows && r in mergedRows) continue; // skip merged rows for width calc
        for (let c = 0; c < cols; c++) {
            const cell = data[r][c] || '';
            const content = cell.replace(/\|/g, '\\|');
            if (content.length > colWidths[c]) {
                colWidths[c] = content.length;
            }
        }
    }

    const pad = (str: string, width: number) => str + ' '.repeat(Math.max(0, width - str.length));

    let md = '';
    let tableOpen = false; // tracks whether we're currently inside a table block

    const flushTableHeader = (headerRowIndex: number) => {
        // Header Row
        const headerRowContent = data[headerRowIndex] || [];
        md += '| ' + Array.from({ length: cols }).map((_, c) => {
            const cell = headerRowContent[c] || '';
            const content = cell.replace(/\|/g, '\\|');
            return pad(content, colWidths[c]);
        }).join(' | ') + ' |\n';

        // Separator Row — respects column alignment
        md += '|' + Array.from({ length: cols }).map((_, c) => {
            const align = columnAlignments?.[c] ?? 'left';
            const dashes = '-'.repeat(Math.max(1, colWidths[c]));
            if (align === 'center') return `:${dashes}:`;
            if (align === 'right') return `${dashes}:`;
            return `-${dashes}-`; // left (default)
        }).join('|') + '|\n';
    };

    for (let r = 0; r < rows; r++) {
        // Check if this row is a merged (plain text) row
        if (mergedRows && r in mergedRows) {
            // If we were in a table, close it (no explicit close needed in MD, just stop)
            tableOpen = false;
            // Ensure a blank line before merged/plain-text rows
            if (!md.endsWith('\n\n')) {
                md += '\n';
            }
            // Output merged/plain-text row
            md += mergedRows[r] + '\n\n';
            continue;
        }

        // This is a normal table row
        if (!tableOpen) {
            // If table starts after plain text / merged content, keep a blank line before table block
            if (md.length > 0 && !md.endsWith('\n\n')) {
                md += '\n';
            }
            // Start a new table: emit header + separator using this row as header
            flushTableHeader(r);
            tableOpen = true;
            // The header row itself was already emitted by flushTableHeader
            continue;
        }

        // Regular data row
        md += '| ' + Array.from({ length: cols }).map((_, c) => {
            const cell = data[r][c] || '';
            const content = cell.replace(/\|/g, '\\|');
            return pad(content, colWidths[c]);
        }).join(' | ') + ' |\n';
    }

    return md;
};

export interface ParsedMarkdown {
    grid: GridData;
    mergedRows: Record<number, string>;
    columnAlignments: ColumnAlignment[];
    cols: number;
}

/**
 * Parses a markdown string back into grid data, preserving:
 * - Table rows (split by |)
 * - Merged/plain-text rows (non-table lines like headings, paragraphs)
 * - Column alignments (from separator row)
 */
export const parseMarkdownToGrid = (markdown: string): GridData => {
    return parseMarkdownFull(markdown).grid;
};

export const parseMarkdownFull = (markdown: string): ParsedMarkdown => {
    const rawLines = markdown.split('\n');

    // Filter out completely blank lines but keep track of original indices
    const lines = rawLines.filter(line => line.trim() !== '');

    if (lines.length === 0) {
        return { grid: [['']], mergedRows: {}, columnAlignments: ['left'], cols: 1 };
    }

    // Detect if a line is a markdown table row (starts and/or ends with |, or contains |)
    const isTableRow = (line: string) => {
        const t = line.trim();
        return t.startsWith('|') || (t.includes('|') && !t.startsWith('#'));
    };

    // Detect separator row: only contains |, -, :, spaces
    const isSeparatorRow = (line: string) => /^[\s\|\-\:]+$/.test(line.trim());

    // Parse a table row into cells
    const splitTableRow = (line: string): string[] => {
        let content = line.trim();
        if (content.startsWith('|')) content = content.substring(1);
        if (content.endsWith('|')) content = content.substring(0, content.length - 1);
        return content.split('|').map(cell => cell.trim().replace(/\\\|/g, '|'));
    };

    // Parse column alignments from a separator row
    const parseSeparatorAlignments = (line: string): ColumnAlignment[] => {
        let content = line.trim();
        if (content.startsWith('|')) content = content.substring(1);
        if (content.endsWith('|')) content = content.substring(0, content.length - 1);
        return content.split('|').map(cell => {
            const c = cell.trim();
            if (c.startsWith(':') && c.endsWith(':')) return 'center';
            if (c.endsWith(':')) return 'right';
            return 'left';
        });
    };

    // First pass: determine the maximum number of columns from table rows
    let maxCols = 1;
    for (const line of lines) {
        if (isTableRow(line) && !isSeparatorRow(line)) {
            const cells = splitTableRow(line);
            if (cells.length > maxCols) maxCols = cells.length;
        }
    }

    const grid: GridData = [];
    const mergedRows: Record<number, string> = {};
    let columnAlignments: ColumnAlignment[] = Array(maxCols).fill('left');

    // Second pass: build grid row by row
    // We skip separator rows (they only carry alignment info)
    let gridRowIndex = 0;
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (isSeparatorRow(line)) {
            // Extract alignment info but don't add a grid row
            const aligns = parseSeparatorAlignments(line);
            // Merge alignments: only update columns that were parsed
            aligns.forEach((a, idx) => {
                if (idx < maxCols) columnAlignments[idx] = a;
            });
            i++;
            continue;
        }

        if (isTableRow(line)) {
            // Normal table row
            const cells = splitTableRow(line);
            // Pad to maxCols
            while (cells.length < maxCols) cells.push('');
            grid.push(cells.slice(0, maxCols));
            gridRowIndex++;
        } else {
            // Plain text / merged row (heading, paragraph, etc.)
            const text = line.trim();
            mergedRows[gridRowIndex] = text;
            // Push an empty row as placeholder so row indices stay consistent
            grid.push(Array(maxCols).fill(''));
            gridRowIndex++;
        }

        i++;
    }

    return {
        grid,
        mergedRows,
        columnAlignments,
        cols: maxCols,
    };
};
