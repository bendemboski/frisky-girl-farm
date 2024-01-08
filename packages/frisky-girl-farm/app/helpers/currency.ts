import { helper } from '@ember/component/helper';

interface CurrencySignature {
  Args: { Positional: [number] };
  Return: string;
}

const currency = helper<CurrencySignature>(([amount]: [number]) => {
  if (amount >= 0) {
    return `$${amount.toFixed(2)}`;
  } else {
    return `-$${Math.abs(amount).toFixed(2)}`;
  }
});

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    currency: typeof currency;
  }
}

export default currency;
