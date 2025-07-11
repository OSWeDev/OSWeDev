import Throttle from '../../../../shared/annotations/Throttle';
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import EventifyEventListenerConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import DataSynchroController from '../../modules/PushData/DataSynchroController';
import { SafeWatch } from './SafeWatch';
interface VueWithSyncVOs extends Vue {
    created?: () => void | Promise<void>;
    beforeDestroy?: () => void | Promise<void>;
    unregister_all_vo_event_callbacks(): Promise<void>;
    register_vo_updates_on_list(
        API_TYPE_ID: string,
        list_name: string,
        simple_filters_on_api_type_id?: ContextFilterVO[],
        simple_sorts_by_on_api_type_id?: SortByVO[],
        map_name?: string,
    );
}

interface SyncVOsParameters<T extends VueWithSyncVOs, V extends IDistantVOBase> {
    watch_fields?: string[];
    filters_factory?: (vm: T) => any | null;
    simple_sorts_by_on_api_type_id?: SortByVO[];
    deep_watch?: boolean;
    throttle_ms?: number;

    sync_to_store_namespace?: string | ((vm: T) => string);
    sync_to_store_property?: string;

    debug?: boolean;
}

export function SyncVOs<T extends VueWithSyncVOs, V extends IDistantVOBase>(
    api_type_id: string,
    params: SyncVOsParameters<T, V> = {},
) {
    params.watch_fields = params.watch_fields || [];
    params.simple_sorts_by_on_api_type_id = params.simple_sorts_by_on_api_type_id || [];

    return function (
        target: T,
        propertyKey: { [K in keyof T]: T[K] extends Array<V> ? K : never }[keyof T],
    ) {
        const originalCreated = target.created;

        target.created = async function () {
            if (originalCreated) await originalCreated.call(this);
            const filters = params.filters_factory ? params.filters_factory(this) : [];
            if (filters != null) {
                await DataSynchroController.register_vo_updates_on_list(
                    this,
                    api_type_id,
                    propertyKey as string,
                    filters,
                    params.simple_sorts_by_on_api_type_id,
                    null, // map_name
                    params.debug ? (list: V[]) => {
                        ConsoleHandler.debug(`SyncVOs: Registered updates for ${propertyKey as string} with filters:${JSON.stringify(filters)} and sorts:${JSON.stringify(params.simple_sorts_by_on_api_type_id)} Current list:${JSON.stringify(list)}`);
                    } : undefined,
                );
                this.__previousSyncVOFilters = filters;
            }
        };

        const originalBeforeDestroy = target.beforeDestroy;

        target.beforeDestroy = async function () {
            if (originalBeforeDestroy) await originalBeforeDestroy.call(this);
            await this.unregister_all_vo_event_callbacks();
        };

        if (params.sync_to_store_namespace) {
            const updateStore = function (vm: T) {

                if (params.debug) {
                    ConsoleHandler.debug(`SyncVOs: Updating store for ${propertyKey as string} with value`, vm[propertyKey]);
                }

                const namespace = typeof params.sync_to_store_namespace === 'function'
                    ? params.sync_to_store_namespace(vm)
                    : params.sync_to_store_namespace;

                if (namespace) {
                    vm.$store.dispatch(
                        `${namespace}/set_${params.sync_to_store_property || propertyKey as string}`,
                        vm[propertyKey]
                    );
                }
            };

            const storeWatcherMethodName = `__storeWatcher_${propertyKey as string}`;

            Object.defineProperty(target, storeWatcherMethodName, {
                value: function () { updateStore(this); },
                configurable: true,
            });

            SafeWatch(propertyKey as string, { deep: true })(
                target,
                storeWatcherMethodName,
                Object.getOwnPropertyDescriptor(target, storeWatcherMethodName),
            );
        }

        if (params.watch_fields.length && params.filters_factory) {
            const watcherMethodName = `__syncVOsWatcher_${propertyKey as string}`;

            Object.defineProperty(target, watcherMethodName, {
                value: Throttle({
                    param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
                    throttle_ms: params.throttle_ms || 100,
                })(target, watcherMethodName, {
                    value: async function () {
                        const newFilters = params.filters_factory ? params.filters_factory(this) : [];

                        if (newFilters === null) {
                            if (this.__previousSyncVOFilters != null) {
                                const old_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, this.__previousSyncVOFilters);
                                const old_room_id = JSON.stringify(old_room_vo);

                                await DataSynchroController.unregister_room_id_vo_event_callbacks(old_room_id);

                                this.__previousSyncVOFilters = null;
                            }
                            return;
                        }

                        const old_room_vo = this.__previousSyncVOFilters ? DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, this.__previousSyncVOFilters) : null;
                        const new_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, newFilters);
                        const old_room_id = this.__previousSyncVOFilters ? JSON.stringify(old_room_vo) : null;
                        const new_room_id = JSON.stringify(new_room_vo);

                        if (old_room_id === new_room_id) {
                            if (params.debug) {
                                ConsoleHandler.debug(`SyncVOs: No change in filters for ${propertyKey as string}, no need to update.`);
                            }

                            return; // No change
                        }

                        if (!!old_room_id) {
                            if (params.debug) {
                                ConsoleHandler.debug(`SyncVOs: Unregistering old room ID ${old_room_id} for ${propertyKey as string}.`);
                            }

                            await DataSynchroController.unregister_room_id_vo_event_callbacks(old_room_id);
                        }

                        this.__previousSyncVOFilters = newFilters;

                        if (params.debug) {
                            ConsoleHandler.debug(`SyncVOs: Registering new room ID ${new_room_id} for ${propertyKey as string}.`);
                        }

                        await DataSynchroController.register_vo_updates_on_list(
                            this,
                            api_type_id,
                            propertyKey as string,
                            newFilters,
                            params.simple_sorts_by_on_api_type_id,
                            null, // map_name
                            params.debug ? (list: V[]) => {
                                ConsoleHandler.debug(`SyncVOs: Registered updates for ${propertyKey as string} with filters:${JSON.stringify(newFilters)} and sorts:${JSON.stringify(params.simple_sorts_by_on_api_type_id)} Current list:${JSON.stringify(list)}`);
                            } : undefined,
                        );
                    }
                }).value,
                configurable: true,
            });

            params.watch_fields.forEach((field) => {
                SafeWatch(field, { deep: params.deep_watch || false })(
                    target,
                    watcherMethodName,
                    Object.getOwnPropertyDescriptor(target, watcherMethodName),
                );
            });
        } else {
            const newFilters = params.filters_factory ? params.filters_factory(this) : [];

            const new_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, newFilters);
            const new_room_id = JSON.stringify(new_room_vo);

            if (params.debug) {
                ConsoleHandler.debug(`SyncVOs: Registering new room ID ${new_room_id} for ${propertyKey as string}.`);
            }

            DataSynchroController.register_vo_updates_on_list(
                target,
                api_type_id,
                propertyKey as string,
                newFilters,
                params.simple_sorts_by_on_api_type_id,
                null, // map_name
                params.debug ? (list: V[]) => {
                    ConsoleHandler.debug(`SyncVOs: Registered updates for ${propertyKey as string} with filters:${JSON.stringify(newFilters)} and sorts:${JSON.stringify(params.simple_sorts_by_on_api_type_id)} Current list:${JSON.stringify(list)}`);
                } : undefined,
            );
        }
    };
}
