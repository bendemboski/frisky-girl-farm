const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Convert a zero-based column index to the row letter in A1 notation
export function indexToColumn(index: number) {
  index += 1;

  let column = '';
  while (index > 0) {
    let r = (index - 1) % 26;
    column = `${letters[r]}${column}`;
    index = (index - r - 1) / 26;
  }
  return column;
}
