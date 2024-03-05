import { Request, Response, NextFunction } from 'express';

export const catchAsync =
    (fn: (req: Request, res: Response, next: NextFunction) => void) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };

export const pick = (object: Record<string, any>, keys: string[]) =>
    keys.reduce((obj: any, key: string) => {
        if (object && Object.prototype.hasOwnProperty.call(object, key)) {
            obj[key] = object[key];
        }
        return obj;
    }, {});

export function toMicroAmount(amount: string, coinDecimals: string) {
    return String(
        Math.ceil(
            Number.parseFloat(amount) *
                Math.pow(10, Number.parseInt(coinDecimals)),
        ),
    );
}
