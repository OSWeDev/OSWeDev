import { isArray } from 'lodash';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import LocaleManager from '../../../tools/LocaleManager';
import { all_promises } from '../../../tools/PromiseTools';
import RangeHandler from '../../../tools/RangeHandler';
import DatatableField from '../../DAO/vos/datatable/DatatableField';
import ManyToManyReferenceDatatableFieldVO from '../../DAO/vos/datatable/ManyToManyReferenceDatatableFieldVO';
import ManyToOneReferenceDatatableFieldVO from '../../DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import OneToManyReferenceDatatableFieldVO from '../../DAO/vos/datatable/OneToManyReferenceDatatableFieldVO';
import RefRangesReferenceDatatableFieldVO from '../../DAO/vos/datatable/RefRangesReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../DAO/vos/datatable/SimpleDatatableFieldVO';
import FieldFiltersVO from '../../DashboardBuilder/vos/FieldFiltersVO';
import VOFieldRefVO from '../../DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../DataRender/vos/DataFilterOption';
import TSRange from '../../DataRender/vos/TSRange';
import TimeSegment from '../../DataRender/vos/TimeSegment';
import Dates from '../../FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../IDistantVOBase';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import ContextFilterVOManager from '../manager/ContextFilterVOManager';
import ContextFilterVO from '../vos/ContextFilterVO';
import { query } from '../vos/ContextQueryVO';
import ContextQueryFieldVO from '../vos/ContextQueryFieldVO';
import VarConfVO from '../../Var/vos/VarConfVO';

/**
 * ContextFilterVOHandler
 *
 * TODO: For some of the following methods, we should rather use the new ContextFilterVOManager methods
 * TODO: Handlers methods have to be for Handling|Checking rules on ContextFilterVO
 */
export default class ContextFilterVOHandler {

    // MONTHS MIXIN
    public static readonly MONTHS_LABELS = [
        "label.month.janvier",
        "label.month.fevrier",
        "label.month.mars",
        "label.month.avril",
        "label.month.mai",
        "label.month.juin",
        "label.month.juillet",
        "label.month.aout",
        "label.month.septembre",
        "label.month.octobre",
        "label.month.novembre",
        "label.month.decembre"
    ];

    public static readonly DAYS_LABELS = [
        "label.day.dimanche",
        "label.day.lundi",
        "label.day.mardi",
        "label.day.mercredi",
        "label.day.jeudi",
        "label.day.vendredi",
        "label.day.samedi"
    ];

    /**
     * Objectif retrouver les filtres simples (pas de or / xor ou subquery par exemple) d'un vo_type spécifique
     */
    public static get_simple_filters_by_vo_type(filters: ContextFilterVO[], vo_type: string): ContextFilterVO[] {

        let res: ContextFilterVO[] = [];
        for (let i in filters) {
            let filter = filters[i];

            if (filter.vo_type != vo_type) {
                continue;
            }

            switch (filter.filter_type) {
                case ContextFilterVO.TYPE_FILTER_AND:
                case ContextFilterVO.TYPE_FILTER_NOT:
                case ContextFilterVO.TYPE_FILTER_OR:
                case ContextFilterVO.TYPE_FILTER_XOR:
                case ContextFilterVO.TYPE_IN:
                case ContextFilterVO.TYPE_NOT_IN:
                case ContextFilterVO.TYPE_NOT_EXISTS:
                    continue;
            }

            res.push(filter);
        }

        return res;
    }

    /**
     * Objectif retrouver un filtre simple (pas de or / xor ou subquery par exemple) pour identifier par exemple
     *  un filtre sur un champ de segmentation
     *  on checke qu'on a qu'un seul résultat (sinon on est sur un filtre complexe)
     */
    public static get_simple_filter_by_vo_type_and_field_id(filters: ContextFilterVO[], vo_type: string, field_id: string): ContextFilterVO {

        let res = null;
        for (let i in filters) {
            let filter = filters[i];

            if (filter.field_id != field_id) {
                continue;
            }

            if (filter.vo_type != vo_type) {
                continue;
            }

            switch (filter.filter_type) {
                case ContextFilterVO.TYPE_FILTER_AND:
                case ContextFilterVO.TYPE_FILTER_NOT:
                case ContextFilterVO.TYPE_FILTER_OR:
                case ContextFilterVO.TYPE_FILTER_XOR:
                case ContextFilterVO.TYPE_IN:
                case ContextFilterVO.TYPE_NOT_IN:
                case ContextFilterVO.TYPE_NOT_EXISTS:
                    continue;
            }

            if (res) {
                return null;
            }

            res = filter;
        }

        return res;
    }

    /**
     * Context Filter To Readable Ihm
     *  - Human readable context filters
     *
     * @param context_filter {ContextFilterVO}
     */
    public static context_filter_to_readable_ihm(context_filter: ContextFilterVO) {
        switch (context_filter?.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                let unique_set = new Set<string>();
                let res: string = '';

                // case when AND
                const left_hook = context_filter.left_hook;
                const rigth_hook = context_filter.right_hook;

                let ihm_left_hook = ContextFilterVOHandler.context_filter_to_readable_ihm(left_hook);
                let ihm_right_hook = ContextFilterVOHandler.context_filter_to_readable_ihm(rigth_hook);

                // Add dynamic regex checker
                const rgx = RegExp(ihm_right_hook, 'g');
                // Case when iteration may has already been done
                if (rgx.test(ihm_left_hook)) {
                    ihm_right_hook = null;
                }

                unique_set.add(ihm_left_hook);
                if (ihm_right_hook?.length > 0) {
                    unique_set.add(ihm_right_hook);
                }

                const data = Array.from(unique_set);

                res = data.join(' - ');

                return res;

            case ContextFilterVO.TYPE_DATE_MONTH:
                const months_selection: string[] = [];

                // param_numranges of months is e.g. [1, ..., 12]
                RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (month: number) => {
                    months_selection.push(ContextFilterVOHandler.MONTHS_LABELS[month - 1]);
                });

                return months_selection
                    .map((month_label) => LocaleManager.getInstance().label(month_label))
                    .join(', ');

            case ContextFilterVO.TYPE_DATE_YEAR:
                const years_selection: number[] = [];

                // param_numranges of years is e.g. [..., 2020, ..., 2023, ...]
                RangeHandler.foreach_ranges_sync(context_filter.param_numranges, (year: number) => {
                    years_selection.push(year);
                });

                return years_selection.join(', ');

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                // param_textarray of any string is e.g. [..., one_text_1, ..., one_text_2, ...]
                return context_filter.param_textarray?.join(', ');
        }
    }

    /**
     * Is Conditional Context Filter
     *
     * @param {ContextFilterVO} context_filter
     * @returns {boolean}
     */
    public static is_conditional_context_filter(context_filter: ContextFilterVO): boolean {
        const conditional_types = [
            ContextFilterVO.TYPE_FILTER_AND,
            ContextFilterVO.TYPE_FILTER_OR,
            ContextFilterVO.TYPE_FILTER_XOR,
        ];

        return conditional_types.find((t: number) => t == context_filter?.filter_type) != null;
    }

    /**
     * Merge Context Filter VOs
     *
     * @param {ContextFilterVO} merge_from
     * @param {ContextFilterVO} merge_with
     * @param {boolean} try_union
     * @returns {ContextFilterVO}
     */
    public static merge_context_filter_vos(merge_from: ContextFilterVO, merge_with: ContextFilterVO, try_union: boolean = false): ContextFilterVO {
        if (!merge_from) {
            return merge_with;
        }

        if (!merge_with) {
            return merge_from;
        }

        if (merge_from.filter_type == merge_with.filter_type) {
            if (merge_from.param_numranges && merge_with.param_numranges) {
                merge_from.param_numranges = merge_from.param_numranges.concat(merge_with.param_numranges);
                if (try_union) {
                    merge_from.param_numranges = RangeHandler.getRangesUnion(merge_from.param_numranges);
                }
                return merge_from;
            }

            if (merge_from.param_tsranges && merge_with.param_tsranges) {
                merge_from.param_tsranges = merge_from.param_tsranges.concat(merge_with.param_tsranges);
                if (try_union) {
                    merge_from.param_tsranges = RangeHandler.getRangesUnion(merge_from.param_tsranges);
                }
                return merge_from;
            }

            if (merge_from.param_textarray && merge_with.param_textarray) {
                if (!merge_from.param_textarray.length) {
                    merge_from.param_textarray = merge_with.param_textarray;
                } else if (!merge_with.param_textarray.length) {
                } else {
                    merge_from.param_textarray = merge_from.param_textarray.concat(merge_with.param_textarray);
                }
                return merge_from;
            }

            /**
             * On doit gérer les merges booleans, en supprimant potentiellement la condition
             *  (par exemple si on merge un true any avec un false any par définition c'est juste plus un filtre)
             */
            switch (merge_from.filter_type) {
                case ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY:
                    throw new Error('Not Implemented');
                case ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL:
                    throw new Error('Not Implemented');

                case ContextFilterVO.TYPE_TEXT_INCLUDES_ALL:

                default:
                    break;
            }
        }

        return merge_from;
    }

    /**
     * Add context_filter to the root, using the and/or/xor .... type of operator if necessary
     * Returns the new root
     * @deprecated use ContextFilterVOManager.add_context_filter_to_tree
     */
    public static add_context_filter_to_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_add: ContextFilterVO, operator_type: number = ContextFilterVO.TYPE_FILTER_AND): ContextFilterVO {
        return ContextFilterVOManager.add_context_filter_to_tree(context_filter_tree_root, context_filter_to_add, operator_type);
    }

    /**
     *
     * @deprecated use ContextFilterVOManager.find_context_filter_in_tree
     * @param context_filter_tree_root
     * @param context_filter_to_find
     * @returns
     */
    public static find_context_filter_in_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_find: ContextFilterVO): boolean {
        return ContextFilterVOManager.find_context_filter_in_tree(context_filter_tree_root, context_filter_to_find);
    }

    public static async get_datatable_row_field_data_async(
        raw_data: IDistantVOBase, resData: any, field: DatatableField<any, any>, context_query_field: ContextQueryFieldVO
    ): Promise<any> {

        try {
            field.auto_update_datatable_field_uid_with_vo_type();

            switch (field.type) {

                case DatatableField.CRUD_ACTIONS_FIELD_TYPE:
                    resData[field.datatable_field_uid] = raw_data[field.datatable_field_uid];
                    break;

                case DatatableField.SIMPLE_FIELD_TYPE:
                    let simpleField: SimpleDatatableFieldVO<any, any> = (field) as SimpleDatatableFieldVO<any, any>;
                    let module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        simpleField.moduleTableField.module_table.vo_type + '___' + simpleField.moduleTableField.field_id :
                        simpleField.moduleTableField.field_id;

                    // On doit gérer le cas des champs aggrégés en divisant la valeur et en refaisant l'aggrégation par la suite
                    // FIXME : Est-ce qu'on ne devrait pas gérer ce cas aussi pour les COMPUTED_FIELD_TYPE, COMPONENT_FIELD_TYPE, FILE_FIELD_TYPE, MANY_TO_ONE_FIELD_TYPE, ... ?
                    if (context_query_field && (context_query_field.aggregator != VarConfVO.NO_AGGREGATOR) && (context_query_field.aggregator != VarConfVO.IS_NULLABLE_AGGREGATOR)) {

                        let raw_value = raw_data[module_table_field_id + '__raw'];
                        if (raw_value && Array.isArray(raw_value)) {

                            let res_data = [];
                            let saved_raw_data_field = raw_value;
                            // let saved_data_field = raw_data[module_table_field_id];
                            for (let i in raw_value) {
                                let value = raw_value[i];
                                raw_data[module_table_field_id + '__raw'] = value;
                                raw_data[module_table_field_id] = value;
                                res_data.push(ContextFilterVOHandler.get_simple_field_value(simpleField, module_table_field_id, raw_data));
                            }

                            raw_data[module_table_field_id + '__raw'] = saved_raw_data_field;
                            resData[field.datatable_field_uid] = res_data;

                            break;
                        }
                    }

                    resData[field.datatable_field_uid] = ContextFilterVOHandler.get_simple_field_value(simpleField, module_table_field_id, raw_data);
                    break;

                case DatatableField.COMPUTED_FIELD_TYPE:
                    resData[field.datatable_field_uid] = field.dataToReadIHM(null, raw_data);
                    break;

                case DatatableField.COMPONENT_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.FILE_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    let manyToOneField: ManyToOneReferenceDatatableFieldVO<any> = (field) as ManyToOneReferenceDatatableFieldVO<any>;

                    let src_module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        manyToOneField.srcField.module_table.vo_type + '___' + manyToOneField.srcField.field_id :
                        manyToOneField.srcField.field_id;

                    // On va chercher la valeur du champs depuis la valeur de la donnée liée
                    if (!!raw_data[src_module_table_field_id]) {
                        let ref_data: IDistantVOBase = await query(manyToOneField.targetModuleTable.vo_type)
                            .filter_by_id(raw_data[src_module_table_field_id])
                            .select_vo();
                        resData[field.datatable_field_uid] = manyToOneField.dataToHumanReadable(ref_data);
                        resData[field.datatable_field_uid + "___id___"] = raw_data[src_module_table_field_id];
                        resData[field.datatable_field_uid + "___type___"] = manyToOneField.targetModuleTable.vo_type;
                    }
                    break;

                case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                    let oneToManyField: OneToManyReferenceDatatableFieldVO<any> = (field) as OneToManyReferenceDatatableFieldVO<any>;

                    resData[field.datatable_field_uid] = [];

                    // if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                    //     for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                    //         resData[field.datatable_field_uid].push({
                    //             id: oneToManyTargetId,
                    //             label: oneToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                    //         });
                    //     }
                    // }

                    if (!!raw_data[field.datatable_field_uid]) {
                        let vo_ids: any[] = raw_data[field.datatable_field_uid];

                        if (!isArray(vo_ids)) {
                            vo_ids = [vo_ids];
                        }

                        let promises = [];

                        for (let i in vo_ids) {
                            promises.push((async () => {
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type)
                                    .filter_by_id(vo_ids[i])
                                    .select_vo();

                                resData[field.datatable_field_uid].push({
                                    id: ref_data.id,
                                    label: manyToManyField.dataToHumanReadable(ref_data)
                                });
                            })());
                        }

                        await all_promises(promises);
                    }
                    break;

                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                    let manyToManyField: ManyToManyReferenceDatatableFieldVO<any, any> = (field) as ManyToManyReferenceDatatableFieldVO<any, any>;

                    resData[field.datatable_field_uid] = [];

                    // if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                    //     for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                    //         resData[field.datatable_field_uid].push({
                    //             id: oneToManyTargetId,
                    //             label: manyToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                    //         });
                    //     }
                    // }

                    if (!!raw_data[field.datatable_field_uid]) {
                        let vo_ids: any[] = raw_data[field.datatable_field_uid];

                        if (!isArray(vo_ids)) {
                            vo_ids = [vo_ids];
                        }

                        let promises = [];

                        for (let i in vo_ids) {
                            promises.push((async () => {
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type)
                                    .filter_by_id(vo_ids[i])
                                    .select_vo();

                                resData[field.datatable_field_uid].push({
                                    id: ref_data.id,
                                    label: manyToManyField.dataToHumanReadable(ref_data)
                                });
                            })());
                        }

                        await all_promises(promises);
                    }

                    break;

                case DatatableField.REF_RANGES_FIELD_TYPE:
                    let refField: RefRangesReferenceDatatableFieldVO<any> = (field) as RefRangesReferenceDatatableFieldVO<any>;

                    resData[field.datatable_field_uid] = [];

                    let refField_src_module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        refField.srcField.module_table.vo_type + '___' + refField.srcField.field_id + '__raw' : // We are waiting for the actual converted NumRange[] value
                        refField.srcField.field_id;

                    await RangeHandler.foreach_ranges_batch_await(raw_data[refField_src_module_table_field_id], async (id: number) => {
                        let ref_data: IDistantVOBase = await query(refField.targetModuleTable.vo_type)
                            .filter_by_id(id)
                            .select_vo();

                        resData[field.datatable_field_uid].push({
                            id: id,
                            label: refField.dataToHumanReadable(ref_data)
                        });
                    });
                    break;

                default:
                    break;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            resData[field.datatable_field_uid] = null;
        }

        return resData;
    }

    public static get_active_field_filters(filters: ContextFilterVO[]): FieldFiltersVO {
        let res: FieldFiltersVO = {};

        for (let i in filters) {
            let filter = filters[i];

            if (!res[filter.vo_type]) {
                res[filter.vo_type] = {};
            }
            res[filter.vo_type][filter.field_id] = filter;
        }

        return res;
    }

    /**
     * find_context_filter_by_type
     *
     * @param context_filter_tree_root
     * @param type
     * @returns the context_filter that has the asked type from the tree_root
     */
    public static find_context_filter_by_type(context_filter_tree_root: ContextFilterVO, type: number): ContextFilterVO {
        if (context_filter_tree_root && (context_filter_tree_root.filter_type != type) && context_filter_tree_root.left_hook && context_filter_tree_root.right_hook) {
            return ContextFilterVOHandler.find_context_filter_by_type(context_filter_tree_root.left_hook, type) || ContextFilterVOHandler.find_context_filter_by_type(context_filter_tree_root.right_hook, type);
        }

        if (context_filter_tree_root.filter_type != type) {
            return null;
        }

        return context_filter_tree_root;
    }

    /**
     * Remove the context_filter_to_delete from context_filter_tree_root and returns the new root
     * Need to ask the deletion with the real contextfilter object and not a description or clone of it.
     * Tests are done on the objects adresses, not deeply on the contents.
     *
     * @param context_filter_tree_root
     * @param context_filter_to_delete
     * @returns
     */
    public static remove_context_filter_from_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_delete: ContextFilterVO): ContextFilterVO {

        if ((!context_filter_tree_root) || (!context_filter_to_delete)) {
            return null;
        }

        // beware this is no deep check
        if (context_filter_tree_root == context_filter_to_delete) {
            return null;
        }

        if (!context_filter_tree_root.left_hook) {
            /**
             * On est sur une feuille et c'est pas celle qu'on cherche, on la renvoie
             */
            return context_filter_tree_root;
        }

        if (context_filter_tree_root.left_hook == context_filter_to_delete) {
            return context_filter_tree_root.right_hook;
        }

        if (context_filter_tree_root.right_hook == context_filter_to_delete) {
            return context_filter_tree_root.left_hook;
        }

        /**
         * On tente la suppression à gauche. si on récupère un null, on doit renvoyer le hook_right en guise de nouveau root à ce niveau
         */
        let left_hook_replacement = ContextFilterVOHandler.remove_context_filter_from_tree(context_filter_tree_root.left_hook, context_filter_to_delete);
        if (!left_hook_replacement) {
            return context_filter_tree_root.right_hook;
        }
        if (left_hook_replacement != context_filter_tree_root.left_hook) {
            context_filter_tree_root.left_hook = left_hook_replacement;
            return context_filter_tree_root;
        }

        let right_hook_replacement = ContextFilterVOHandler.remove_context_filter_from_tree(context_filter_tree_root.right_hook, context_filter_to_delete);
        if ((!right_hook_replacement) && (context_filter_tree_root.right_hook)) {
            return context_filter_tree_root.left_hook;
        }
        if (right_hook_replacement != context_filter_tree_root.right_hook) {
            context_filter_tree_root.right_hook = right_hook_replacement;
        }

        return context_filter_tree_root;
    }

    /**
     * Renvoie une context query qui renvoie systématiquement 0 éléments, pour bloquer l'accès à un vo par exemple dans un context access hook
     */
    public static get_empty_res_context_hook_query(api_type_id: string) {
        // on veut rien renvoyer, donc on fait une query qui retourne rien
        let filter_none: ContextFilterVO = new ContextFilterVO();
        filter_none.filter_type = ContextFilterVO.TYPE_NULL_ALL;
        filter_none.field_id = 'id';
        filter_none.vo_type = api_type_id;

        return query(api_type_id).field('id').set_query_distinct().add_filters([filter_none]).exec_as_server();
    }

    public static add_context_filters_exclude_values(
        exclude_values: DataFilterOption[],
        vo_field_ref: VOFieldRefVO,
        query_filters: ContextFilterVO[],
        concat_exclude_values: boolean
    ): ContextFilterVO[] {
        if (!exclude_values || !exclude_values.length) {
            return query_filters;
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[vo_field_ref.api_type_id];
        let field = moduletable.get_field_by_id(vo_field_ref.field_id);

        let exclude_values_context_filter: ContextFilterVO = null;

        // On parcourt toutes les valeurs à exclure pour créer le ContextFilter
        for (let j in exclude_values) {
            let active_option = exclude_values[j];

            let new_exclude_values = ContextFilterVOHandler.get_ContextFilterVO_from_DataFilterOption(active_option, null, field, vo_field_ref);

            if (!new_exclude_values) {
                continue;
            }

            if (!exclude_values_context_filter) {
                exclude_values_context_filter = new_exclude_values;
            } else {
                exclude_values_context_filter = ContextFilterVOHandler.merge_context_filter_vos(exclude_values_context_filter, new_exclude_values, false);
            }
        }

        // Changer le filter_type pour dire ne pas prendre en compte
        exclude_values_context_filter.filter_type = ContextFilterVOHandler.get_ContextFilterVO_None(field, vo_field_ref);

        let new_query_filters: ContextFilterVO[] = [];
        let is_add: boolean = false;

        // On le rajoute à la query
        if (query_filters) {

            for (let i in query_filters) {
                if ((query_filters[i].field_id == vo_field_ref.field_id) && (query_filters[i].vo_type == vo_field_ref.api_type_id)) {
                    if (concat_exclude_values) {
                        is_add = true;
                        new_query_filters.push(ContextFilterVO.and([query_filters[i], exclude_values_context_filter]));
                    }
                    continue;
                }

                new_query_filters.push(query_filters[i]);
            }
        }

        if (!is_add) {
            new_query_filters.push(exclude_values_context_filter);
        }

        return new_query_filters;
    }

    public static get_ContextFilterVO_None(field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO): number {
        let field_type = null;

        if ((!field) && (vo_field_ref.field_id == 'id')) {
            field_type = ModuleTableField.FIELD_TYPE_int;
        } else {
            field_type = field.field_type;
        }

        switch (field_type) {
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_prct:
                return ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS;

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                return ContextFilterVO.TYPE_TEXT_EQUALS_NONE;

            case ModuleTableField.FIELD_TYPE_enum:
                return ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS;

            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            case ModuleTableField.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');


            default:
                throw new Error('Not Implemented');
        }
    }

    /**
     * @deprecated We must use a Factory to create Objects depending on properties (the right way)
     * @use ContextFilterVOManager.create_context_filter_from_data_filter_option instead
     */
    public static get_ContextFilterVO_from_DataFilterOption(active_option: DataFilterOption, ts_range: TSRange, field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO): ContextFilterVO {
        return ContextFilterVOManager.create_context_filter_from_data_filter_option(active_option, ts_range, field, vo_field_ref);
    }

    /**
     * Objectif renvoyer la liste des ts_ranges qui correspondent au filtrage du contexte
     * @param context_filter_root le filtre racine du contexte
     * @param target_segment_type le type de segmentation à appliquer sur les ts_ranges
     * @param limit la limite de ts_ranges à renvoyer
     * @param order_asc ordre ascendant ou descendant sur les ts_ranges - pour appliquer la limite
     * @returns
     */
    public static get_ts_ranges_from_context_filter_root(
        context_filter_root: ContextFilterVO,
        target_segment_type: number,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        /**
         * On doit d'abord identifier les filtres par type de filtre date :
         *  - à chaque étape, on recrée un nouveau ts_ranges, avec les ranges de la segmentation de l'étape, et on limite à la limite en param, et on ordonne par l'ordre en param
         *  - en priorité on appliquera l'année (obligatoire pour générer les ts_ranges) ou année glissante. Si on a un filtre année et année glissante => erreur. Si on a aucun des deux => erreur.
         *  - ensuite, en fonction de la segmentation cible en sortie :
         *      - si on a une segmentation année (> mois) et un contexte de filtre qui s'applique au mois, on ignore le contexte de filtre et on renvoie les ts_ranges déjà identifiés
         *      - si on a une segmentation mois ou < mois et un contexte de filtre qui s'applique au mois, on applique le contexte de filtre
         *  - ainsi de suite en appliquant dans l'ordre :
         *    - année / mois / dom / heure / minute / seconde
         *
         *  - à la fin on prend le ts_ranges généré et on le déploie en fonction de la segmentation cible en sortie, si elle est différente de la segmentation actuelle
         */

        // On se simplifie la vie en ne gérant que les certains types de filtres, et uniquement si ils sont uniques pour chaque segmentation
        /**
         *  - 2 types valides pour le moment :
         *    - Soit on a un ou des filtres de type TYPE_DATE_INTERSECTS et rien d'autre
         *    - Soit on a :
         *      - au maximum 1 filtre par type de segmentation
         *      - exactement 1 filtre de type année ou année glissante
         *      - pas de OU
         */
        let has_only_TYPE_DATE_INTERSECTS: boolean = ContextFilterVOHandler.check_context_filter_root_has_only_TYPE_DATE_INTERSECTS(context_filter_root);

        if (has_only_TYPE_DATE_INTERSECTS) {
            return ContextFilterVOHandler.get_ts_ranges_from_context_filter_root_using_TYPE_DATE_INTERSECTS(
                context_filter_root,
                target_segment_type,
                limit,
                order_asc);
        } else {
            return ContextFilterVOHandler.get_ts_ranges_from_context_filter_root_using_ymwddhms_filters(
                context_filter_root,
                target_segment_type,
                limit,
                order_asc);
        }
    }

    /**
     * This function gets a set of timestamp ranges from the context filter root using TYPE_DATE_INTERSECTS.
     * @param {ContextFilterVO} context_filter_root The context filter root.
     * @param {number} target_segment_type The target segment type.
     * @param {number} [limit=10] The limit of timestamp ranges to be returned.
     * @param {boolean} [order_asc=true] Indicates whether the timestamp ranges should be ordered in ascending order.
     * @returns {TSRange[]} An array of timestamp ranges.
     */
    public static get_ts_ranges_from_context_filter_root_using_TYPE_DATE_INTERSECTS(
        context_filter_root: ContextFilterVO,
        target_segment_type: number,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        let ts_ranges: TSRange[] = [];

        RangeHandler.foreach_ranges_sync(context_filter_root.param_tsranges, (ts: number) => {

            if (ts_ranges.length >= limit) {
                return false;
            }

            ts_ranges.push(RangeHandler.create_single_elt_TSRange(ts, target_segment_type));
        }, target_segment_type, null, null, !order_asc);
        ts_ranges = RangeHandler.getRangesUnion(ts_ranges);

        return ts_ranges;
    }

    public static get_ts_ranges_from_context_filter_root_using_ymwddhms_filters(
        context_filter_root: ContextFilterVO,
        target_segment_type: number,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {


        const {
            year_filter,
            month_filter,
            // week_filter, On peut pas appliquer si facilement un filtre sur la semaine, en // d'un filtre sur le mois, par ce qu'on peut pas définir qu'on limite aux 3 premiers mois, puis qu'on trouvera les 3 premieres semaines dans ces mois...
            // dow_filter,
            // dom_filter, // Dans la même veine, on a un cas avec le filtre dom, si on choisit de filtrer sur le 31 du mois, en fait on aura peut-être limité aux 3 premiers mois, et on va trouver que 2 jours à la fin... donc techniquement ce cas marche pas
            hour_filter,
            minute_filter,
            second_filter
        } = ContextFilterVOHandler.assert_context_filter_root_is_valid_and_get_filters(context_filter_root, target_segment_type);

        // On commence par l'année. On sait que le filtre existe et est unique

        let ts_ranges: TSRange[] = ContextFilterVOHandler.get_ts_ranges_from_year_filter(year_filter, limit, order_asc);
        if (target_segment_type == TimeSegment.TYPE_YEAR) {
            return ts_ranges;
        }

        // Attention en order_asc false, on doit remettre l'array dans le bon sens avant de continuer
        if (!order_asc) {
            ts_ranges = ts_ranges.reverse();
        }
        ts_ranges = ContextFilterVOHandler.get_filter_ts_ranges_month_from_year(ts_ranges, month_filter, limit, order_asc);
        if (target_segment_type == TimeSegment.TYPE_MONTH) {
            return ts_ranges;
        }

        if (!order_asc) {
            ts_ranges = ts_ranges.reverse();
        }
        ts_ranges = ContextFilterVOHandler.get_filter_ts_ranges_day_from_month(ts_ranges, null, limit, order_asc);
        if (target_segment_type == TimeSegment.TYPE_DAY) {
            return ts_ranges;
        }

        if (!order_asc) {
            ts_ranges = ts_ranges.reverse();
        }
        ts_ranges = ContextFilterVOHandler.get_filter_ts_ranges_hour_from_day(ts_ranges, hour_filter, limit, order_asc);
        if (target_segment_type == TimeSegment.TYPE_HOUR) {
            return ts_ranges;
        }

        if (!order_asc) {
            ts_ranges = ts_ranges.reverse();
        }
        ts_ranges = ContextFilterVOHandler.get_filter_ts_ranges_minute_from_hour(ts_ranges, minute_filter, limit, order_asc);
        if (target_segment_type == TimeSegment.TYPE_MINUTE) {
            return ts_ranges;
        }

        if (!order_asc) {
            ts_ranges = ts_ranges.reverse();
        }
        ts_ranges = ContextFilterVOHandler.get_filter_ts_ranges_second_from_minute(ts_ranges, second_filter, limit, order_asc);
        if (target_segment_type == TimeSegment.TYPE_SECOND) {
            return ts_ranges;
        }

        throw new Error('Should not be here');
    }

    private static get_filter_ts_ranges_minute_from_hour(
        ordered_hour_ts_ranges: TSRange[],
        minute_filter: ContextFilterVO,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        let res: TSRange[] = [];

        if (!minute_filter) {
            RangeHandler.foreach_ranges_sync(ordered_hour_ts_ranges, (minute_ts: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(minute_ts, TimeSegment.TYPE_MINUTE));

            }, TimeSegment.TYPE_MINUTE, null, null, !order_asc);

            return res;
        }

        RangeHandler.foreach_ranges_sync(ordered_hour_ts_ranges, (hour_ts: number) => {
            RangeHandler.foreach_ranges_sync(minute_filter.param_numranges, (minute: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(
                    Dates.hour(hour_ts, minute), TimeSegment.TYPE_MINUTE));
            }, TimeSegment.TYPE_MINUTE, null, null, !order_asc);
        }, TimeSegment.TYPE_HOUR, null, null, !order_asc);

        return res;
    }

    private static get_filter_ts_ranges_second_from_minute(
        ordered_minute_ts_ranges: TSRange[],
        second_filter: ContextFilterVO,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        let res: TSRange[] = [];

        if (!second_filter) {
            RangeHandler.foreach_ranges_sync(ordered_minute_ts_ranges, (second_ts: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(second_ts, TimeSegment.TYPE_SECOND));

            }, TimeSegment.TYPE_SECOND, null, null, !order_asc);

            return res;
        }

        RangeHandler.foreach_ranges_sync(ordered_minute_ts_ranges, (minute_ts: number) => {
            RangeHandler.foreach_ranges_sync(second_filter.param_numranges, (second: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(
                    Dates.hour(minute_ts, second), TimeSegment.TYPE_SECOND));
            }, TimeSegment.TYPE_SECOND, null, null, !order_asc);
        }, TimeSegment.TYPE_MINUTE, null, null, !order_asc);

        return res;
    }

    private static get_filter_ts_ranges_hour_from_day(
        ordered_day_ts_ranges: TSRange[],
        hour_filter: ContextFilterVO,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        let res: TSRange[] = [];

        if (!hour_filter) {
            RangeHandler.foreach_ranges_sync(ordered_day_ts_ranges, (hour_ts: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(hour_ts, TimeSegment.TYPE_HOUR));

            }, TimeSegment.TYPE_HOUR, null, null, !order_asc);

            return res;
        }

        RangeHandler.foreach_ranges_sync(ordered_day_ts_ranges, (day_ts: number) => {
            RangeHandler.foreach_ranges_sync(hour_filter.param_numranges, (hour: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(
                    Dates.hour(day_ts, hour), TimeSegment.TYPE_HOUR));
            }, TimeSegment.TYPE_HOUR, null, null, !order_asc);
        }, TimeSegment.TYPE_DAY, null, null, !order_asc);

        return res;
    }

    private static get_filter_ts_ranges_day_from_month(
        ordered_month_ts_ranges: TSRange[],
        dom_filter: ContextFilterVO,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        let res: TSRange[] = [];

        if (!dom_filter) {
            RangeHandler.foreach_ranges_sync(ordered_month_ts_ranges, (day_ts: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(day_ts, TimeSegment.TYPE_DAY));

            }, TimeSegment.TYPE_DAY, null, null, !order_asc);

            return res;
        }

        RangeHandler.foreach_ranges_sync(ordered_month_ts_ranges, (month_ts: number) => {
            RangeHandler.foreach_ranges_sync(dom_filter.param_numranges, (dom: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(
                    Dates.date(month_ts, dom), TimeSegment.TYPE_DAY));
            }, TimeSegment.TYPE_DAY, null, null, !order_asc);
        }, TimeSegment.TYPE_MONTH, null, null, !order_asc);

        return res;
    }

    private static get_ts_ranges_from_year_filter(
        year_filter: ContextFilterVO,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        let res: TSRange[] = [];

        RangeHandler.foreach_ranges_sync(year_filter.param_numranges, (year: number) => {

            if (res.length >= limit) {
                // en retournant false, on arrête le foreach
                return false;
            }

            res.push(RangeHandler.create_single_elt_TSRange(Dates.year(0, year), TimeSegment.TYPE_YEAR));
        }, TimeSegment.TYPE_YEAR, null, null, !order_asc);

        return res;
    }

    private static get_filter_ts_ranges_month_from_year(
        ordered_year_ts_ranges: TSRange[],
        month_filter: ContextFilterVO,
        limit: number = 10,
        order_asc: boolean = true): TSRange[] {

        let res: TSRange[] = [];

        if (!month_filter) {
            RangeHandler.foreach_ranges_sync(ordered_year_ts_ranges, (month_ts: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(month_ts, TimeSegment.TYPE_MONTH));

            }, TimeSegment.TYPE_MONTH, null, null, !order_asc);

            return res;
        }

        RangeHandler.foreach_ranges_sync(ordered_year_ts_ranges, (year_ts: number) => {
            RangeHandler.foreach_ranges_sync(month_filter.param_numranges, (month: number) => {

                if (res.length >= limit) {
                    // en retournant false, on arrête le foreach
                    return false;
                }

                res.push(RangeHandler.create_single_elt_TSRange(
                    Dates.month(year_ts, month - 1), TimeSegment.TYPE_MONTH));
            }, TimeSegment.TYPE_MONTH, null, null, !order_asc);
        }, TimeSegment.TYPE_YEAR, null, null, !order_asc);

        return res;
    }

    /**
     * On fixe quelques règles pour rester sur un système pas trop complexe pour la génération des ts_ranges :
     *    - On doit avoir :
     *      - au maximum 1 filtre par type de segmentation
     *      - exactement 1 filtre de type année ou année glissante
     *      - pas de OU
     * @param context_filter_root
     */
    private static assert_context_filter_root_is_valid_and_get_filters(
        context_filter_root: ContextFilterVO,
        segment_type: number): {
            year_filter: ContextFilterVO,
            month_filter: ContextFilterVO,
            // week_filter: ContextFilterVO,
            // dow_filter: ContextFilterVO,
            // dom_filter: ContextFilterVO,
            hour_filter: ContextFilterVO,
            minute_filter: ContextFilterVO,
            second_filter: ContextFilterVO
        } {
        if (!context_filter_root) {
            throw new Error('ContextFilterVO is null');
        }

        let year_filter: ContextFilterVO = null;
        // let rolling_year_filter: ContextFilterVO = null;

        let month_filter: ContextFilterVO = null;
        // let week_filter: ContextFilterVO = null;
        // let dow_filter: ContextFilterVO = null;
        // let dom_filter: ContextFilterVO = null;
        let hour_filter: ContextFilterVO = null;
        let minute_filter: ContextFilterVO = null;
        let second_filter: ContextFilterVO = null;

        let current_filter: ContextFilterVO = context_filter_root;
        let next_filters: ContextFilterVO[] = [];
        while (current_filter) {

            switch (current_filter.filter_type) {
                case ContextFilterVO.TYPE_DATE_YEAR:
                    if (year_filter) {
                        throw new Error('Too many year filters');
                    }
                    //     if (rolling_year_filter) {
                    //         throw new Error('Year and rolling year filters cannot be used together');
                    //     }

                    if ((!current_filter.param_numranges) || (!current_filter.param_numranges)) {
                        throw new Error('Year filter without num_ranges is not supported');
                    }

                    year_filter = current_filter;
                    break;
                // case ContextFilterVO.TYPE_DATE_ROLLING_YEAR:
                //     if (rolling_year_filter) {
                //         throw new Error('Too many rolling year filters');
                //     }
                //     if (year_filter) {
                //         throw new Error('Year and rolling year filters cannot be used together');
                //     }
                //     rolling_year_filter = current_filter;
                //     break;
                case ContextFilterVO.TYPE_DATE_MONTH:
                    if (month_filter) {
                        throw new Error('Too many month filters');
                    }

                    if ((!current_filter.param_numranges) || (!current_filter.param_numranges)) {
                        throw new Error('Month filter without num_ranges is not supported');
                    }

                    if ((segment_type >= TimeSegment.TYPE_MONTH) &&
                        (segment_type != TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)) {
                        month_filter = current_filter;
                    }

                    break;
                // case ContextFilterVO.TYPE_DATE_WEEK:
                //     if (week_filter) {
                //         throw new Error('Too many week filters');
                //     }

                //     if ((!week_filter.param_numranges) || (!week_filter.param_numranges)) {
                //         throw new Error('Week filter without num_ranges is not supported');
                //     }

                //     if ((segment_type >= TimeSegment.TYPE_WEEK) &&
                //         (segment_type != TimeSegment.TYPE_ROLLING_YEAR_MONTH_START)) {
                //         week_filter = current_filter;
                //     }

                //     break;
                // case ContextFilterVO.TYPE_DATE_DOW:
                //     if (dow_filter) {
                //         throw new Error('Too many dow filters');
                //     }

                //     if ((!dow_filter.param_numranges) || (!dow_filter.param_numranges)) {
                //         throw new Error('Dow filter without num_ranges is not supported');
                //     }

                //     if ((segment_type >= TimeSegment.TYPE_DAY) &&
                //         (segment_type != TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) &&
                //         (segment_type != TimeSegment.TYPE_WEEK)) {
                //         dow_filter = current_filter;
                //     }

                //     break;
                // case ContextFilterVO.TYPE_DATE_DOM:
                //     if (dom_filter) {
                //         throw new Error('Too many dom filters');
                //     }

                //     if ((!dom_filter.param_numranges) || (!dom_filter.param_numranges)) {
                //         throw new Error('Dom filter without num_ranges is not supported');
                //     }

                //     // On a un problème avec le filtre dom, si on choisit de filtrer sur le 31 du mois, en fait on aura peut-être limité aux 3 premiers mois, et on va trouver que 2 jours à la fin... donc techniquement ce cas marche pas

                //     if ((segment_type >= TimeSegment.TYPE_DAY) &&
                //         (segment_type != TimeSegment.TYPE_ROLLING_YEAR_MONTH_START) &&
                //         (segment_type != TimeSegment.TYPE_WEEK)) {
                //         dom_filter = current_filter;
                //     }

                //     break;
                case ContextFilterVO.TYPE_HOUR_INTERSECTS:
                    if (hour_filter) {
                        throw new Error('Too many hour filters');
                    }

                    if ((!current_filter.param_numranges) || (!current_filter.param_numranges)) {
                        throw new Error('Hour filter without num_ranges is not supported');
                    }

                    if (segment_type >= TimeSegment.TYPE_HOUR) {
                        hour_filter = current_filter;
                    }

                    break;

                case ContextFilterVO.TYPE_MINUTE_INTERSECTS:
                    if (minute_filter) {
                        throw new Error('Too many minute filters');
                    }

                    if ((!current_filter.param_numranges) || (!current_filter.param_numranges)) {
                        throw new Error('Minute filter without num_ranges is not supported');
                    }

                    if (segment_type >= TimeSegment.TYPE_MINUTE) {
                        minute_filter = current_filter;
                    }

                    break;

                case ContextFilterVO.TYPE_SECOND_INTERSECTS:
                    if (second_filter) {
                        throw new Error('Too many second filters');
                    }

                    if ((!current_filter.param_numranges) || (!current_filter.param_numranges)) {
                        throw new Error('Second filter without num_ranges is not supported');
                    }

                    if (segment_type >= TimeSegment.TYPE_SECOND) {
                        second_filter = current_filter;
                    }

                    break;

                case ContextFilterVO.TYPE_FILTER_AND:
                    next_filters.push(current_filter.left_hook);
                    next_filters.push(current_filter.right_hook);
                    break;
                case ContextFilterVO.TYPE_FILTER_OR:
                    throw new Error('OR conditions not supported');
                default:
                    throw new Error('Filter type not supported');
            }

            current_filter = next_filters.shift();
        }

        return {
            year_filter,
            month_filter,
            // week_filter,
            // dow_filter,
            // dom_filter,
            hour_filter,
            minute_filter,
            second_filter
        };
    }

    /**
     * Objectif renvoyer la liste des ts_ranges qui correspondent au filtrage du contexte
     * @param context_filter_root le filtre racine du contexte
     * @param target_segment_type le type de segmentation à appliquer sur les ts_ranges
     * @param limit la limite de ts_ranges à renvoyer
     * @param order_asc ordre ascendant ou descendant sur les ts_ranges - pour appliquer la limite
     * @returns
     */
    private static check_context_filter_root_has_only_TYPE_DATE_INTERSECTS(context_filter: ContextFilterVO) {

        while (context_filter) {

            switch (context_filter.filter_type) {
                case ContextFilterVO.TYPE_DATE_INTERSECTS:
                    return true;
                // case ContextFilterVO.TYPE_FILTER_AND:
                // case ContextFilterVO.TYPE_FILTER_OR:
                //     return ContextFilterVOHandler.check_context_filter_root_has_only_TYPE_DATE_INTERSECTS(context_filter.left_hook) && ContextFilterVOHandler.check_context_filter_root_has_only_TYPE_DATE_INTERSECTS(context_filter.right_hook);
                //     break;
                default:
                    return false;
            }
        }
    }

    private static get_simple_field_value(simpleField: SimpleDatatableFieldVO<any, any>, module_table_field_id: string, raw_data: IDistantVOBase) {
        if (simpleField.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) {
            let raw_value = raw_data[module_table_field_id + '__raw'];
            return RangeHandler.humanizeRanges(raw_value);
        }

        let value = simpleField.dataToReadIHM(raw_data[module_table_field_id], raw_data);
        // Limite à 300 cars si c'est du html et strip html
        if (simpleField.field_type == ModuleTableField.FIELD_TYPE_html) {

            if (value) {
                try {
                    value = value.replace(/&nbsp;/gi, ' ');
                    value = value.replace(/<\/div>/gi, '\n');
                    value = value.replace(/<\/span>/gi, '\n');
                    value = value.replace(/<\/ul>/gi, '\n');
                    value = value.replace(/<\/li>/gi, '\n');
                    value = value.replace(/<\/p>/gi, '\n');
                    value = value.replace(/<br>/gi, '\n');
                    value = value.replace(/<(?:.|\n)*?>/gm, '');
                    value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script *>/gi, "");
                    // value = $("<p>" + value + "</p>").text();
                } catch (error) {
                    value = value;
                }

                if (value.length > 300) {
                    value = value.substring(0, 300) + '...';
                }
            }
        }

        if (simpleField.field_type == ModuleTableField.FIELD_TYPE_html_array) {

            for (let vi in value) {
                let v = value[vi];

                try {

                    v = v.replace(/&nbsp;/gi, ' ');
                    v = v.replace(/<\/div>/gi, '\n');
                    v = v.replace(/<\/span>/gi, '\n');
                    v = v.replace(/<\/ul>/gi, '\n');
                    v = v.replace(/<\/li>/gi, '\n');
                    v = v.replace(/<\/p>/gi, '\n');
                    v = v.replace(/<br>/gi, '\n');
                    v = v.replace(/<(?:.|\n)*?>/gm, '');
                    v = v.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script *>/gi, "");
                    // v = $("<p>" + v + "</p>").text();
                } catch (error) {
                    v = v;
                }

                if (v.length > 300) {
                    v = v.substring(0, 300) + '...';
                }

                value[vi] = v;
            }
        }

        return value;
    }
}
