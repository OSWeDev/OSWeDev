import { Watch } from 'vue-property-decorator';
import Throttle from '../../../../shared/annotations/Throttle';
import EventifyEventListenerConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DataSynchroController from '../../modules/PushData/DataSynchroController';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';

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

interface SyncVOParameters<T extends VueWithSyncVO> {
    watch_fields?: string[];
    id_factory: (vm: T) => number | IDistantVOBase;
    deep_watch?: boolean;
    throttle_ms?: number;
}

export function SyncVO<T extends VueWithSyncVO>(
    api_type_id: string,
    params: SyncVOParameters<T>,
) {
    params.watch_fields = params.watch_fields || [];

    return function (target: T, propertyKey: string) {
        const originalCreated = target.created;

        target.created = async function () {
            if (originalCreated) await originalCreated.call(this);

            const vo_or_id = params.id_factory(this);
            const vo = vo_or_id ? (typeof vo_or_id === 'number' ? null : vo_or_id) : null;
            const vo_id = vo_or_id ? (vo ? vo.id : vo_or_id as number) : null;

            if (vo_id !== null) {
                if (vo && vo.id) {
                    this[propertyKey] = vo;
                }

                await this.register_single_vo_updates(api_type_id, vo_id, propertyKey, vo && vo.id);
                this.__previousSyncVOId = vo_id;
            }
        };

        const originalBeforeDestroy = target.beforeDestroy;

        target.beforeDestroy = async function () {
            if (originalBeforeDestroy) await originalBeforeDestroy.call(this);
            await this.unregister_all_vo_event_callbacks();
        };

        if (params.watch_fields.length && params.id_factory) {
            const watcherMethodName = `__syncVOWatcher_${propertyKey}`;

            Object.defineProperty(target, watcherMethodName, {
                value: Throttle({
                    param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
                    throttle_ms: params.throttle_ms || 100,
                })(target, watcherMethodName, {
                    value: async function () {
                        const vo_or_id = params.id_factory(this);
                        const vo = vo_or_id ? (typeof vo_or_id === 'number' ? null : vo_or_id) : null;
                        const vo_id = vo_or_id ? (vo ? vo.id : vo_or_id as number) : null;

                        if (vo_id === this.__previousSyncVOId) return;

                        const old_simple_filters_on_api_type_id = [
                            filter(api_type_id).by_id(this.__previousSyncVOId),
                        ];
                        const old_room_vo = this.get_room_vo_for_register_vo_updates(api_type_id, old_simple_filters_on_api_type_id);
                        const old_room_id = JSON.stringify(old_room_vo);

                        const new_simple_filters_on_api_type_id = [
                            filter(api_type_id).by_id(vo_id),
                        ];
                        const new_room_vo = this.get_room_vo_for_register_vo_updates(api_type_id, new_simple_filters_on_api_type_id);
                        const new_room_id = JSON.stringify(new_room_vo);

                        if (old_room_id === new_room_id) return;

                        if (!!old_room_id) {
                            await DataSynchroController.unregister_room_id_vo_event_callbacks(old_room_id);
                        }

                        if (vo_id !== null) {

                            if (vo && vo.id) {
                                this[propertyKey] = vo;
                            }
                            await this.register_single_vo_updates(api_type_id, vo_id, propertyKey, vo && vo.id);
                        }

                        this.__previousSyncVOId = vo_id;
                    }
                }).value
            });

            Watch(params.watch_fields.join(','), { deep: params.deep_watch || false })(target, watcherMethodName, {});
        }
    };
}
