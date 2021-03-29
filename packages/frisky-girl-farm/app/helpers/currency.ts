import { helper } from '@ember/component/helper';

export function currency([amount]: [number]) {
  if (amount >= 0) {
    return `$${amount.toFixed(2)}`;
  } else {
    return `-$${Math.abs(amount).toFixed(2)}`;
  }
}

export default helper(currency);
