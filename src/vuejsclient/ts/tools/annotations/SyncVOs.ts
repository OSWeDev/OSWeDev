import { Watch } from 'vue-property-decorator';
import Throttle from '../../../../shared/annotations/Throttle';
import EventifyEventListenerConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ContextFilterVO from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';

interface VueWithSyncVOs extends Vue {
    created?: () => void | Promise<void>;
    unregister_all_vo_event_callbacks(): Promise<void>;
    register_vo_updates_on_list(
        API_TYPE_ID: string,
        list_name: string,
        simple_filters_on_api_type_id?: ContextFilterVO[],
        simple_sorts_by_on_api_type_id?: SortByVO[],
        map_name?: string,
    );
}

export function SyncVOs<T extends VueWithSyncVOs>(
    apiTypeId: string,
    watchFields: string[] = [],
    filtersFactory?: (vm: T) => any | null,
    deepWatch: boolean = false,
    throttleMs: number = 100
) {
    return function (target: T, propertyKey: string) {
        const originalCreated = target.created;

        target.created = async function () {
            if (originalCreated) await originalCreated.call(this);
            const filters = filtersFactory ? filtersFactory(this) : undefined;
            if (filters !== null) {
                await this.register_vo_updates_on_list(apiTypeId, this[propertyKey], filters);
                this.__previousSyncVOFilters = filters;
            }
        };

        if (watchFields.length && filtersFactory) {
            const watcherMethodName = `__syncVOsWatcher_${propertyKey}`;

            Object.defineProperty(target, watcherMethodName, {
                value: Throttle({
                    param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
                    throttle_ms: throttleMs,
                })(target, watcherMethodName, {
                    value: async function () {
                        const newFilters = filtersFactory(this);

                        if (newFilters === null) {
                            if (this.__previousSyncVOFilters !== null) {
                                this.__previousSyncVOFilters = null;
                                await (this as VueWithSyncVOs).unregister_all_vo_event_callbacks();
                            }
                            return;
                        }

                        const filtersChanged = JSON.stringify(newFilters) !== JSON.stringify(this.__previousSyncVOFilters);

                        if (filtersChanged) {
                            this.__previousSyncVOFilters = newFilters;
                            await (this as VueWithSyncVOs).unregister_all_vo_event_callbacks();
                            await (this as VueWithSyncVOs).register_vo_updates_on_list(apiTypeId, this[propertyKey], newFilters);
                        }
                    }
                }).value
            });

            Watch(watchFields.join(','), { deep: deepWatch })(target, watcherMethodName, {});
        }
    };
}


// export function SyncVOs(apiTypeId: string) {
//     return function (target: any, propertyKey: string) {
//         const originalCreated = target.created;

//         target.created = async function () {
//             if (originalCreated) await originalCreated.call(this);
//             await this.register_vo_updates_on_list(apiTypeId, this[propertyKey]);
//         };
//     };
// }