import React, { useState, useRef } from 'react';
import type { TableData } from '../../types';
import { Plus, X, Download, Calculator } from 'lucide-react';

interface ExcelTableWidgetProps {
  tableData?: TableData;
  title?: string;
  onChange: (newTableData: TableData) => void;
  compact?: boolean;
}

export const DEFAULT_TABLE_DATA: TableData = {
  headers: ['Kalem / Görev', 'Miktar', 'Tutar'],
  rows: [
    ['Sunucu & Domain', '1', '450'],
    ['Tasarım Araçları', '2', '300'],
    ['Toplam', '', '=TOPLA(C1:C2)'],
  ],
  showSummaryRow: false,
};

function getColumnLetter(colIdx: number): string {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function parseCellCoord(ref: string): { col: number; row: number } | null {
  const match = /^([A-Z]+)(\d+)$/i.exec(ref.trim());
  if (!match) return null;
  const colStr = match[1].toUpperCase();
  const rowNum = parseInt(match[2], 10) - 1;
  let colIdx = 0;
  for (let i = 0; i < colStr.length; i++) {
    colIdx = colIdx * 26 + (colStr.charCodeAt(i) - 64);
  }
  colIdx -= 1;
  if (rowNum < 0 || colIdx < 0) return null;
  return { col: colIdx, row: rowNum };
}

function parseNumber(val: string): number {
  if (!val) return NaN;
  const cleaned = val
    .trim()
    .replace(/\s/g, '')
    .replace(/₺|\$|€|%/g, '')
    .replace(',', '.');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

export function evaluateCellFormula(
  rawValue: string,
  rows: string[][],
  depth = 0
): { display: string; isFormula: boolean; isError?: boolean } {
  const trimmed = (rawValue || '').trim();
  if (!trimmed.startsWith('=')) {
    return { display: rawValue || '', isFormula: false };
  }
  if (depth > 6) {
    return { display: '#DÖNGÜ!', isFormula: true, isError: true };
  }

  const expr = trimmed.slice(1).trim();
  if (!expr) return { display: '', isFormula: true };

  const getCellNumericValue = (col: number, row: number): number => {
    const raw = rows[row]?.[col] ?? '';
    const evaluated = evaluateCellFormula(raw, rows, depth + 1);
    const num = parseNumber(evaluated.display);
    return Number.isNaN(num) ? 0 : num;
  };

  const getRangeValues = (rangeStr: string): number[] => {
    const parts = rangeStr.split(':');
    if (parts.length === 2) {
      const start = parseCellCoord(parts[0]);
      const end = parseCellCoord(parts[1]);
      if (!start || !end) return [];
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      const nums: number[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const raw = rows[r]?.[c] ?? '';
          const evaluated = evaluateCellFormula(raw, rows, depth + 1);
          const n = parseNumber(evaluated.display);
          if (!Number.isNaN(n)) nums.push(n);
        }
      }
      return nums;
    }
    const single = parseCellCoord(rangeStr);
    if (single) {
      return [getCellNumericValue(single.col, single.row)];
    }
    const directNum = parseNumber(rangeStr);
    return Number.isNaN(directNum) ? [] : [directNum];
  };

  // Match function calls like SUM(A1:A3), TOPLA(A1:A3), AVG(...), ORTALAMA(...), MIN(...), MAX(...), COUNT(...), SAY(...)
  const fnMatch = /^([A-ZÇĞİÖŞÜ]+)\(([^)]*)\)$/i.exec(expr);
  if (fnMatch) {
    const fnName = fnMatch[1].toUpperCase();
    const argsRaw = fnMatch[2]
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const values = argsRaw.flatMap((arg) => getRangeValues(arg));

    if (fnName === 'SUM' || fnName === 'TOPLA') {
      const sum = values.reduce((a, b) => a + b, 0);
      return { display: formatNumberOutput(sum), isFormula: true };
    }
    if (fnName === 'AVG' || fnName === 'AVERAGE' || fnName === 'ORTALAMA' || fnName === 'ORT') {
      if (values.length === 0) return { display: '0', isFormula: true };
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { display: formatNumberOutput(avg), isFormula: true };
    }
    if (fnName === 'MIN' || fnName === 'MİN') {
      if (values.length === 0) return { display: '0', isFormula: true };
      return { display: formatNumberOutput(Math.min(...values)), isFormula: true };
    }
    if (fnName === 'MAX' || fnName === 'MAKS') {
      if (values.length === 0) return { display: '0', isFormula: true };
      return { display: formatNumberOutput(Math.max(...values)), isFormula: true };
    }
    if (fnName === 'COUNT' || fnName === 'SAY') {
      return { display: String(values.length), isFormula: true };
    }
    return { display: '#AD?', isFormula: true, isError: true };
  }

  // Replace cell references (e.g. A1, B2) in basic arithmetic expressions: =A1+B1*2
  try {
    const arithmeticExpr = expr.replace(/\b([A-Z]+)(\d+)\b/gi, (full) => {
      const coord = parseCellCoord(full);
      if (!coord) return '0';
      return String(getCellNumericValue(coord.col, coord.row));
    });

    // Only allow safe arithmetic characters
    if (/^[0-9+\-*/().,\s]+$/.test(arithmeticExpr)) {
      const normalized = arithmeticExpr.replace(/,/g, '.');
      // Safe evaluation for basic math
      const result = Function(`"use strict"; return (${normalized});`)();
      if (typeof result === 'number' && Number.isFinite(result)) {
        return { display: formatNumberOutput(result), isFormula: true };
      }
    }
  } catch {
    return { display: '#HATA!', isFormula: true, isError: true };
  }

  return { display: '#HATA!', isFormula: true, isError: true };
}

function formatNumberOutput(num: number): string {
  if (Number.isInteger(num)) return String(num);
  return Number(num.toFixed(2)).toString();
}

export const ExcelTableWidget: React.FC<ExcelTableWidgetProps> = ({
  tableData,
  title = 'tablo',
  onChange,
  compact = false,
}) => {
  const data: TableData =
    tableData && tableData.headers && tableData.headers.length > 0
      ? tableData
      : DEFAULT_TABLE_DATA;

  const headers = data.headers;
  const rows = data.rows;
  const showSummaryRow = Boolean(data.showSummaryRow);

  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusCell = (r: number, c: number) => {
    setFocusedCell({ r, c });
    setTimeout(() => {
      const el = inputRefs.current[`${r}-${c}`];
      if (el) {
        el.focus();
        el.select();
      }
    }, 10);
  };

  const handleHeaderChange = (colIdx: number, value: string) => {
    const nextHeaders = headers.map((h, i) => (i === colIdx ? value : h));
    onChange({ ...data, headers: nextHeaders });
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    const nextRows = rows.map((row, r) => {
      if (r !== rowIdx) return row;
      const padded = [...row];
      while (padded.length < headers.length) padded.push('');
      padded[colIdx] = value;
      return padded;
    });
    onChange({ ...data, rows: nextRows });
  };

  const handleAddRow = () => {
    const newRow = new Array(headers.length).fill('');
    const nextRows = [...rows, newRow];
    onChange({ ...data, rows: nextRows });
    focusCell(nextRows.length - 1, 0);
  };

  const handleDeleteRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    const nextRows = rows.filter((_, r) => r !== rowIdx);
    onChange({ ...data, rows: nextRows });
    if (focusedCell && focusedCell.r === rowIdx) {
      setFocusedCell(null);
    }
  };

  const handleAddColumn = () => {
    const nextColLetter = getColumnLetter(headers.length);
    const nextHeaders = [...headers, `Sütun ${nextColLetter}`];
    const nextRows = rows.map((r) => [...r, '']);
    onChange({ ...data, headers: nextHeaders, rows: nextRows });
  };

  const handleDeleteColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    const nextHeaders = headers.filter((_, c) => c !== colIdx);
    const nextRows = rows.map((r) => r.filter((_, c) => c !== colIdx));
    onChange({ ...data, headers: nextHeaders, rows: nextRows });
    if (focusedCell && focusedCell.c === colIdx) {
      setFocusedCell(null);
    }
  };

  const handleToggleSummaryRow = () => {
    onChange({ ...data, showSummaryRow: !showSummaryRow });
  };

  // Multi-cell paste from Excel / Google Sheets (TSV / CSV)
  const handleCellPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startRow: number,
    startCol: number
  ) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) {
      return; // normal single-cell paste
    }
    e.preventDefault();
    e.stopPropagation();

    const pastedLines = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line, idx, arr) => !(idx === arr.length - 1 && line === ''));

    if (pastedLines.length === 0) return;

    const pastedGrid = pastedLines.map((line) => line.split('\t'));
    const maxColsNeeded = Math.max(
      headers.length,
      ...pastedGrid.map((lineCols) => startCol + lineCols.length)
    );
    const maxRowsNeeded = Math.max(rows.length, startRow + pastedGrid.length);

    const nextHeaders = [...headers];
    while (nextHeaders.length < maxColsNeeded) {
      nextHeaders.push(`Sütun ${getColumnLetter(nextHeaders.length)}`);
    }

    const nextRows: string[][] = [];
    for (let r = 0; r < maxRowsNeeded; r++) {
      const existingRow = rows[r] ? [...rows[r]] : [];
      while (existingRow.length < maxColsNeeded) {
        existingRow.push('');
      }
      nextRows.push(existingRow);
    }

    for (let pr = 0; pr < pastedGrid.length; pr++) {
      for (let pc = 0; pc < pastedGrid[pr].length; pc++) {
        nextRows[startRow + pr][startCol + pc] = pastedGrid[pr][pc];
      }
    }

    onChange({
      ...data,
      headers: nextHeaders,
      rows: nextRows,
    });
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: number,
    c: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (r + 1 < rows.length) {
        focusCell(r + 1, c);
      } else {
        const newRow = new Array(headers.length).fill('');
        const nextRows = [...rows, newRow];
        onChange({ ...data, rows: nextRows });
        focusCell(nextRows.length - 1, c);
      }
    } else if (e.key === 'ArrowDown') {
      if (r + 1 < rows.length) {
        e.preventDefault();
        focusCell(r + 1, c);
      }
    } else if (e.key === 'ArrowUp') {
      if (r - 1 >= 0) {
        e.preventDefault();
        focusCell(r - 1, c);
      }
    }
  };

  const handleExportCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    const escapeCsv = (val: string) => {
      const evaluated = evaluateCellFormula(val, rows).display;
      if (evaluated.includes('"') || evaluated.includes(';') || evaluated.includes('\n')) {
        return `"${evaluated.replace(/"/g, '""')}"`;
      }
      return evaluated;
    };
    const lines = [
      headers.map(escapeCsv).join(';'),
      ...rows.map((r) => r.map((cell) => escapeCsv(cell || '')).join(';')),
    ];
    // Add UTF-8 BOM so Microsoft Excel opens Turkish characters cleanly
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (title || 'tablo').toLowerCase().replace(/[^a-z0-9ğüşıöç_-]+/gi, '-');
    link.download = `${safeName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeCellCoord = focusedCell
    ? `${getColumnLetter(focusedCell.c)}${focusedCell.r + 1}`
    : 'A1';
  const activeCellValue = focusedCell
    ? rows[focusedCell.r]?.[focusedCell.c] ?? ''
    : rows[0]?.[0] ?? '';

  // Calculate dynamic minimum width for each column based on header & cell text length
  const colMinWidths = headers.map((header, colIdx) => {
    let maxChars = (header || '').length;
    for (let r = 0; r < rows.length; r++) {
      const raw = rows[r]?.[colIdx] ?? '';
      const disp = evaluateCellFormula(raw, rows).display;
      if (disp.length > maxChars) maxChars = disp.length;
    }
    return Math.max(125, Math.min(360, maxChars * 7.5 + 28));
  });

  return (
    <div
      className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden no-drag select-none flex flex-col flex-1 w-full h-full"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Excel Formula / Active Cell Bar */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border-b border-slate-200 text-[11px] shrink-0">
        <span className="font-mono font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded min-w-8 text-center">
          {activeCellCoord}
        </span>
        <span className="font-serif italic font-bold text-slate-400 px-1 select-none">
          fx
        </span>
        <input
          type="text"
          value={activeCellValue}
          onChange={(e) => {
            const targetR = focusedCell ? focusedCell.r : 0;
            const targetC = focusedCell ? focusedCell.c : 0;
            handleCellChange(targetR, targetC, e.target.value);
          }}
          placeholder="Değer veya formül yazın (Örn: =TOPLA(B1:B3) veya =A1*B1)"
          className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:border-emerald-500"
        />
      </div>

      {/* Spreadsheet Grid (Auto-expands on canvas; scrollable inside compact modal) */}
      <div className={compact ? 'overflow-x-auto max-h-64 overflow-y-auto' : 'flex-1 overflow-visible'}>
        <table className="w-full h-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-300">
              {/* Top-left corner cell */}
              <th className="w-7 min-w-7 bg-slate-200/70 border-r border-slate-300 text-[10px] font-mono text-slate-400 text-center select-none">
                #
              </th>

              {headers.map((header, colIdx) => {
                const colLetter = getColumnLetter(colIdx);
                const isColActive = focusedCell?.c === colIdx;
                const minW = colMinWidths[colIdx];
                return (
                  <th
                    key={colIdx}
                    style={{ minWidth: `${minW}px` }}
                    className={`group/col relative border-r border-slate-300 p-0 align-middle transition-colors ${
                      isColActive ? 'bg-emerald-50/80' : 'bg-slate-100'
                    }`}
                  >
                    {/* Excel Column Letter Strip */}
                    <div className="flex items-center justify-between px-1.5 pt-0.5 text-[9px] font-mono font-bold text-slate-400 border-b border-slate-200/60">
                      <span>{colLetter}</span>
                      {headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(colIdx)}
                          title={`${colLetter} sütununu sil`}
                          className="opacity-0 group-hover/col:opacity-100 text-slate-400 hover:text-rose-600 cursor-pointer transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>

                    {/* Editable Column Header Name */}
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                      placeholder={`Sütun ${colLetter}`}
                      className="w-full px-2 py-1 text-[11px] font-bold text-slate-800 bg-transparent focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </th>
                );
              })}

              {/* Quick Add Column Header Button */}
              <th className="w-7 min-w-7 bg-slate-100 p-0 text-center align-middle">
                <button
                  type="button"
                  onClick={handleAddColumn}
                  title="+ Yeni Sütun Ekle"
                  className="w-full h-full py-2 flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIdx) => {
              const isRowActive = focusedCell?.r === rowIdx;
              return (
                <tr
                  key={rowIdx}
                  className="group/row border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50"
                >
                  {/* Row Number Gutter */}
                  <td
                    className={`w-7 min-w-7 border-r border-slate-300 text-[10px] font-mono font-bold text-center select-none relative ${
                      isRowActive
                        ? 'bg-emerald-100/80 text-emerald-900'
                        : 'bg-slate-100/80 text-slate-400'
                    }`}
                  >
                    <span className={rows.length > 1 ? 'group-hover/row:opacity-0' : ''}>
                      {rowIdx + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rowIdx)}
                        title={`${rowIdx + 1}. satırı sil`}
                        className="absolute inset-0 hidden group-hover/row:flex items-center justify-center text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </td>

                  {/* Row Cells */}
                  {headers.map((_, colIdx) => {
                    const rawVal = row[colIdx] ?? '';
                    const isCellFocused =
                      focusedCell?.r === rowIdx && focusedCell?.c === colIdx;
                    const evaluated = evaluateCellFormula(rawVal, rows);
                    const displayValue = isCellFocused ? rawVal : evaluated.display;
                    const isNumeric =
                      !isCellFocused &&
                      displayValue !== '' &&
                      !Number.isNaN(parseNumber(displayValue));
                    const minW = colMinWidths[colIdx];

                    return (
                      <td
                        key={colIdx}
                        style={{ minWidth: `${minW}px` }}
                        className={`border-r border-slate-200 p-0 relative ${
                          isCellFocused
                            ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/20 z-10'
                            : ''
                        }`}
                      >
                        <input
                          ref={(el) => {
                            inputRefs.current[`${rowIdx}-${colIdx}`] = el;
                          }}
                          type="text"
                          value={displayValue}
                          onFocus={() => setFocusedCell({ r: rowIdx, c: colIdx })}
                          onChange={(e) =>
                            handleCellChange(rowIdx, colIdx, e.target.value)
                          }
                          onKeyDown={(e) => handleCellKeyDown(e, rowIdx, colIdx)}
                          onPaste={(e) => handleCellPaste(e, rowIdx, colIdx)}
                          placeholder=""
                          className={`w-full h-full px-2 py-1.5 text-xs bg-transparent focus:outline-hidden text-slate-800 ${
                            isNumeric ? 'text-right font-mono' : 'text-left'
                          } ${
                            evaluated.isFormula && !isCellFocused
                              ? 'font-semibold text-emerald-800 bg-emerald-50/30'
                              : ''
                          } ${evaluated.isError ? 'text-rose-600 font-bold' : ''}`}
                        />
                        {evaluated.isFormula && !isCellFocused && (
                          <span
                            title={`Formül: ${rawVal}`}
                            className="absolute top-0.5 left-1 text-[8px] font-mono text-emerald-600/80 pointer-events-none select-none"
                          >
                            fx
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="w-7 min-w-7 bg-slate-50/40" />
                </tr>
              );
            })}

            {/* Optional Auto-Sum Summary Row */}
            {showSummaryRow && (
              <tr className="bg-emerald-50/70 border-t-2 border-emerald-300 font-mono text-xs font-bold text-emerald-950">
                <td className="w-7 min-w-7 border-r border-emerald-200 text-center text-[10px] text-emerald-700">
                  Σ
                </td>
                {headers.map((_, colIdx) => {
                  const colNums = rows
                    .map((r) => {
                      const ev = evaluateCellFormula(r[colIdx] ?? '', rows);
                      return parseNumber(ev.display);
                    })
                    .filter((n) => !Number.isNaN(n));
                  const sum = colNums.reduce((a, b) => a + b, 0);
                  return (
                    <td
                      key={colIdx}
                      className="px-2 py-1.5 border-r border-emerald-200 text-right"
                    >
                      {colNums.length > 0 ? (
                        formatNumberOutput(sum)
                      ) : colIdx === 0 ? (
                        <span className="float-left font-sans text-[11px] text-emerald-800">
                          Toplam
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="w-7 min-w-7" />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Spreadsheet Controls Bar */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-2 py-1 rounded-md bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={11} />
            <span>Satır</span>
          </button>

          <button
            type="button"
            onClick={handleAddColumn}
            className="px-2 py-1 rounded-md bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={11} />
            <span>Sütun</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSummaryRow}
            title="Sütun toplamlarını otomatik hesapla (Σ)"
            className={`px-2 py-1 rounded-md border font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showSummaryRow
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Calculator size={11} />
            <span>Σ Toplam</span>
          </button>

          {(data.width || data.height) && (
            <button
              type="button"
              onClick={() => onChange({ ...data, width: undefined, height: undefined })}
              title="Tablo boyutunu satır ve sütun sayısına göre otomatik sıfırla"
              className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 font-medium transition-colors cursor-pointer"
            >
              Otomatik Boyut
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          title="Tabloyu Excel (.csv) olarak indir"
          className="px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Download size={11} />
          <span>CSV</span>
        </button>
      </div>
    </div>
  );
};
