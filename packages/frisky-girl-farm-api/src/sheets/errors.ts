export abstract class SheetsError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    readonly extra?: object,
  ) {
    super(code);
  }
}

function makeError(statusCode: number, code: string) {
  class Err extends SheetsError {
    constructor(extra?: object) {
      super(code, statusCode, extra);
      Error.captureStackTrace(this, Err);
    }
  }
  return Err;
}

export const OrdersNotOpenError = makeError(404, 'ordersNotOpen');
export const NegativeQuantityError = makeError(400, 'negativeQuantity');
export const ProductNotFoundError = makeError(404, 'productNotFound');
export const QuantityNotAvailableError = makeError(409, 'quantityNotAvailable');
export const UnknownUserError = makeError(401, 'unknownUser');
