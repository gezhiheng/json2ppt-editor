import { type CSSProperties } from 'react';
import type { SlideElement } from '../types';

type TableCellData = NonNullable<NonNullable<SlideElement['data']>[number][number]>;
type TableCell = {
  key: string;
  colSpan: number;
  rowSpan: number;
  text: string;
  style: TableCellData['style'];
};

const parseFontSize = (value?: string) => {
  if (!value) return undefined;
  const size = Number.parseFloat(value);
  return Number.isFinite(size) ? `${size}px` : undefined;
};

const normalizeFontName = (value?: string) => {
  if (!value) return undefined;
  return value.replace(/^"+|"+$/g, '');
};

const tableColor = (value?: string) => {
  if (!value) return undefined;
  return value.startsWith('rgb') || value.startsWith('#') ? value : undefined;
};

const isPlaceholderCell = (cell: TableCellData | undefined) => {
  if (!cell) return false;
  const colspan = cell.colspan ?? 1;
  const rowspan = cell.rowspan ?? 1;
  if (colspan !== 1 || rowspan !== 1) return false;

  const style = cell.style;
  const hasStyle = Boolean(style?.fontname) || Boolean(style?.fontsize) || Boolean(style?.color) || Boolean(style?.backcolor);
  return (cell.text ?? '').trim() === '' && !hasStyle;
};

const buildTableRows = (element: SlideElement) => {
  const rows = element.data ?? [];
  const colCount = element.colWidths?.length ?? 0;
  const rowCells: TableCell[][] = [];
  const skip = new Array(colCount).fill(0);

  rows.forEach((row, rowIndex) => {
    const cells: TableCell[] = [];
    let colIndex = 0;
    let cellIndex = 0;

    while (colIndex < colCount) {
      if (skip[colIndex] > 0) {
        skip[colIndex] -= 1;
        if (isPlaceholderCell(row[cellIndex])) cellIndex += 1;
        colIndex += 1;
        continue;
      }

      const cell = row[cellIndex];
      if (!cell) break;
      cellIndex += 1;

      const colSpan = cell.colspan ?? 1;
      const rowSpan = cell.rowspan ?? 1;

      if (rowSpan > 1) {
        for (let i = 0; i < colSpan; i += 1) {
          skip[colIndex + i] = rowSpan - 1;
        }
      }

      if (colSpan > 1) {
        for (let i = 0; i < colSpan - 1; i += 1) {
          if (isPlaceholderCell(row[cellIndex])) cellIndex += 1;
        }
      }

      cells.push({
        key: cell.id ?? `${rowIndex}-${colIndex}-${cellIndex}`,
        colSpan,
        rowSpan,
        text: cell.text ?? '',
        style: cell.style
      });

      colIndex += colSpan;
    }

    rowCells.push(cells);
  });

  return rowCells;
};

export function renderTable(element: SlideElement) {
  const colWidths = element.colWidths ?? [];
  const rows = buildTableRows(element);
  const rowCount = rows.length || 1;
  const baseRowHeight = (element.height ?? 0) / rowCount;
  const rowHeight = element.cellMinHeight ? Math.max(element.cellMinHeight, baseRowHeight) : baseRowHeight;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <table
        style={{
          width: '100%',
          height: '100%',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          border: element.outline ? `${element.outline.width ?? 1}px solid ${element.outline.color ?? '#000'}` : undefined
        }}
      >
        {colWidths.length > 0 && (
          <colgroup>
            {colWidths.map((width, index) => (
              <col key={`col-${index}`} style={{ width: `${width * 100}%` }} />
            ))}
          </colgroup>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} style={{ height: rowHeight }}>
              {row.map((cell) => (
                <td
                  key={cell.key}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  style={{
                    border: element.outline ? `${element.outline.width ?? 1}px solid ${element.outline.color ?? '#000'}` : '1px solid #ddd',
                    background: tableColor(cell.style?.backcolor),
                    padding: '6px 8px',
                    textAlign: (cell.style?.align as CSSProperties['textAlign']) ?? 'left',
                    color: tableColor(cell.style?.color),
                    fontFamily: normalizeFontName(cell.style?.fontname),
                    fontSize: parseFontSize(cell.style?.fontsize),
                    verticalAlign: 'middle'
                  }}
                >
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
