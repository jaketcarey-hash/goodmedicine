/**
 * Getting her data back out, in a form she can actually open.
 *
 * The site already promises that everything stays on her device and that the
 * data is hers. Until now the only way out was a JSON backup — a file for
 * moving between phones, not one a person can read, and not one she can hand
 * to a band administrator or a tax preparer. That gap made the promise
 * partly untrue.
 *
 * CSV rather than .xlsx on purpose: it opens in Excel, Sheets, Numbers and
 * whatever a band office actually runs, it needs no library on this side, and
 * it does not lock her file to one vendor's software.
 *
 * Three details that decide whether the file opens correctly, all of which
 * are easy to get wrong and invisible until someone else opens it:
 */

/**
 * 1. **Formula injection.** Every label in this file was typed by the person,
 *    and a spreadsheet treats a leading `=`, `+`, `-`, `@`, tab or carriage
 *    return as the start of a formula. A label like `=1+1` becomes a live
 *    cell; worse strings can prompt to run commands. Prefixing with an
 *    apostrophe makes the spreadsheet show the text and evaluate nothing.
 *    Her own budget should never be able to attack her own machine, and it
 *    is not her job to know that.
 */
const RISKY_START = /^[=+\-@\t\r]/;

/**
 * 2. **Quoting.** A field holding a comma, a quote or a newline has to be
 *    wrapped, and inner quotes doubled. Labels here are free text — "rent,
 *    hydro" is a thing someone will type.
 */
function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  // Numbers are never defused — a negative amount must stay numeric or the
  // spreadsheet cannot sum the column, which is the whole point of the file.
  if (typeof value === 'number') return String(value);

  const defused = RISKY_START.test(value) ? `'${value}` : value;
  // A defused value is always quoted as well. Importers disagree about
  // whether a bare leading apostrophe marks text, and the one that disagrees
  // is the one running on someone else's machine.
  const mustQuote = defused !== value || /[",\r\n]/.test(defused);
  return mustQuote ? `"${defused.replace(/"/g, '""')}"` : defused;
}

/** Rows to a CSV body. Excel is happiest with CRLF. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

/**
 * 3. **The byte-order mark.** Without it, Excel on Windows reads the file as
 *    the local codepage and mangles every accented character — which on this
 *    site means Nation names and anything typed with an apostrophe or accent.
 *    Three bytes, and the difference between a readable file and a broken one.
 */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const blob = new Blob(['﻿' + toCsv(rows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** "2026-08-20", for filenames that sort. */
export function stamp(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
