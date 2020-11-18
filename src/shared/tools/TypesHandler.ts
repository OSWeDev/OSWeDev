import { isMoment, isDuration, Moment } from 'moment';

export default class TypesHandler {

    public static getInstance(): TypesHandler {
        if (!TypesHandler.instance) {
            TypesHandler.instance = new TypesHandler();
        }
        return TypesHandler.instance;
    }

    private static instance: TypesHandler = null;

    private constructor() {
    }

    public isSameMoment(a: Moment, b: Moment): boolean {

        if ((a && a.isValid()) && ((!b) || !b.isValid())) {
            return false;
        }
        if ((b && b.isValid()) && ((!a) || !a.isValid())) {
            return false;
        }

        return a.isSame(b);
    }

    public isMoment(e: any): boolean {
        return e && isMoment(e);
    }

    public isDuration(e: any): boolean {
        return e && isDuration(e);
    }

    public isBoolean(e: any): boolean {
        if (e === null) {
            return (null);
        }
        return typeof e === 'boolean';
    }

    public isString(e: any): boolean {
        if (e === null) {
            return (null);
        }
        return typeof e === 'string';
    }

    public isNumber(e: any): boolean {
        if (e === null) {
            return (null);
        }
        return typeof e === 'number';
    }

    public isArray(e: any): boolean {
        if (e === null) {
            return (null);
        }
        return Array.isArray(e);
    }

    public isNull(e: any): boolean {
        return e === null;
    }

    public isObject(e: any): boolean {
        return (typeof e === 'object') && (e !== null);
    }
}