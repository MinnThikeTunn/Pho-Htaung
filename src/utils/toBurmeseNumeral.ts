export const BURMESE_DIGITS = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];

export function toBurmeseNumeral(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '၀';
  return num
    .toString()
    .split('')
    .map((ch) => {
      const digit = parseInt(ch, 10);
      return !isNaN(digit) && BURMESE_DIGITS[digit] !== undefined ? BURMESE_DIGITS[digit] : ch;
    })
    .join('');
}
