import Throttle from '../../../../shared/annotations/Throttle';
import { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import EventifyEventListenerConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import DataSynchroController from '../../modules/PushData/DataSynchroController';
import { SafeWatch } from './SafeWatch';

interface VueWithSyncVO extends Vue {
    created?: () => void | Promise<void>;
    beforeDestroy?: () => void | Promise<void>;
    unregister_all_vo_event_callbacks(): Promise<void>;
    register_single_vo_updates(
        API_TYPE_ID: string,
        vo_id: number,
        field_name: string,
        vo_has_been_preloaded?: boolean,
    );
}

interface SyncVOParameters<T extends VueWithSyncVO, V extends IDistantVOBase> {
    watch_fields?: string[];

    id_factory?: (vm: T) => number | V | Promise<number | V>;
    filters_factory?: (vm: T) => any | null;

    deep_watch?: boolean;
    throttle_ms?: number;

    sync_to_store_namespace?: string | ((vm: T) => string);
    sync_to_store_property?: string;

    debug?: boolean;
}

export function SyncVO<T extends VueWithSyncVO, V extends IDistantVOBase>(
    api_type_id: string,
    params: SyncVOParameters<T, V>,
) {
    params.watch_fields = params.watch_fields || [];

    return function (target: T, propertyKey: string) {
        const originalCreated = target.created;

        target.created = async function () {
            if (originalCreated) await originalCreated.call(this);

            if (!params.id_factory && params.filters_factory) {
                const filters = params.filters_factory(this);

                if (filters != null) {
                    await DataSynchroController.register_vo_updates_on_list(
                        this,
                        api_type_id,
                        propertyKey,
                        filters,
                        null,
                        null,
                        (list: V[]) => {
                            if (list.length > 1) {
                                ConsoleHandler.error(`SyncVO: Multiple results returned for ${propertyKey}`);
                                return;
                            }
                            this[propertyKey] = list[0] || null;
                        },
                    );
                }

                return;
            }

            const vo_or_id = await params.id_factory(this);
            const vo = vo_or_id ? (typeof vo_or_id === 'number' ? null : vo_or_id) : null;
            const vo_id = vo_or_id ? (vo ? vo.id : vo_or_id as number) : null;

            if (vo_id != null) {
                if (vo && vo.id) {
                    this[propertyKey] = vo;
                }

                await DataSynchroController.register_single_vo_updates(
                    this,
                    api_type_id,
                    vo_id,
                    propertyKey,
                    !!(vo && vo.id),
                    params.debug ? (updated_vo: V) => {
                        ConsoleHandler.debug(`SyncVO: Registered updates for ${propertyKey} with id:${vo_id}. Current value: ${JSON.stringify(updated_vo)}`);
                    } : undefined,
                );
                this.__previousSyncVOId = vo_id;
            }
        };

        const originalBeforeDestroy = target.beforeDestroy;

        target.beforeDestroy = async function () {
            if (originalBeforeDestroy) await originalBeforeDestroy.call(this);
            await this.unregister_all_vo_event_callbacks();
        };

        if (params.watch_fields.length && params.filters_factory) {
            const watcherMethodName = `__syncVOFilterWatcher_${propertyKey}`;

            Object.defineProperty(target, watcherMethodName, {
                value: Throttle({ throttle_ms: (params.throttle_ms || 100), param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE })(target, watcherMethodName, {
                    value: async function () {
                        const filters = params.filters_factory(target);

                        if (filters != null) {

                            await DataSynchroController.register_vo_updates_on_list(
                                this,
                                api_type_id,
                                propertyKey,
                                filters,
                                null,
                                null,
                                (list: V[]) => {
                                    if (list.length > 1) {
                                        ConsoleHandler.error(`SyncVO: Multiple results returned for ${propertyKey}`);
                                        return;
                                    }
                                    this[propertyKey] = list[0] || null;
                                },
                            );
                        }
                    },
                }).value,
            });

            params.watch_fields.forEach((field) => {
                SafeWatch(field, { deep: params.deep_watch || false })(
                    target,
                    watcherMethodName,
                    Object.getOwnPropertyDescriptor(target, watcherMethodName),
                );
            });
        }

        if (params.sync_to_store_namespace) {
            const updateStore = function (vm: T) {

                if (params.debug) {
                    ConsoleHandler.debug(`SyncVO: Updating store for ${propertyKey} with value`, vm[propertyKey]);
                }

                // Ajout de la synchro du store en même temps
                const namespace = typeof params.sync_to_store_namespace === 'function'
                    ? params.sync_to_store_namespace(vm)
                    : params.sync_to_store_namespace;

                if (namespace) {
                    vm.$store.dispatch(
                        `${namespace}/set_${params.sync_to_store_property || propertyKey}`,
                        vm[propertyKey]
                    );
                }
            };

            const storeWatcherMethodName = `__storeWatcher_${propertyKey}`;

            Object.defineProperty(target, storeWatcherMethodName, {
                value: function () {
                    updateStore(this);
                },
                configurable: true,
            });

            SafeWatch(propertyKey, { deep: true })(
                target,
                storeWatcherMethodName,
                Object.getOwnPropertyDescriptor(target, storeWatcherMethodName),
            );
        }

        if (params.watch_fields.length && params.id_factory) {
            const watcherMethodName = `__syncVOWatcher_${propertyKey}`;

            Object.defineProperty(target, watcherMethodName, {
                value: Throttle({
                    param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
                    throttle_ms: params.throttle_ms || 100,
                })(target, watcherMethodName, {
                    value: async function () {
                        const vo_or_id = await params.id_factory(this);
                        const vo = vo_or_id ? (typeof vo_or_id === 'number' ? null : vo_or_id) : null;
                        const vo_id = vo_or_id ? (vo ? vo.id : vo_or_id as number) : null;

                        if (vo_id === this.__previousSyncVOId) return;

                        const old_simple_filters_on_api_type_id = [
                            filter(api_type_id).by_id(this.__previousSyncVOId),
                        ];
                        const old_room_vo = this.__previousSyncVOFilters ? DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, old_simple_filters_on_api_type_id) : null;
                        const old_room_id = this.__previousSyncVOFilters ? JSON.stringify(old_room_vo) : null;

                        const new_simple_filters_on_api_type_id = [
                            filter(api_type_id).by_id(vo_id),
                        ];
                        const new_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, new_simple_filters_on_api_type_id);
                        const new_room_id = JSON.stringify(new_room_vo);

                        if (old_room_id === new_room_id) {
                            if (params.debug) {
                                ConsoleHandler.debug(`SyncVO: No change in room id for ${propertyKey}, skipping updates.`);
                            }

                            return;
                        }

                        if (!!old_room_id) {
                            if (params.debug) {
                                ConsoleHandler.debug(`SyncVO: Unregistering old room id ${old_room_id} for ${propertyKey}.`);
                            }

                            await DataSynchroController.unregister_room_id_vo_event_callbacks(old_room_id);
                        }

                        if (vo_id != null) {

                            if (vo && vo.id) {
                                this[propertyKey] = vo;
                            }

                            if (params.debug) {
                                ConsoleHandler.debug(`SyncVO: Registering new room id ${new_room_id} for ${propertyKey}.`);
                            }
                            await DataSynchroController.register_single_vo_updates(
                                this,
                                api_type_id,
                                vo_id,
                                propertyKey,
                                !!(vo && vo.id),
                                params.debug ? (updated_vo: V) => {
                                    ConsoleHandler.debug(`SyncVO: Registered updates for ${propertyKey} with id:${vo_id}. Current value: ${JSON.stringify(updated_vo)}`);
                                } : undefined,
                            );
                        }

                        this.__previousSyncVOId = vo_id;
                    }
                }).value
            });

            params.watch_fields.forEach((field) => {
                SafeWatch(field, { deep: params.deep_watch || false })(
                    target,
                    watcherMethodName,
                    Object.getOwnPropertyDescriptor(target, watcherMethodName),
                );
            });
        } else {

            if (!params.id_factory && params.filters_factory) {
                const filters = params.filters_factory(target);

                if (filters != null) {
                    DataSynchroController.register_vo_updates_on_list(
                        this,
                        api_type_id,
                        propertyKey,
                        filters,
                        null,
                        null,
                        (list: V[]) => {
                            if (list.length > 1) {
                                ConsoleHandler.error(`SyncVO: Multiple results returned for ${propertyKey}`);
                                return;
                            }
                            this[propertyKey] = list[0] || null;
                        },
                    );
                }

                return;
            }

            const id_fact_res = params.id_factory(target);

            const use_vo_or_id = (vo_or_id) => {
                const vo = vo_or_id ? (typeof vo_or_id === 'number' ? null : vo_or_id) : null;
                const vo_id = vo_or_id ? (vo ? vo.id : vo_or_id as number) : null;

                if (!vo_id) return;

                const new_simple_filters_on_api_type_id = [
                    filter(api_type_id).by_id(vo_id),
                ];
                const new_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, new_simple_filters_on_api_type_id);
                const new_room_id = JSON.stringify(new_room_vo);

                if (vo_id != null) {

                    if (vo && vo.id) {
                        target[propertyKey] = vo;
                    }

                    if (params.debug) {
                        ConsoleHandler.debug(`SyncVO: Registering new room id ${new_room_id} for ${propertyKey}.`);
                    }
                    DataSynchroController.register_single_vo_updates(
                        target,
                        api_type_id,
                        vo_id,
                        propertyKey,
                        !!(vo && vo.id),
                        params.debug ? (updated_vo: V) => {
                            ConsoleHandler.debug(`SyncVO: Registered updates for ${propertyKey} with id:${vo_id}. Current value: ${JSON.stringify(updated_vo)}`);
                        } : undefined,
                    );
                }
            };



            if (id_fact_res instanceof Promise) {

                id_fact_res.then(use_vo_or_id).catch((error) => {
                    if (params.debug) {
                        ConsoleHandler.error(`SyncVO: Error during initialization of ${propertyKey}:`, error);
                    }
                });
            } else {
                use_vo_or_id(id_fact_res);
            }
        }
    };
}
