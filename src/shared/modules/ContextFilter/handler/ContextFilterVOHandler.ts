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
import VOFieldRefVO from '../../DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../DataRender/vos/DataFilterOption';
import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';
import ModuleTableField from '../../ModuleTableField';
import { VOsTypesManager } from '../../VO/manager/VOsTypesManager';
import { ContextFilterVOManager } from '../manager/ContextFilterVOManager';
import { FieldFilterManager } from '../manager/FieldFilterManager';
import ContextFilterVO from '../vos/ContextFilterVO';
import { query } from '../vos/ContextQueryVO';

/**
 * ContextFilterVOHandler
 *
 * TODO: For some of the following methods, we should rather use the new ContextFilterVOManager methods
 * TODO: Handlers methods have to be for Handling|Checking rules on ContextFilterVO
 */
export class ContextFilterVOHandler {

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
     */
    public static add_context_filter_to_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_add: ContextFilterVO, operator_type: number = ContextFilterVO.TYPE_FILTER_AND): ContextFilterVO {

        if (!context_filter_tree_root) {
            return context_filter_to_add;
        }

        if (!context_filter_to_add) {
            return context_filter_tree_root;
        }

        // Le root est déjà rempli, on renvoie un nouvel operateur
        let new_root = new ContextFilterVO();

        new_root.vo_type = context_filter_to_add.vo_type;
        new_root.field_id = context_filter_to_add.field_id;
        new_root.filter_type = operator_type;
        new_root.left_hook = context_filter_tree_root;
        new_root.right_hook = context_filter_to_add;
        return new_root;
    }

    public static getInstance(): ContextFilterVOHandler {
        if (!ContextFilterVOHandler.instance) {
            ContextFilterVOHandler.instance = new ContextFilterVOHandler();
        }
        return ContextFilterVOHandler.instance;
    }

    private static instance: ContextFilterVOHandler = null;

    protected constructor() { }

    public async get_datatable_row_field_data_async(
        raw_data: IDistantVOBase, resData: any, field: DatatableField<any, any>
    ): Promise<any> {

        try {

            switch (field.type) {

                case DatatableField.CRUD_ACTIONS_FIELD_TYPE:
                    resData[field.datatable_field_uid] = raw_data[field.datatable_field_uid];
                    break;

                case DatatableField.SIMPLE_FIELD_TYPE:
                    let simpleField: SimpleDatatableFieldVO<any, any> = (field) as SimpleDatatableFieldVO<any, any>;
                    let module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        simpleField.moduleTableField.module_table.vo_type + '___' + simpleField.moduleTableField.field_id :
                        simpleField.moduleTableField.field_id;

                    let value = field.dataToReadIHM(raw_data[module_table_field_id], raw_data);
                    // Limite à 300 cars si c'est du html et strip html
                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) {

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
                                // value = $("<p>" + value + "</p>").text();
                            } catch (error) {
                                value = value;
                            }

                            if (value.length > 300) {
                                value = value.substring(0, 300) + '...';
                            }
                        }
                    }

                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html_array) {

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


                    resData[field.datatable_field_uid] = value;
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
                        let ref_data: IDistantVOBase = await query(manyToOneField.targetModuleTable.vo_type).filter_by_id(raw_data[src_module_table_field_id]).select_vo();
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
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type).filter_by_id(vo_ids[i]).select_vo();

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
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type).filter_by_id(vo_ids[i]).select_vo();

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
                        refField.srcField.module_table.vo_type + '___' + refField.srcField.field_id :
                        refField.srcField.field_id;

                    await RangeHandler.foreach_ranges_batch_await(raw_data[refField_src_module_table_field_id], async (id: number) => {
                        let ref_data: IDistantVOBase = await query(refField.targetModuleTable.vo_type).filter_by_id(id).select_vo();
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
    }

    public get_active_field_filters(filters: ContextFilterVO[]): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {
        let res: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = {};

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
     * @deprecated use static ContextFilterVOManager.get_context_filters_from_active_field_filters instead
     */
    public get_filters_from_active_field_filters(active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }): ContextFilterVO[] {
        return ContextFilterVOManager.get_context_filters_from_active_field_filters(active_field_filters);
    }

    /**
     * @param context_filter_tree_root
     * @param type
     * @returns the context_filter that has the asked type from the tree_root
     */
    public find_context_filter_by_type(context_filter_tree_root: ContextFilterVO, type: number): ContextFilterVO {
        if (context_filter_tree_root && (context_filter_tree_root.filter_type != type) && context_filter_tree_root.left_hook && context_filter_tree_root.right_hook) {
            return this.find_context_filter_by_type(context_filter_tree_root.left_hook, type) || this.find_context_filter_by_type(context_filter_tree_root.right_hook, type);
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
     * @param context_filter_tree_root
     * @param context_filter_to_delete
     * @returns
     */
    public remove_context_filter_from_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_delete: ContextFilterVO): ContextFilterVO {

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
        let left_hook_replacement = this.remove_context_filter_from_tree(context_filter_tree_root.left_hook, context_filter_to_delete);
        if (!left_hook_replacement) {
            return context_filter_tree_root.right_hook;
        }
        if (left_hook_replacement != context_filter_tree_root.left_hook) {
            context_filter_tree_root.left_hook = left_hook_replacement;
            return context_filter_tree_root;
        }

        let right_hook_replacement = this.remove_context_filter_from_tree(context_filter_tree_root.right_hook, context_filter_to_delete);
        if ((!right_hook_replacement) && (context_filter_tree_root.right_hook)) {
            return context_filter_tree_root.left_hook;
        }
        if (right_hook_replacement != context_filter_tree_root.right_hook) {
            context_filter_tree_root.right_hook = right_hook_replacement;
        }

        return context_filter_tree_root;
    }

    /**
     * Objectif retrouver les filtres simples (pas de or / xor ou subquery par exemple) d'un vo_type spécifique
     */
    public get_simple_filters_by_vo_type(filters: ContextFilterVO[], vo_type: string): ContextFilterVO[] {

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
    public get_simple_filter_by_vo_type_and_field_id(filters: ContextFilterVO[], vo_type: string, field_id: string): ContextFilterVO {

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
     * Add context_filter to the root, using the and/or/xor .... type of operator if necessary
     * Returns the new root
     * @deprecated Have to be staic method (no need to use Instance)
     */
    public add_context_filter_to_tree(context_filter_tree_root: ContextFilterVO, context_filter_to_add: ContextFilterVO, operator_type: number = ContextFilterVO.TYPE_FILTER_AND): ContextFilterVO {
        return ContextFilterVOHandler.add_context_filter_to_tree(context_filter_tree_root, context_filter_to_add, operator_type);
    }

    /**
     * Clone and remove custom_filters
     * @deprecated Have to be staic method (no need to use Instance)
     * @deprecated Have to be In the ContextFilterVOManager
     */
    public clean_context_filters_for_request(
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } }
    ): { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } {
        return FieldFilterManager.clean_field_filters_for_request(get_active_field_filters);
    }

    /**
     * Renvoie une context query qui renvoie systématiquement 0 éléments, pour bloquer l'accès à un vo par exemple dans un context access hook
     */
    public get_empty_res_context_hook_query(api_type_id: string) {
        // on veut rien renvoyer, donc on fait une query qui retourne rien
        let filter_none: ContextFilterVO = new ContextFilterVO();
        filter_none.filter_type = ContextFilterVO.TYPE_NULL_ALL;
        filter_none.field_id = 'id';
        filter_none.vo_type = api_type_id;

        return query(api_type_id).field('id').set_query_distinct().add_filters([filter_none]).ignore_access_hooks();
    }

    public add_context_filters_exclude_values(
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

            let new_exclude_values = this.get_ContextFilterVO_from_DataFilterOption(active_option, null, field, vo_field_ref);

            if (!new_exclude_values) {
                continue;
            }

            if (!exclude_values_context_filter) {
                exclude_values_context_filter = new_exclude_values;
            } else {
                exclude_values_context_filter = this.merge_ContextFilterVOs(exclude_values_context_filter, new_exclude_values);
            }
        }

        // Changer le filter_type pour dire ne pas prendre en compte
        exclude_values_context_filter.filter_type = this.get_ContextFilterVO_None(field, vo_field_ref);

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

    public get_ContextFilterVO_None(field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO): number {
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
     * @use ContextFilterVOManager.get_context_filter_from_data_filter_option instead
     */
    public get_ContextFilterVO_from_DataFilterOption(active_option: DataFilterOption, ts_range: TSRange, field: ModuleTableField<any>, vo_field_ref: VOFieldRefVO): ContextFilterVO {
        return ContextFilterVOManager.get_context_filter_from_data_filter_option(active_option, ts_range, field, vo_field_ref);
    }

    /**
     * @deprecated there is no need to use instance to proceed
     * @use ContextFilterVOManager.merge_context_filter_vos instead
     */
    public merge_ContextFilterVOs(a: ContextFilterVO, b: ContextFilterVO, try_union: boolean = false): ContextFilterVO {
        return ContextFilterVOHandler.merge_context_filter_vos(a, b, try_union);
    }
}
