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

    public isBoolean(e: any): boolean {
        return typeof e === 'boolean';
    }

    public isString(e: any): boolean {
        return typeof e === 'string';
    }

    public isNumber(e: any): boolean {
        return typeof e === 'number';
    }

    public isArray(e: any): boolean {
        return Array.isArray(e);
    }

    public isNull(e: any): boolean {
        return e === null;
    }
}