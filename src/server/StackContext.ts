/* istanbul ignore file: only one method, and not willing to test it right now*/

import ConsoleHandler from '../shared/tools/ConsoleHandler';
import { reflect } from '../shared/tools/ObjectHandler';
import { createNamespace, Namespace } from './CLSHooked';
import ConfigurationService from './env/ConfigurationService';
import { IRequestStackContext } from './ServerExpressController';

export const scope_overloads_for_exec_as_server: Partial<IRequestStackContext> = {
    IS_CLIENT: false,
    SID: null,
    UID: null,
    CLIENT_TAB_ID: null,
    REFERER: null,
    SESSION_ID: null,
};

export function get_scope_overloads_for_context_incompatible(reason: string): Partial<IRequestStackContext> {
    return {
        IS_CLIENT: false,
        SID: null,
        UID: null,
        CLIENT_TAB_ID: null,
        REFERER: null,
        SESSION_ID: null,
        CONTEXT_INCOMPATIBLE: true,
        CONTEXT_INCOMPATIBLE_REASON: reason,
    };
}

export default class StackContext {

    // public static nsid: string = 'oswedev-stack-context';
    public static namespace: Namespace = createNamespace('oswedev-stack-context');

    /**
     * Express.js middleware that is responsible for initializing the context for each request.
     */
    public static middleware(req, res, next) {
        StackContext.namespace.run(() => next());
    }

    /**
     * Le contexte actif pour transmission à un bgthread par exemple
     * @returns the active context
     */
    public static get_active_context(): IRequestStackContext {
        return StackContext.namespace.active;
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
            return StackContext.runPromise(scope_overloads_for_exec_as_server, callback, this_arg, ...safeParams);
        }

        return callback.apply(this_arg, safeParams);
    }

    /**
     * Pour indiquer que tout ce qui se passe dans le callback est incompatible avec la notion même de contexte, donc on passe en mode serveur, et on throw si on get autre chose que IS_CLIENT par la suite
     * @param callback
     * @param exec_as_server
     * @returns
     */
    public static async context_incompatible<T extends Array<unknown>, U>(callback: (...params: T) => U | Promise<U>, this_arg: unknown, reason_context_incompatible: string, ...params: T): Promise<U> {

        // Par défaut, params est un tableau vide si aucun paramètre n'est passé
        const safeParams = params.length ? params : ([] as unknown as T);
        if (ConfigurationService.node_configuration.activate_incompatible_stack_context && !StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE)) {
            return StackContext.runPromise(get_scope_overloads_for_context_incompatible(reason_context_incompatible), callback, this_arg, ...safeParams);
        }

        return callback.apply(this_arg, safeParams);
    }

    /**
     * Pas compatible avec les throttles / debounce
     * @param scope_overloads
     * @param callback
     * @returns
     */
    public static async runPromise<T extends Array<unknown>, U>(scope_overloads: Partial<IRequestStackContext>, callback: (...params: T) => U | Promise<U>, this_arg: unknown, ...params: T): Promise<U> {

        /**
         * FIXME DELETE ME DEBUG ONLY JNE
         */
        if (!StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE)) {
            ConsoleHandler.log('StackContext.runPromise:IN:' + JSON.stringify(StackContext.get_active_context()) + ':' + JSON.stringify(scope_overloads));
        }
        /**
         * FIXME DELETE ME DEBUG ONLY JNE
         */


        let result = null;

        const old_context_values = {};

        await StackContext.namespace.runPromise(async () => {

            for (const field_name in scope_overloads) {
                const field_value = scope_overloads[field_name];

                old_context_values[field_name] = StackContext.get(field_name, true);
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

        /**
         * FIXME DELETE ME DEBUG ONLY JNE
         */
        if (!StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE)) {
            ConsoleHandler.log('StackContext.runPromise:OUT:' + JSON.stringify(StackContext.get_active_context()) + ':' + JSON.stringify(scope_overloads));
        }
        /**
         * FIXME DELETE ME DEBUG ONLY JNE
         */

        return result;
    }

    /**
     * Gets a value from the context by key.  Will return undefined if the context has not yet been initialized for this request or if a value is not found for the specified key.
     * @param {string} key
     */
    public static get(key: string, is_safely_asking_for_context_incompatible_fields: boolean = false) {
        if (StackContext.namespace && StackContext.namespace.active) {

            // Juste un contrôle de cohérence :
            //  Si on est incompatible avec le contexte, on ne devrait pas pouvoir accéder à une valeur du contexte autre que IS_CLIENT, ou les questions d'incompatibilité
            if (ConfigurationService.node_configuration.activate_incompatible_stack_context &&
                (!is_safely_asking_for_context_incompatible_fields) &&
                (key != reflect<IRequestStackContext>().IS_CLIENT) &&
                (key != reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE) &&
                (key != reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE_REASON)) {
                if (StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE)) {

                    if (ConfigurationService.node_configuration.throw_on_incompatible_stack_context) {
                        throw new Error('Trying to access a context value while in context incompatible mode:' + key + ' - ' + StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE_REASON));
                    } else {
                        // Console log stack
                        try {
                            throw new Error('Trying to access a context value while in context incompatible mode:' + key + ' - ' + StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE_REASON) + ' - Should be handled explicitly in the code, checking for CONTEXT_INCOMPATIBLE');
                        } catch (error) {
                            ConsoleHandler.error(error);
                        }
                    }
                }
            }

            const res = StackContext.namespace.get(key);
            if (typeof res !== 'undefined') {
                return res;
            }
        }
        return null;
    }

    /**
     * Adds a value to the context by key.  If the key already exists, its value will be overwritten.  No value will persist if the context has not yet been initialized.
     * WARNING : this updates the current context, it does not create a new one
     * @param {string} key
     * @param {*} value
     */
    private static set(key: string, value) {
        if (StackContext.namespace && StackContext.namespace.active) {
            return StackContext.namespace.set(key, value);
        }
        return null;
    }
}
