import { Watch } from 'vue-property-decorator';
import Throttle from '../../../../shared/annotations/Throttle';
import EventifyEventListenerConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import DataSynchroController from '../../modules/PushData/DataSynchroController';

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

interface SyncVOsParameters<T extends VueWithSyncVOs> {
    watch_fields?: string[];
    filters_factory?: (vm: T) => any | null;
    simple_sorts_by_on_api_type_id?: SortByVO[];
    deep_watch?: boolean;
    throttle_ms?: number;
    sync_to_store_namespace?: string | ((vm: T) => string);
    sync_to_store_property?: string;
}

export function SyncVOs<T extends VueWithSyncVOs>(
    api_type_id: string,
    params: SyncVOsParameters<T> = {},
) {
    params.watch_fields = params.watch_fields || [];
    params.simple_sorts_by_on_api_type_id = params.simple_sorts_by_on_api_type_id || [];
    return function (target: T, propertyKey: string) {
        const originalCreated = target.created;

        target.created = async function () {
            if (originalCreated) await originalCreated.call(this);
            const filters = params.filters_factory ? params.filters_factory(this) : undefined;
            if (filters !== null) {
                await this.register_vo_updates_on_list(api_type_id, propertyKey, filters, params.simple_sorts_by_on_api_type_id);
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

            Watch(propertyKey, { deep: true })(target, `__storeWatcher_${propertyKey}`, {
                value: function () { updateStore(this); }
            });
        }

        if (params.watch_fields.length && params.filters_factory) {
            const watcherMethodName = `__syncVOsWatcher_${propertyKey}`;

            Object.defineProperty(target, watcherMethodName, {
                value: Throttle({
                    param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
                    throttle_ms: params.throttle_ms ? params.throttle_ms : 100,
                })(target, watcherMethodName, {
                    value: async function () {
                        const newFilters = params.filters_factory(this);

                        if (newFilters === null) {
                            if (this.__previousSyncVOFilters !== null) {

                                const old_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, this.__previousSyncVOFilters);
                                const old_room_id = JSON.stringify(old_room_vo);

                                await DataSynchroController.unregister_room_id_vo_event_callbacks(old_room_id);

                                this.__previousSyncVOFilters = null;
                            }
                            return;
                        }

                        const old_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, this.__previousSyncVOFilters);
                        const new_room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(api_type_id, newFilters);
                        const old_room_id = JSON.stringify(old_room_vo);
                        const new_room_id = JSON.stringify(new_room_vo);

                        if (old_room_id === new_room_id) {
                            return; // No change, nothing to do
                        }

                        if (!!old_room_id) {
                            await DataSynchroController.unregister_room_id_vo_event_callbacks(old_room_id);
                        }

                        this.__previousSyncVOFilters = newFilters;

                        await (this as VueWithSyncVOs).register_vo_updates_on_list(api_type_id, propertyKey, newFilters, params.simple_sorts_by_on_api_type_id);
                    }
                }).value
            });

            Watch(params.watch_fields.join(','), { deep: params.deep_watch ? params.deep_watch : false })(target, watcherMethodName, {});
        }
    };
}