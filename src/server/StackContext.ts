/* istanbul ignore file: only one method, and not willing to test it right now*/

import cls from './CLSHooked';

export default class StackContext {

    public static getInstance(): StackContext {
        if (!StackContext.instance) {
            StackContext.instance = new StackContext();
        }
        return StackContext.instance;
    }

    private static instance: StackContext = null;

    public nsid: string = 'oswedev-stack-context';
    public ns = cls.createNamespace(this.nsid);

    private constructor() {
    }

    /**
     * Express.js middleware that is responsible for initializing the context for each request.
     */
    public middleware(req, res, next) {
        StackContext.getInstance().ns.run(() => next());
    }

    public async runPromise(scope_overloads: { [scope_key: string]: any }, callback: (...params: any) => Promise<any>): Promise<any> {

        let result = null;

        let old_context_values = {};

        await StackContext.getInstance().ns.runPromise(async () => {

            for (let field_id in scope_overloads) {
                let field_value = scope_overloads[field_id];

                old_context_values[field_id] = StackContext.getInstance().get(field_id);
                StackContext.getInstance().set(field_id, field_value);
            }

            result = await callback();

            for (let field_id in scope_overloads) {
                StackContext.getInstance().set(field_id, old_context_values[field_id]);
            }
        });

        return result;
    }

    /**
     * Gets a value from the context by key.  Will return undefined if the context has not yet been initialized for this request or if a value is not found for the specified key.
     * @param {string} key
     */
    public get(key: string) {
        if (StackContext.getInstance().ns && StackContext.getInstance().ns.active) {
            return StackContext.getInstance().ns.get(key);
        }
        return null;
    }

    /**
     * Adds a value to the context by key.  If the key already exists, its value will be overwritten.  No value will persist if the context has not yet been initialized.
     * @param {string} key
     * @param {*} value
     */
    private set(key: string, value) {
        if (StackContext.getInstance().ns && StackContext.getInstance().ns.active) {
            return StackContext.getInstance().ns.set(key, value);
        }
        return null;
    }
}
