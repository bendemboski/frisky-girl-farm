import templateOnlyComponent from '@ember/component/template-only';
import type { PastOrder } from 'frisky-girl-farm/services/order';

interface PastOrderSignature {
  Args: {
    pastOrder: PastOrder;
  };
}

const PastOrderComponent = templateOnlyComponent<PastOrderSignature>();

export default PastOrderComponent;

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    PastOrder: typeof PastOrderComponent;
  }
}
