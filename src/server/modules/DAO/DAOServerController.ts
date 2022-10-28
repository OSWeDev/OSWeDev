import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import { IContextHookFilterVos } from '../../../shared/modules/DAO/interface/IContextHookFilterVos';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import DateHandler from '../../../shared/tools/DateHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ContextQueryInjectionCheckHandler from '../ContextFilter/ContextQueryInjectionCheckHandler';
import ForkedTasksController from '../Fork/ForkedTasksController';
import DAOPostCreateTriggerHook from './triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from './triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from './triggers/DAOPostUpdateTriggerHook';
import DAOPreCreateTriggerHook from './triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from './triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from './triggers/DAOPreUpdateTriggerHook';

export default class DAOServerController {

    public static TASK_NAME_add_segmented_known_databases: string = ModuleDAO.getInstance().name + ".add_segmented_known_databases";

    public static getInstance() {
        if (!DAOServerController.instance) {
            DAOServerController.instance = new DAOServerController();
        }
        return DAOServerController.instance;
    }

    private static instance: DAOServerController = null;

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */
    /**
     * Le nombre est la valeur du segment de la table. L'existence de la table est liée à sa présence dans l'objet simplement.
     */
    public segmented_known_databases: { [database_name: string]: { [table_name: string]: number } } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    /**
     * Local thread cache -----
     */

    /**
     * @deprecated utiliser les context_access_hooks
     * On expose des hooks pour les modules qui veulent gérer le filtrage des vos suivant l'utilisateur connecté
     */
    public access_hooks: { [api_type_id: string]: { [access_type: string]: Array<IHookFilterVos<IDistantVOBase>> } } = {};

    /**
     * Le filtrage des accès est découpé ainsi :
     *  - Pour définir le droit de lire / modifier / supprimer => utiliser les Policies / les droits des utilisateurs sur chaque api_type_id
     *  - Une fois qu'on a un droit de principe, on peut préciser le droit d'usage d'un type pour un utilisateur donné ou un contexte donné
     *      en utilisant un context_access_hook, qui est un contextQuery généré en fonction du user lançant la requête et appliqué à toutes les
     *      requêtes qui passent par le type du hook
     *  - On peut aussi préciser le droit de faire un update ou un delete, via un trigger preupdate ou predelete cette fois qui permettra en renvoyant
     *      false de refuser une demande précise, or droit de principe d'insérer/updater des éléments dans la table
     *  - On peut ensuite détailler par champs, pour en bloquer certains, via des policies, 1 par champs, en Select ou en Update, et le contextQuery
     *      filtrera en fonction de ces droits => les filtres (droit Select) les fields du Select (droit Select) le field édité par un Update (droit Update)
     *      le field du sort_by (droit Select) les fields utilisés dans les paths entre objects et donc dans les jointures (droit Select)
     *      Si un des fields est refusé on supprime ce qui lui est associé (on supprime le sort_by par exemple si c'est ce champs auquel on a pas le droit)
     */
    public context_access_hooks: { [api_type_id: string]: Array<IContextHookFilterVos<IDistantVOBase>> } = {};

    public pre_update_trigger_hook: DAOPreUpdateTriggerHook;
    public pre_create_trigger_hook: DAOPreCreateTriggerHook;
    public pre_delete_trigger_hook: DAOPreDeleteTriggerHook;

    public post_update_trigger_hook: DAOPostUpdateTriggerHook;
    public post_create_trigger_hook: DAOPostCreateTriggerHook;
    public post_delete_trigger_hook: DAOPostDeleteTriggerHook;
    /**
     * Local thread cache -----
     */

    private constructor() {
        ForkedTasksController.getInstance().register_task(DAOServerController.TASK_NAME_add_segmented_known_databases, this.add_segmented_known_databases.bind(this));
    }

    /**
     * Check injection OK : get_range_translated_to_bdd_queryable_range est OK
     * @param ranges
     * @param field
     * @param filter_field_type
     * @returns
     */
    public get_ranges_translated_to_bdd_queryable_ranges(ranges: IRange[], field: ModuleTableField<any>, filter_field_type: string): string {
        let ranges_query: string = 'ARRAY[';

        let first_range: boolean = true;

        for (let i in ranges) {
            let range = ranges[i];

            if (!first_range) {
                ranges_query += ',';
            }

            first_range = false;

            ranges_query += this.get_range_translated_to_bdd_queryable_range(range, field, filter_field_type);
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
    public get_range_translated_to_bdd_queryable_range(range: IRange, field: ModuleTableField<any>, filter_field_type: string): string {

        ContextQueryInjectionCheckHandler.assert_integer(range.min);
        ContextQueryInjectionCheckHandler.assert_integer(range.max);

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_textarea:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_tsrange) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::tsrange';
                }
                break;
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_float_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
                if ((filter_field_type == ModuleTableField.FIELD_TYPE_refrange_array) || (filter_field_type == ModuleTableField.FIELD_TYPE_numrange_array) || (filter_field_type == ModuleTableField.FIELD_TYPE_isoweekdays)) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
                } else if (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
                }
                break;
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange:
                if (filter_field_type == ModuleTableField.FIELD_TYPE_hourrange_array) {
                    return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::int8range';
                }
                break;
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::daterange';
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_tstz:
                return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                // TODO FIXME
                break;
            case ModuleTableField.FIELD_TYPE_daterange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + DateHandler.getInstance().formatDayForIndex(range.min) + "," + DateHandler.getInstance().formatDayForIndex(range.max) + (range.max_inclusiv ? "]" : ")") + '\'' + '::daterange';
            case ModuleTableField.FIELD_TYPE_tsrange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + range.min + "," + range.max + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';
            case ModuleTableField.FIELD_TYPE_numrange:
                return '\'' + (range.min_inclusiv ? "[" : "(") + range.min.toString() + "," + range.max.toString() + (range.max_inclusiv ? "]" : ")") + '\'' + '::numrange';

            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
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
    public add_segmented_known_databases(database_name: string, table_name: string, segmented_value: number) {
        if (!this.segmented_known_databases) {
            this.segmented_known_databases = {};
        }

        if (!this.segmented_known_databases[database_name]) {
            this.segmented_known_databases[database_name] = {};
        }
        this.segmented_known_databases[database_name][table_name] = segmented_value;
    }

    public get_dao_policy(translatable_name: string, group: AccessPolicyGroupVO, isAccessConfVoType: boolean, accessConfVoType_DEFAULT_BEHAVIOUR: number): AccessPolicyVO {
        let vo_read: AccessPolicyVO = new AccessPolicyVO();
        vo_read.group_id = group.id;
        vo_read.default_behaviour = isAccessConfVoType ? accessConfVoType_DEFAULT_BEHAVIOUR : AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        vo_read.translatable_name = translatable_name;
        return vo_read;
    }

    public get_dao_dependency_default_granted(from: AccessPolicyVO, to: AccessPolicyVO): PolicyDependencyVO {
        if ((!from) || (!to)) {
            return null;
        }

        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_GRANTED;
        dependency.src_pol_id = from.id;
        dependency.depends_on_pol_id = to.id;
        return dependency;
    }

    public get_inherited_right(DAO_ACCESS_TYPE: string, inherit_rights_from_vo_type: string): AccessPolicyVO {
        return AccessPolicyServerController.getInstance().get_registered_policy(ModuleDAO.getInstance().getAccessPolicyName(DAO_ACCESS_TYPE, inherit_rights_from_vo_type));
    }

    public get_dao_dependency_default_denied(from: AccessPolicyVO, to: AccessPolicyVO): PolicyDependencyVO {
        if ((!from) || (!to)) {
            return null;
        }

        let dependency: PolicyDependencyVO = new PolicyDependencyVO();
        dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        dependency.src_pol_id = from.id;
        dependency.depends_on_pol_id = to.id;

        return dependency;
    }
}