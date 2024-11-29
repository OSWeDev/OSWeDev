import { throttle } from 'lodash';
import StackContext from '../../server/StackContext';
import ThrottleHelper from '../tools/ThrottleHelper';

// Types pour les paramètres du décorateur
export interface ThrottleOptions {
    param_type: THROTTLED_METHOD_PARAM_TYPE;
    throttle_ms: number;
    leading?: boolean;
    trailing?: boolean;
}

// Enum pour les types de paramètres
export enum THROTTLED_METHOD_PARAM_TYPE {
    STACKABLE = 'STACKABLE',
    MAPPABLE = 'MAPPABLE',
    NONE = 'NONE',
    // Ajoutez d'autres types si nécessaire
}

/**
 * Indique le paramètre qui sert au typage de la méthode pré-throttling (donc avant le stackable ou le mappable)
 * @param target
 * @param propertyKey
 * @param parameterIndex
 */
export function PreThrottleParam(target: unknown, propertyKey: string | symbol, parameterIndex: number) {
    Reflect.defineMetadata('PreThrottleParam', parameterIndex, target, propertyKey);
}

/**
 * Indique le paramètre qui sert à l'exécution de la méthode post-throttling (donc après le stackable ou le mappable)
 * @param target
 * @param propertyKey
 * @param parameterIndex
 */
export function PostThrottleParam(target: unknown, propertyKey: string | symbol, parameterIndex: number) {
    Reflect.defineMetadata('PostThrottleParam', parameterIndex, target, propertyKey);
}

// Décorateur Throttle
export function Throttle(options: ThrottleOptions) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        const UID = ThrottleHelper.get_next_UID();

        // Préparer la fonction throttlée en fonction du type de paramètre
        switch (options.param_type) {
            case THROTTLED_METHOD_PARAM_TYPE.STACKABLE:

                ThrottleHelper.throttles[UID] = throttle(async () => {
                    ThrottleHelper.throttles_semaphore[UID] = false;
                    const params = ThrottleHelper.throttles_stackable_args[UID];
                    ThrottleHelper.throttles_stackable_args[UID] = [];

                    await StackContext.context_incompatible(
                        originalMethod,
                        target,
                        'Throttle.throttles_stackable_args',
                        null,
                        params);
                }, options.throttle_ms, {
                    leading: options.leading ?? false,
                    trailing: options.trailing ?? true,
                });
                break;

            case THROTTLED_METHOD_PARAM_TYPE.MAPPABLE:
                ThrottleHelper.throttles[UID] = throttle(async () => {
                    ThrottleHelper.throttles_semaphore[UID] = false;
                    const params = ThrottleHelper.throttles_mappable_args[UID];
                    ThrottleHelper.throttles_mappable_args[UID] = {};

                    await StackContext.context_incompatible(
                        originalMethod,
                        target,
                        'Throttle.throttles_mappable_args',
                        null,
                        params);
                }, options.throttle_ms, {
                    leading: options.leading ?? false,
                    trailing: options.trailing ?? true,
                });
                break;

            case THROTTLED_METHOD_PARAM_TYPE.NONE:
                ThrottleHelper.throttles[UID] = throttle(async () => {
                    ThrottleHelper.throttles_semaphore[UID] = false;

                    await StackContext.context_incompatible(
                        originalMethod,
                        target,
                        'Throttle.throttles_no_args');

                }, options.throttle_ms, {
                    leading: options.leading ?? false,
                    trailing: options.trailing ?? true,
                });
                break;
        }

        // Récupérer les indices des paramètres spéciaux
        const preThrottleIndex: number = Reflect.getMetadata('PreThrottleParam', target, propertyKey);
        const postThrottleIndex: number = Reflect.getMetadata('PostThrottleParam', target, propertyKey);
        const has_no_param = (options.param_type == THROTTLED_METHOD_PARAM_TYPE.NONE);

        if ((!has_no_param) && (preThrottleIndex === undefined)) {
            throw new Error('The pre-throttle parameter is not defined');
        }

        if ((!has_no_param) && (postThrottleIndex === undefined)) {
            throw new Error('The post-throttle parameter is not defined');
        }

        descriptor.value = function (...args: any[]) {

            let item: any = args[preThrottleIndex];

            // Cas particulier. On peut se retrouver à enchaîner des throttles, par exemple quand on throttle avant un changement de thread, puis à nouveau sur le nouveau thread.
            // Dans ce cas, on n'aura rien en premier param (null) mais un second param non vide. On le révupère comme si c'était un premier param.
            if ((item == null) && !!args[postThrottleIndex]) {
                args[preThrottleIndex] = args[postThrottleIndex];
                args[postThrottleIndex] = null;
                item = args[preThrottleIndex];
            }

            // Le second paramètre est géré par le décorateur, pas par l'appelant
            if (!!args[postThrottleIndex]) {
                throw new Error('The second parameter is managed by the decorator, not the caller');
            }

            switch (options.param_type) {
                case THROTTLED_METHOD_PARAM_TYPE.STACKABLE:
                    const stack = item ? (Array.isArray(item) ? item : [item]) : [];
                    ThrottleHelper.throttle_with_stackable_args(UID, stack);
                    break;

                case THROTTLED_METHOD_PARAM_TYPE.MAPPABLE:
                    ThrottleHelper.throttle_with_mappable_args(UID, item);
                    break;

                case THROTTLED_METHOD_PARAM_TYPE.NONE:
                    ThrottleHelper.throttle_without_args(UID);
                    break;
            }
        };

        return descriptor;
    };
}