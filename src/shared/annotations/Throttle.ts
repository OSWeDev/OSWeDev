import 'reflect-metadata';
import EventsController from '../modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerConfVO from '../modules/Eventify/vos/EventifyEventListenerConfVO';
import EventifyEventListenerInstanceVO from '../modules/Eventify/vos/EventifyEventListenerInstanceVO';
import StackContextWrapper from '../tools/StackContextWrapper';
import ThrottleHelper from '../tools/ThrottleHelper';

// Types pour les paramètres du décorateur
export interface ThrottleOptions {
    param_type: number; // de type EventifyEventListenerConfVO.PARAM_TYPE_NONE ou PARAM_TYPE_STACK ou PARAM_TYPE_MAP
    throttle_ms: number;

    /**
     * Est-ce qu'on lance immédiatement le premier appel ? ou on debounce ?
     * @default true
     */
    leading?: boolean;

    // On commente trailing car on ne l'utilise pas, on a toujours du trailing pour le moment
    // /**
    //  * Est-ce qu'on lance un dernier appel après le dernier appel demandé pendant le run ou le cooldown ?
    //  * @default true
    //  */
    // trailing?: boolean;
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

type AsyncMethod = (...args: any[]) => Promise<any>;

// Décorateur Throttle
export default function Throttle(options: ThrottleOptions) {
    return function <T extends AsyncMethod>(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor): TypedPropertyDescriptor<T> {
        const originalMethod = descriptor.value;

        // Vérification runtime : si la fonction n’est pas async, on bloque
        if (originalMethod.constructor.name !== 'AsyncFunction') {
            throw new Error(
                `La méthode "${propertyKey}" doit impérativement être déclarée "async".`
            );
        }

        // Récupérer les indices des paramètres spéciaux
        const preThrottleIndex: number = Reflect.getMetadata('PreThrottleParam', target, propertyKey);
        const postThrottleIndex: number = Reflect.getMetadata('PostThrottleParam', target, propertyKey);
        const has_no_param = (options.param_type == EventifyEventListenerConfVO.PARAM_TYPE_NONE);

        if ((!has_no_param) && (preThrottleIndex === undefined)) {
            throw new Error('The pre-throttle parameter is not defined');
        }

        if ((!has_no_param) && (postThrottleIndex === undefined)) {
            throw new Error('The post-throttle parameter is not defined');
        }

        descriptor.value = function (...args: any[]) {

            let needs_to_declare_throttle = false;

            // On checke qu'on a déjà déclaré le throttle
            if (!this[propertyKey + '___THROTTLE_UID']) {
                this[propertyKey + '___THROTTLE_UID'] = ThrottleHelper.get_next_UID();
                needs_to_declare_throttle = true;
            }

            const UID = this[propertyKey + '___THROTTLE_UID'];
            const self = this;
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

            // On check l'existence du throttle
            const event_name = target.constructor.name + '.' + propertyKey + '.' + UID;

            if (needs_to_declare_throttle) {

                let listener: EventifyEventListenerInstanceVO = null;

                // Préparer la fonction throttlée en fonction du type de paramètre
                switch (options.param_type) {
                    case EventifyEventListenerConfVO.PARAM_TYPE_NONE:

                        listener = EventifyEventListenerInstanceVO.new_listener(
                            event_name,
                            async (event: EventifyEventInstanceVO, l: EventifyEventListenerInstanceVO) => {
                                if (!!StackContextWrapper.instance) {
                                    await StackContextWrapper.instance.context_incompatible(
                                        originalMethod,
                                        self,
                                        'Throttle.throttles_no_args');
                                } else {
                                    await originalMethod.apply(self, []);
                                }
                            },
                        );
                        listener.throttled = true;
                        listener.cooldown_ms = options.throttle_ms;
                        // On debounce leading si on est en leading false, sachant que par défaut le leading est true
                        listener.debounce_leading = !(options.leading ?? true);
                        listener.param_type = EventifyEventListenerConfVO.PARAM_TYPE_NONE;
                        listener.is_bgthread = false;
                        listener.unlimited_calls = true;
                        EventsController.register_event_listener(listener);
                        break;
                    case EventifyEventListenerConfVO.PARAM_TYPE_MAP:

                        listener = EventifyEventListenerInstanceVO.new_listener(
                            event_name,
                            async (event: EventifyEventInstanceVO, l: EventifyEventListenerInstanceVO) => {
                                if (!!StackContextWrapper.instance) {
                                    await StackContextWrapper.instance.context_incompatible(
                                        originalMethod,
                                        self,
                                        'Throttle.throttles_mappable_args',
                                        null,
                                        l.current_params_map as { [map_elt_id: string]: unknown });
                                } else {
                                    await originalMethod.apply(self, l.current_params_map as { [map_elt_id: string]: unknown });
                                }
                            },
                        );
                        listener.throttled = true;
                        listener.cooldown_ms = options.throttle_ms;
                        // On debounce leading si on est en leading false, sachant que par défaut le leading est true
                        listener.debounce_leading = !(options.leading ?? true);
                        listener.param_type = EventifyEventListenerConfVO.PARAM_TYPE_STACK;
                        listener.is_bgthread = false;
                        listener.unlimited_calls = true;
                        EventsController.register_event_listener(listener);
                        break;
                    case EventifyEventListenerConfVO.PARAM_TYPE_STACK:

                        listener = EventifyEventListenerInstanceVO.new_listener(
                            event_name,
                            async (event: EventifyEventInstanceVO, l: EventifyEventListenerInstanceVO) => {
                                if (!!StackContextWrapper.instance) {
                                    await StackContextWrapper.instance.context_incompatible(
                                        originalMethod,
                                        self,
                                        'Throttle.throttles_stackable_args',
                                        null,
                                        l.current_params_stack as unknown[]);
                                } else {
                                    await originalMethod.apply(self, [l.current_params_stack as unknown[]]);
                                }
                            },
                        );
                        listener.throttled = true;
                        listener.cooldown_ms = options.throttle_ms;
                        // On debounce leading si on est en leading false, sachant que par défaut le leading est true
                        listener.debounce_leading = !(options.leading ?? true);
                        listener.param_type = EventifyEventListenerConfVO.PARAM_TYPE_STACK;
                        listener.is_bgthread = false;
                        listener.unlimited_calls = true;
                        EventsController.register_event_listener(listener);
                        break;
                }
            }

            switch (options.param_type) {
                case EventifyEventListenerConfVO.PARAM_TYPE_STACK:
                    const stack = item ? (Array.isArray(item) ? item : [item]) : [];
                    EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name, stack));
                    break;

                case EventifyEventListenerConfVO.PARAM_TYPE_MAP:
                    EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name, item));
                    break;

                case EventifyEventListenerConfVO.PARAM_TYPE_NONE:
                    EventsController.emit_event(EventifyEventInstanceVO.new_event(event_name));
                    break;
            }
        };

        return descriptor;
    };
}