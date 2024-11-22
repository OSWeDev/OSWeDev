/* istanbul ignore file: only one method, and not willing to test it right now*/

import { reflect } from '../shared/tools/ObjectHandler';
import cls from './CLSHooked';
import { IRequestStackContext } from './ServerExpressController';

export const scope_overloads_for_exec_as_server: Partial<IRequestStackContext> = {
    IS_CLIENT: false,
    SID: null,
    UID: null,
    CLIENT_TAB_ID: null,
    REFERER: null,
    SESSION_ID: null,
};

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
     * Le contexte actif pour transmission à un bgthread par exemple
     * @returns the active context
     */
    public static get_active_context(): IRequestStackContext {
        return StackContext.ns.active;
    }

    /**
     * Au besoin, on change le contexte actif pour refléter le comportement serveur. Si exec_as_server est à false, on ne change rien
     * Si exec_as_server est à true mais qu'on est déjà en mode serveur, on ne change rien
     * @param callback
     * @param exec_as_server
     * @returns
     */
    public static async exec_as_server<T extends Array<unknown>, U>(callback: (...params: T) => U | Promise<U>, this_arg: unknown, exec_as_server: boolean, ...params: T): Promise<U> {

        // Par défaut, params est un tableau vide si aucun paramètre n'est passé
        const safeParams = params.length ? params : ([] as unknown as T);
        if (exec_as_server && !!StackContext.get(reflect<IRequestStackContext>().IS_CLIENT)) {
            return StackContext.runPromise(scope_overloads_for_exec_as_server, callback, this_arg, exec_as_server, ...safeParams);
        }

        return callback.apply(this_arg, safeParams);
    }

    /**
     * Pas compatible avec les throttles / debounce
     * @param scope_overloads
     * @param callback
     * @returns
     */
    public static async runPromise<T extends Array<unknown>, U>(scope_overloads: Partial<IRequestStackContext>, callback: (...params: T) => U | Promise<U>, this_arg: unknown, exec_as_server: boolean, ...params: T): Promise<U> {

        let result = null;

        const old_context_values = {};

        await StackContext.ns.runPromise(async () => {

            for (const field_name in scope_overloads) {
                const field_value = scope_overloads[field_name];

                old_context_values[field_name] = StackContext.get(field_name);
                StackContext.set(field_name, field_value);
            }

            try {
                result = await callback.apply(this_arg, params);
            } catch (error) {
                //
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
            const res = StackContext.ns.get(key);
            if (typeof res !== 'undefined') {
                return res;
            }
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
