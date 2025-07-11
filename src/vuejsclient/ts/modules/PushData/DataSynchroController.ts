import Vue from "vue";
import ContextFilterVO, { filter } from "../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SortByVO from "../../../../shared/modules/ContextFilter/vos/SortByVO";
import ModuleTableController from "../../../../shared/modules/DAO/ModuleTableController";
import ModuleTableFieldVO from "../../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import { all_promises } from "../../../../shared/tools/PromiseTools";
import AjaxCacheClientController from "../AjaxCache/AjaxCacheClientController";
import VOEventRegistrationKey from "./VOEventRegistrationKey";
import VOEventRegistrationsHandler from "./VOEventRegistrationsHandler";
import RangeHandler from "../../../../shared/tools/RangeHandler";

export default class DataSynchroController {

    public static vo_events_registration_keys_by_room_id: { [room_id: string]: VOEventRegistrationKey[] } = {};

    /**
     * LISTE RÉACTIVE – VERSION 100% TS / AUCUNE DÉPENDANCE À VUE - mais compatible
     */
    public static async register_vo_updates_on_list(
        this_elt: any, // Pour éditer directement l'attribut dans la classe ciblée
        API_TYPE_ID: string,
        list_name: string,
        simple_filters_on_api_type_id: ContextFilterVO[] = [],
        simple_sorts_by_on_api_type_id: SortByVO[] = [],
        map_name: string = null,
        on_list_change?: (list: IDistantVOBase[]) => void,   // callback facultatif
    ) {

        DataSynchroController.assert_compatibility_for_register_vo_list_updates(API_TYPE_ID, list_name,
            simple_filters_on_api_type_id, simple_sorts_by_on_api_type_id);

        // ────────────── INIT STATE ──────────────
        if (map_name) {
            if (!this_elt[map_name]) Vue.set(this_elt, map_name, {});
            Vue.set(this_elt[map_name], list_name, []);
        } else {
            Vue.set(this_elt, list_name, []);
        }
        const sort_fn = DataSynchroController.get_sort_function_for_register_vo_updates(simple_sorts_by_on_api_type_id);
        const room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(API_TYPE_ID, simple_filters_on_api_type_id);
        const room_id = JSON.stringify(room_vo);

        await DataSynchroController.unregister_room_id_vo_event_callbacks(room_id);
        DataSynchroController.vo_events_registration_keys_by_room_id[room_id] = [];

        const listRef = (): IDistantVOBase[] =>
            map_name ? this_elt[map_name][list_name] : this_elt[list_name];

        const pushAndNotify = (vo: IDistantVOBase) => {
            DataSynchroController.handle_created_vo_event_callback(this_elt, list_name, sort_fn, vo, map_name);
            on_list_change?.(listRef()); // TODO THROTTLE probablement ce on_list_change, et attention à l'init de la liste synchronisée qui déclenche il semblerait autant
            // de mise à jour que d'éléments dans la liste, ce qui peut être problématique si la liste est grande
        };

        // ────────────── PROMISES PARALLÈLES ──────────────
        await all_promises([

            /* PRÉ-CHARGE LISTE COMPLÈTE */
            (async () => {
                const vos = await query(API_TYPE_ID)
                    .add_filters(simple_filters_on_api_type_id)
                    .set_sorts(simple_sorts_by_on_api_type_id)
                    .select_vos();
                vos.forEach(pushAndNotify);
            })(),

            /* CREATE */
            (async () => {
                const k = await VOEventRegistrationsHandler.register_vo_create_callback(
                    room_vo, room_id, (vo) => {
                        AjaxCacheClientController.getInstance()
                            .invalidateCachesFromApiTypesInvolved([vo._type]);
                        pushAndNotify(vo);
                    });
                DataSynchroController.vo_events_registration_keys_by_room_id[room_id].push(k);
            })(),

            /* DELETE */
            (async () => {
                const k = await VOEventRegistrationsHandler.register_vo_delete_callback(
                    room_vo, room_id, (vo) => {
                        AjaxCacheClientController.getInstance()
                            .invalidateCachesFromApiTypesInvolved([vo._type]);
                        const list = listRef();
                        const idx = list.findIndex((e) => e.id === vo.id);
                        if (idx > -1) list.splice(idx, 1);
                        on_list_change?.(list);
                    });
                DataSynchroController.vo_events_registration_keys_by_room_id[room_id].push(k);
            })(),

            /* UPDATE */
            (async () => {
                const k = await VOEventRegistrationsHandler.register_vo_update_callback(
                    room_vo, room_id, (_, vo) => {
                        AjaxCacheClientController.getInstance()
                            .invalidateCachesFromApiTypesInvolved([vo._type]);
                        const list = listRef();
                        const idx = list.findIndex((e) => e.id === vo.id);
                        if (idx > -1) Vue.set(listRef(), idx, vo);
                        on_list_change?.(list);
                    });
                DataSynchroController.vo_events_registration_keys_by_room_id[room_id].push(k);
            })(),
        ]);
    }

    /**
     * VO UNIQUE – VERSION 100% TS / AUCUNE DÉPENDANCE À VUE - mais compatible
     */
    public static async register_single_vo_updates(
        this_elt: any, // Pour éditer directement l'attribut dans la classe ciblée
        API_TYPE_ID: string,
        vo_id: number,
        field_name: string,
        vo_has_been_preloaded = true,
        on_vo_change?: (vo: IDistantVOBase | null) => void,   // callback facultatif
    ) {

        DataSynchroController.assert_compatibility_for_register_single_vo_updates(API_TYPE_ID, vo_id, field_name);

        if (!vo_has_been_preloaded) (this_elt as any)[field_name] = null;

        const filters = [filter(API_TYPE_ID).by_id(vo_id)];
        const room_vo = DataSynchroController.get_room_vo_for_register_vo_updates(API_TYPE_ID, filters);
        const room_id = JSON.stringify(room_vo);

        await DataSynchroController.unregister_room_id_vo_event_callbacks(room_id);
        DataSynchroController.vo_events_registration_keys_by_room_id[room_id] = [];

        const setAndNotify = (vo: IDistantVOBase | null) => {
            (this_elt as any)[field_name] = vo;
            on_vo_change?.(vo);
        };

        await all_promises([

            /* PRÉ-CHARGE VO */
            (!vo_has_been_preloaded ? (async () => {
                const vo = await query(API_TYPE_ID).add_filters(filters).select_vo();
                setAndNotify(vo);
            })() : null),

            /* DELETE */
            (async () => {
                const k = await VOEventRegistrationsHandler.register_vo_delete_callback(
                    room_vo, room_id, () => setAndNotify(null));
                DataSynchroController.vo_events_registration_keys_by_room_id[room_id].push(k);
            })(),

            /* UPDATE */
            (async () => {
                const k = await VOEventRegistrationsHandler.register_vo_update_callback(
                    room_vo, room_id, (_, vo) => setAndNotify(vo));
                DataSynchroController.vo_events_registration_keys_by_room_id[room_id].push(k);
            })(),
        ].filter(Boolean));
    }

    public static assert_compatibility_for_register_vo_list_updates(
        API_TYPE_ID: string,
        list_name: string,
        simple_filters_on_api_type_id: ContextFilterVO[] = [],
        simple_sorts_by_on_api_type_id: SortByVO[] = [],
    ) {
        if (!API_TYPE_ID) {
            throw new Error('API_TYPE_ID is mandatory');
        }

        if (!list_name) {
            throw new Error('list_name is mandatory');
        }

        for (const i in simple_filters_on_api_type_id) {
            const simple_filter_on_api_type_id = simple_filters_on_api_type_id[i];

            if (simple_filter_on_api_type_id.vo_type != API_TYPE_ID) {
                throw new Error('simple_filters_on_api_type_id must be on API_TYPE_ID');
            }

            const vo_field = ModuleTableController.module_tables_by_vo_type[simple_filter_on_api_type_id.vo_type].get_field_by_id(simple_filter_on_api_type_id.field_name);
            const field_type = vo_field ? vo_field.field_type : ModuleTableFieldVO.FIELD_TYPE_int;
            switch (field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_amount:
                case ModuleTableFieldVO.FIELD_TYPE_float:
                case ModuleTableFieldVO.FIELD_TYPE_int:
                case ModuleTableFieldVO.FIELD_TYPE_date:
                case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                case ModuleTableFieldVO.FIELD_TYPE_enum:
                case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                case ModuleTableFieldVO.FIELD_TYPE_prct:
                    if ((simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL) &&
                        (simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY)) {
                        throw new Error('simple_filters_on_api_type_id filter_type Not implemented :' + simple_filter_on_api_type_id.filter_type +
                            ' for field_id ' + simple_filter_on_api_type_id.field_name + ' of field_type ' + field_type);
                    }

                    // On ajoute la gestion du param_numeric_array, dans le cas d'un intersect (TYPE_NUMERIC_EQUALS_ANY)
                    if ((simple_filter_on_api_type_id.filter_type == ContextFilterVO.TYPE_NUMERIC_EQUALS_ANY) &&
                        (simple_filter_on_api_type_id.param_numeric_array != null)) {
                        if (!Array.isArray(simple_filter_on_api_type_id.param_numeric_array)) {
                            throw new Error('simple_filters_on_api_type_id param_numeric_array must be an array for TYPE_NUMERIC_EQUALS_ANY');
                        }
                        break;
                    }

                    if (simple_filter_on_api_type_id.param_numeric == null) {
                        throw new Error('simple_filters_on_api_type_id only not null param_numeric is supported right now on numbers');
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_html:
                case ModuleTableFieldVO.FIELD_TYPE_textarea:
                case ModuleTableFieldVO.FIELD_TYPE_email:
                case ModuleTableFieldVO.FIELD_TYPE_string:
                case ModuleTableFieldVO.FIELD_TYPE_color:
                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                case ModuleTableFieldVO.FIELD_TYPE_translatable_string:
                case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                case ModuleTableFieldVO.FIELD_TYPE_password:
                case ModuleTableFieldVO.FIELD_TYPE_file_field:
                case ModuleTableFieldVO.FIELD_TYPE_image_field:
                    if ((simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_TEXT_EQUALS_ALL) &&
                        (simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_TEXT_EQUALS_ANY)) {
                        throw new Error('simple_filters_on_api_type_id filter_type Not implemented :' + simple_filter_on_api_type_id.filter_type +
                            ' for field_id ' + simple_filter_on_api_type_id.field_name + ' of field_type ' + field_type);
                    }

                    if (simple_filter_on_api_type_id.param_text == null) {
                        throw new Error('simple_filters_on_api_type_id only not null param_text is supported right now on texts');
                    }
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_boolean:
                    if ((simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL) &&
                        (simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY) &&
                        (simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL) &&
                        (simple_filter_on_api_type_id.filter_type != ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY)) {
                        throw new Error('simple_filters_on_api_type_id filter_type Not implemented :' + simple_filter_on_api_type_id.filter_type +
                            ' for field_id ' + simple_filter_on_api_type_id.field_name + ' of field_type ' + field_type);
                    }
                    break;

                default:
                    throw new Error('simple_filters_on_api_type_id field_type Not implemented' +
                        ' for field_id ' + simple_filter_on_api_type_id.field_name + ' of field_type ' + field_type);
            }
        }

        for (const i in simple_sorts_by_on_api_type_id) {
            if (simple_sorts_by_on_api_type_id[i].vo_type != API_TYPE_ID) {
                throw new Error('simple_sorts_by_on_api_type_id must be on API_TYPE_ID');
            }
        }
    }

    public static assert_compatibility_for_register_single_vo_updates(
        API_TYPE_ID: string,
        vo_id: number,
        field_name: string,
    ) {
        if (!API_TYPE_ID) {
            throw new Error('API_TYPE_ID is mandatory');
        }

        if (!field_name) {
            throw new Error('field_name is mandatory');
        }

        if (!vo_id) {
            throw new Error('vo_id is mandatory');
        }
    }


    public static get_sort_function_for_register_vo_updates(simple_sorts_by_on_api_type_id: SortByVO[]): (a, b) => number {
        const sort_function = (a, b) => {
            if ((!simple_sorts_by_on_api_type_id) || (!simple_sorts_by_on_api_type_id.length)) {
                return a.id - b.id;
            }

            for (const i in simple_sorts_by_on_api_type_id) {
                const sort_by = simple_sorts_by_on_api_type_id[i];

                let compare_a = a[sort_by.field_name];
                let compare_b = b[sort_by.field_name];

                if (!sort_by.sort_asc) {
                    const tmp = compare_a;
                    compare_a = compare_b;
                    compare_b = tmp;
                }

                if (compare_a == compare_b) {
                    continue;
                }

                if (compare_a > compare_b) {
                    return 1;
                }

                return -1;
            }

            return 0;
        };

        return sort_function;
    }

    public static get_room_vo_for_register_vo_updates(API_TYPE_ID: string, simple_filters_on_api_type_id: ContextFilterVO[] = []): {
        _type: string;
    } {
        const room_vo = {
            _type: API_TYPE_ID,
        };
        for (const i in simple_filters_on_api_type_id) {
            const simple_filter_on_api_type_id = simple_filters_on_api_type_id[i];

            const vo_field = ModuleTableController.module_tables_by_vo_type[simple_filter_on_api_type_id.vo_type].get_field_by_id(simple_filter_on_api_type_id.field_name);
            const field_type = vo_field ? vo_field.field_type : ModuleTableFieldVO.FIELD_TYPE_int;
            switch (field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_amount:
                case ModuleTableFieldVO.FIELD_TYPE_float:
                case ModuleTableFieldVO.FIELD_TYPE_int:
                case ModuleTableFieldVO.FIELD_TYPE_date:
                case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                case ModuleTableFieldVO.FIELD_TYPE_enum:
                case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                case ModuleTableFieldVO.FIELD_TYPE_prct:

                    if ((simple_filter_on_api_type_id.param_numeric == null) &&
                        (simple_filter_on_api_type_id.param_numeric_array !== null)) {
                        room_vo[simple_filter_on_api_type_id.field_name] = 'RNGS:' + RangeHandler.translate_to_api(
                            RangeHandler.get_ids_ranges_from_list(simple_filter_on_api_type_id.param_numeric_array));
                        break;
                    }

                    room_vo[simple_filter_on_api_type_id.field_name] = simple_filter_on_api_type_id.param_numeric;
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_html:
                case ModuleTableFieldVO.FIELD_TYPE_textarea:
                case ModuleTableFieldVO.FIELD_TYPE_email:
                case ModuleTableFieldVO.FIELD_TYPE_string:
                case ModuleTableFieldVO.FIELD_TYPE_color:
                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                case ModuleTableFieldVO.FIELD_TYPE_translatable_string:
                case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                case ModuleTableFieldVO.FIELD_TYPE_password:
                case ModuleTableFieldVO.FIELD_TYPE_file_field:
                case ModuleTableFieldVO.FIELD_TYPE_image_field:
                    room_vo[simple_filter_on_api_type_id.field_name] = simple_filter_on_api_type_id.param_text;
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_boolean:
                    room_vo[simple_filter_on_api_type_id.field_name] =
                        (
                            (simple_filter_on_api_type_id.filter_type == ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL) ||
                            (simple_filter_on_api_type_id.filter_type == ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY)
                        ) ? false : true;
                    break;

                default:
                    throw new Error('get_room_vo_for_register_vo_updates field_type Not implemented' +
                        ' for field_id ' + simple_filter_on_api_type_id.field_name + ' of field_type ' + field_type);
            }
        }
        return room_vo;
    }

    public static async unregister_room_id_vo_event_callbacks(room_id: string) {
        const promises = [];
        for (const j in DataSynchroController.vo_events_registration_keys_by_room_id[room_id]) {
            const vo_event_registration_key = DataSynchroController.vo_events_registration_keys_by_room_id[room_id][j];

            promises.push(VOEventRegistrationsHandler.unregister_vo_event_callback(vo_event_registration_key));
        }
        await all_promises(promises);
        delete DataSynchroController.vo_events_registration_keys_by_room_id[room_id];
    }

    public static async unregister_all_vo_event_callbacks() {

        // if (true) { /** FIXME DEBUG */
        //     ConsoleHandler.log('unregister_all_vo_event_callbacks:IN:');
        // }

        const promises = [];
        for (const i in DataSynchroController.vo_events_registration_keys_by_room_id) {
            promises.push(DataSynchroController.unregister_room_id_vo_event_callbacks(i));
        }
        await all_promises(promises);
        DataSynchroController.vo_events_registration_keys_by_room_id = {};

        // if (true) { /** FIXME DEBUG */
        //     ConsoleHandler.log('unregister_all_vo_event_callbacks:OUT:');
        // }
    }

    /**
     * INSERTION TRIÉE DANS LA LISTE (100% TS, 0% Vue)
     */
    public static handle_created_vo_event_callback(
        this_elt: Vue,
        list_name: string,
        sort_function: (a, b) => number,
        created_vo: IDistantVOBase,
        map_name: string = null,
    ): void {

        // ───── Assure l’existence de la liste ─────
        const root: any = this_elt;
        if (map_name) {
            if (!root[map_name]) root[map_name] = {};
            if (!root[map_name][list_name]) root[map_name][list_name] = [];
        } else {
            if (!root[list_name]) root[list_name] = [];
        }
        const list: IDistantVOBase[] = map_name ? root[map_name][list_name] : root[list_name];

        // ───── Ignore si déjà présent ─────
        if (list.findIndex(vo => vo.id === created_vo.id) !== -1) return;

        // ───── Insertion triée ─────
        let insert_index = 0;
        while (insert_index < list.length && sort_function(created_vo, list[insert_index]) > 0) {
            insert_index++;
        }
        list.splice(insert_index, 0, created_vo);
    }
}