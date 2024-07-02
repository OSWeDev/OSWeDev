/* istanbul ignore file: only one method, and not willing to test it right now*/

import cls from './CLSHooked';

export default class StackContext {

    // public static nsid: string = 'oswedev-stack-context';
    public static ns = cls.createNamespace('oswedev-stack-context');

    /**
     * Express.js middleware that is responsible for initializing the context for each request.
     */
    public static middleware(req, res, next) {
        StackContext.ns.run(() => next());
    }

    /**
     * Replace when possible by StackContext.set, or contextqueries excec_as_admin, or insert_vos(vos, true)
     * @deprecated Should only be used on ServerBase for the main request
     */
    public static async runPromise(scope_overloads: { [scope_key: string]: any }, callback: (...params: any) => Promise<any>): Promise<any> {

        let result = null;

        const old_context_values = {};

        await StackContext.ns.runPromise(async () => {

            for (const field_name in scope_overloads) {
                const field_value = scope_overloads[field_name];

                old_context_values[field_name] = StackContext.get(field_name);
                StackContext.set(field_name, field_value);
            }

            try {
                result = await callback();
            } catch (error) {

            }

            for (const field_name in scope_overloads) {
                StackContext.set(field_name, old_context_values[field_name]);
            }
        });

        return result;
    }

    /**
     * Gets a value from the context by key.  Will return undefined if the context has not yet been initialized for this request or if a value is not found for the specified key.
     * @param {string} key
     */
    public static get(key: string) {
        if (StackContext.ns && StackContext.ns.active) {
            return StackContext.ns.get(key);
        }
        return null;
    }

    /**
     * Adds a value to the context by key.  If the key already exists, its value will be overwritten.  No value will persist if the context has not yet been initialized.
     * @param {string} key
     * @param {*} value
     */
    private static set(key: string, value) {
        if (StackContext.ns && StackContext.ns.active) {
            return StackContext.ns.set(key, value);
        }
        return null;
    }
}
