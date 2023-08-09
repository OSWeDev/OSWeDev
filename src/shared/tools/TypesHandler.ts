import { isMoment, isDuration, Moment, isDate } from 'moment';

export default class TypesHandler {

    /**
     * isNumeric
     *  - Check if the given value is a number or a string that can be converted to a number
     * 
     * @param {unknown} e
     * @returns {boolean}
     */
    public static isNumeric(e: unknown): boolean {
        const rgx = /^(([0-9]*)|(([0-9]*)\.([0-9]*)))$/;

        if (e === null) {
            return (null);
        }

        return rgx.test(e.toString());
    }

    /* istanbul ignore next: ,othing to test here */
    public static getInstance(): TypesHandler {
        if (!TypesHandler.instance) {
            TypesHandler.instance = new TypesHandler();
        }
        return TypesHandler.instance;
    }

    private static instance: TypesHandler = null;

    private constructor() {
    }

    public isDate(e: any): boolean {
        return e && isDate(e);
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