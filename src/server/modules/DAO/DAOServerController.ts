import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ContextQueryInjectionCheckHandler from '../../../shared/modules/ContextFilter/ContextQueryInjectionCheckHandler';
import DAOController from '../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import { IContextHookFilterVos } from '../../../shared/modules/DAO/interface/IContextHookFilterVos';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ForkedTasksController from '../Fork/ForkedTasksController';
import DAOPostCreateTriggerHook from './triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from './triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from './triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from './triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from './triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from './triggers/DAOPreUpdateTriggerHook';

export default class DAOServerController {


    /**
     * Local thread cache -----
     */

    /**
     * @deprecated utiliser les context_access_hooks
     * On expose des hooks pour les modules qui veulent gérer le filtrage des vos suivant l'utilisateur connecté
     */
    public static access_hooks: { [api_type_id: string]: { [access_type: string]: Array<IHookFilterVos<IDistantVOBase>> } } = {};

    /**
     * Le filtrage des accès est découpé ainsi :
     *  - Pour définir le droit de lire / modifier / supprimer => utiliser les Policies / les droits des utilisateurs sur chaque api_type_id
     *  - Une fois qu'on a un droit de principe, on peut préciser le droit d'usage d'un type pour un utilisateur donné ou un contexte donné
     *      en utilisant un context_access_hook, qui est un contextQuery généré en fonction du user lançant la requête et appliqué à toutes les
     *      requêtes qui passent par le type du hook
     *  - FIXME c'est ici qu'il faut modifier le comportement pour reprendre les IContextHookFilterVos sur chaque Access_type et du
     *      coup pas avoir besoin d'un trigger pre update ou pre create et donc peut-être pas avoir besoin de update 1 à 1 les vos via context queries :
     *      On peut aussi préciser le droit de faire un update ou un delete, via un trigger preupdate ou predelete cette fois qui permettra en renvoyant
     *      false de refuser une demande précise, or droit de principe d'insérer/updater des éléments dans la table
     *  - On peut ensuite détailler par champs, pour en bloquer certains, via des policies, 1 par champs, en Select ou en Update, et le contextQuery
     *      filtrera en fonction de ces droits => les filtres (droit Select) les fields du Select (droit Select) le field édité par un Update (droit Update)
     *      le field du sort_by (droit Select) les fields utilisés dans les paths entre objects et donc dans les jointures (droit Select)
     *      Si un des fields est refusé on supprime ce qui lui est associé (on supprime le sort_by par exemple si c'est ce champs auquel on a pas le droit)
     */
    public static context_access_hooks: { [api_type_id: string]: Array<IContextHookFilterVos<IDistantVOBase>> } = {};

    public static pre_update_trigger_hook: DAOPreUpdateTriggerHook;
    public static pre_create_trigger_hook: DAOPreCreateTriggerHook;
    public static pre_delete_trigger_hook: DAOPreDeleteTriggerHook;

    public static post_update_trigger_hook: DAOPostUpdateTriggerHook;
    public static post_create_trigger_hook: DAOPostCreateTriggerHook;
    public static post_delete_trigger_hook: DAOPostDeleteTriggerHook;
    /**
     * Local thread cache -----
     */

    public static GLOBAL_UPDATE_BLOCKER: boolean = false;

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */
    /**
     * Le nombre est la valeur du segment de la table. L'existence de la table est liée à sa présence dans l'objet simplement.
     */
    public static segmented_known_databases: { [database_name: string]: { [table_name: string]: number } } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    public static TASK_NAME_add_segmented_known_databases: string = ModuleDAO.MODULE_NAME + ".add_segmented_known_databases";

    // istanbul ignore next: cannot test configure
    public static async configure() {
        ForkedTasksController.register_task(DAOServerController.TASK_NAME_add_segmented_known_databases, DAOServerController.add_segmented_known_databases);
    }

    public static has_segmented_known_database(t: ModuleTableVO, segment_value: number): boolean {
        if ((!DAOServerController.segmented_known_databases[t.database]) || (!DAOServerController.segmented_known_databases[t.database][t.get_segmented_name(segment_value)])) {
            return false;
        }
        return true;
    }

    public static checkAccessSync<T extends IDistantVOBase>(datatable: ModuleTableVO, access_type: string): boolean {

        if (!datatable) {
            ConsoleHandler.error('checkAccessSync:!datatable');
            return false;
        }

        // On applique les accès au global sur le droit de faire un SELECT
        return AccessPolicyServerController.checkAccessSync(DAOController.getAccessPolicyName(access_type, datatable.vo_type));
    }

    /**
     * @depracated do not use anymore, use context queries instead - will be deleted soon
     */
    public static async filterVOsAccess<T extends IDistantVOBase>(datatable: ModuleTableVO, access_type: string, vos: T[]): Promise<T[]> {

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        const hooks = DAOServerController.access_hooks[datatable.vo_type] && DAOServerController.access_hooks[datatable.vo_type][access_type] ? DAOServerController.access_hooks[datatable.vo_type][access_type] : [];
        if (!StackContext.get('IS_CLIENT')) {
            // Server
            return vos;
        }

        for (const i in hooks) {
            const hook = hooks[i];

            const uid: number = StackContext.get('UID');
            vos = await hook(datatable, vos, uid, null) as T[];
        }

        if (vos && vos.length && !DAOServerController.checkAccessSync(datatable, ModuleDAO.DAO_ACCESS_TYPE_READ)) {
            // a priori on a accès en list labels, mais pas en read. Donc on va filtrer tous les champs, sauf le label et id et _type
            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[datatable.vo_type];

            for (const j in vos) {
                const vo: IDistantVOBase = vos[j];

                for (const i in fields) {
                    const field: ModuleTableFieldVO = fields[i];

                    if (datatable.default_label_field &&
                        (field.field_id == datatable.default_label_field.field_id)) {
                        continue;
                    }

                    let table_label_function_field_ids_deps = ModuleTableController.table_label_function_field_ids_deps_by_vo_type[datatable.vo_type];
                    if (table_label_function_field_ids_deps && table_label_function_field_ids_deps.length &&
                        (table_label_function_field_ids_deps.indexOf(field.field_id) > 0)) {
                        continue;
                    }

                    delete vo[field.field_id];
                }
            }
        }

        return vos;
    }

    /**
     * Check injection OK
     * @param field_type
     * @param field_id
     * @param intersector_range
     * @returns
     */
    public static getClauseWhereRangeIntersectsField(field_type: string, field_id: string, intersector_range: IRange): string {

        ContextQueryInjectionCheckHandler.assert_integer(intersector_range.min);
        ContextQueryInjectionCheckHandler.assert_integer(intersector_range.max);

        switch (field_type) {

            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
                if (intersector_range.range_type == TSRange.RANGE_TYPE) {
                    return field_id + "::timestamp with time zone <@ '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::tstzrange";
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                // Si on vise un type int, on sait que si le max = min + 1 et segment type du range = int et max exclusiv on est cool, on peut passer par un = directement.
                // Sinon on fait comme pour les float et autres, on prend >= ou > et <= ou < suivant inclusive ou inclusive
                if ((intersector_range.segment_type == NumSegment.TYPE_INT) && (intersector_range.min_inclusiv && !intersector_range.max_inclusiv) && (intersector_range.min == (intersector_range.max - 1))) {
                    // TODO : généraliser le concept, là on spécifie un truc très particulier pour faire vite et efficace, mais ya d'autres cas qu'on peut optimiser de la sorte
                    return field_id + " = " + intersector_range.min;
                }

            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
                return field_id + " >" + (intersector_range.min_inclusiv ? "=" : "") + " " + intersector_range.min + " and " + field_id + " <" + (intersector_range.max_inclusiv ? "=" : "") + " " + intersector_range.max;

            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return field_id + " >" + (intersector_range.min_inclusiv ? "=" : "") + " " + intersector_range.min + " and " + field_id + " <" + (intersector_range.max_inclusiv ? "=" : "") + " " + intersector_range.max;

            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numeric[])";

            case ModuleTableFieldVO.FIELD_TYPE_int_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numeric[])";

            case ModuleTableFieldVO.FIELD_TYPE_float_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numeric[])";

            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numrange[])";

            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
                return field_id + "::date <@ '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::daterange";

            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;

            case ModuleTableFieldVO.FIELD_TYPE_daterange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(intersector_range.min) + "," + DateHandler.getInstance().formatDayForIndex(intersector_range.max) + (intersector_range.max_inclusiv ? "]" : ")") + "'::daterange";

            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numrange[])";

            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                return field_id + " && '" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange";

            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                return "'" + (intersector_range.min_inclusiv ? "[" : "(") + intersector_range.min + "," + intersector_range.max + (intersector_range.max_inclusiv ? "]" : ")") + "'::numrange && ANY (" + field_id + "::numrange[])";

            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
            default:
                return null;
        }
    }

    /**
     * Check injection OK : get_range_translated_to_bdd_queryable_range est OK
     * @param ranges
     * @param field
     * @param filter_field_type
     * @returns
     */
    public static get_ranges_translated_to_bdd_queryable_ranges(ranges: IRange[], field: ModuleTableFieldVO, filter_field_type: string): string {
        let ranges_query: string = 'ARRAY[';

        let first_range: boolean = true;

        for (const i in ranges) {
            const range = ranges[i];

            if (!first_range) {
                ranges_query += ',';
            }

            first_range = false;

            ranges_query += DAOServerController.get_range_translated_to_bdd_queryable_range(range, field, filter_field_type);
        }

        ranges_query += ']';

        return first_range ? null : ranges_query;
    }

    /**
     * Check injection OK
     * @param range
     * @param field
     * @param filter_field_type
     * @returns
     */
    public static get_range_translated_to_bdd_queryable_range(range: IRange, field: ModuleTableFieldVO, filter_field_type: string): string {

        ContextQueryInjectionCheckHandler.assert_integer(range.min);
        ContextQueryInjectionCheckHandler.assert_integer(range.max);

        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
                if (filter_field_type == ModuleTableFieldVO.FIELD_TYPE_tsrange) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::tsrange';
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                if ((filter_field_type == ModuleTableFieldVO.FIELD_TYPE_refrange_array) || (filter_field_type == ModuleTableFieldVO.FIELD_TYPE_numrange_array) || (filter_field_type == ModuleTableFieldVO.FIELD_TYPE_isoweekdays)) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
                } else if (filter_field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                if (filter_field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::int8range';
                }
                break;
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::daterange';
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
                return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::daterange';
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
            case ModuleTableFieldVO.FIELD_TYPE_numrange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + range.min.toString() + "," + range.max.toString() + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';

            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not implemented');
                // TODO
                break;
        }

        return null;
    }

    /**
     * WARN : Except for initialisation, needs to be brocasted
     * @param database_name
     * @param table_name With segmentation (complete table name)
     * @param segmented_value
     */
    public static add_segmented_known_databases(database_name: string, table_name: string, segmented_value: number) {
        if (!DAOServerController.segmented_known_databases) {
            DAOServerController.segmented_known_databases = {};
        }

        if (!DAOServerController.segmented_known_databases[database_name]) {
            DAOServerController.segmented_known_databases[database_name] = {};
        }
        DAOServerController.segmented_known_databases[database_name][table_name] = segmented_value;

        return true;
    }

    public static get_dao_policy(translatable_name: string, group: AccessPolicyGroupVO, isAccessConfVoType: boolean, accessConfVoType_DEFAULT_BEHAVIOUR: number): AccessPolicyVO {
        const vo_read: AccessPolicyVO = new AccessPolicyVO();
        vo_read.group_id = group.id;
        vo_read.default_behaviour = isAccessConfVoType ? accessConfVoType_DEFAULT_BEHAVIOUR : AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        vo_read.translatable_name = translatable_name;
        return vo_read;
    }

    public static get_dao_dependency_default_granted(from: AccessPolicyVO, to: AccessPolicyVO): PolicyDependencyVO {
        if ((!from) || (!to)) {
            return null;
        }

        const dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
        dependency.src_pol_id = from.id;
        dependency.depends_on_pol_id = to.id;
        return dependency;
    }

    public static get_inherited_right(DAO_ACCESS_TYPE: string, inherit_rights_from_vo_type: string): AccessPolicyVO {
        return AccessPolicyServerController.get_registered_policy(DAOController.getAccessPolicyName(DAO_ACCESS_TYPE, inherit_rights_from_vo_type));
    }

    public static get_dao_dependency_default_denied(from: AccessPolicyVO, to: AccessPolicyVO): PolicyDependencyVO {
        if ((!from) || (!to)) {
            return null;
        }

        const dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = from.id;
        dependency.depends_on_pol_id = to.id;

        return dependency;
    }
}