import { Duration } from 'moment';
import INamedVO from '../../../shared/interfaces/INamedVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import APIDAOApiTypeAndMatroidsParamsVO from '../../../shared/modules/DAO/vos/APIDAOApiTypeAndMatroidsParamsVO';
import APIDAODATATABLEVOParamVO from '../../../shared/modules/DAO/vos/APIDAODATATABLEVOParamVO';
import APIDAOIdsRangesParamsVO from '../../../shared/modules/DAO/vos/APIDAOIdsRangesParamsVO';
import APIDAONamedParamVO from '../../../shared/modules/DAO/vos/APIDAONamedParamVO';
import APIDAOParamsVO from '../../../shared/modules/DAO/vos/APIDAOParamsVO';
import APIDAOParamVO from '../../../shared/modules/DAO/vos/APIDAOParamVO';
import APIDAORefFieldParamsVO from '../../../shared/modules/DAO/vos/APIDAORefFieldParamsVO';
import APIDAORefFieldsAndFieldsStringParamsVO from '../../../shared/modules/DAO/vos/APIDAORefFieldsAndFieldsStringParamsVO';
import APIDAORefFieldsParamsVO from '../../../shared/modules/DAO/vos/APIDAORefFieldsParamsVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import TSRange from '../../../shared/modules/DataRender/vos/TSRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import IMatroid from '../../../shared/modules/Matroid/interfaces/IMatroid';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleVO from '../../../shared/modules/ModuleVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import IVarDataParamVOBase from '../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ServerBase from '../../ServerBase';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleTableDBService from '../ModuleTableDBService';
import DAOTriggerHook from './triggers/DAOTriggerHook';
import ForkedTasksController from '../Fork/ForkedTasksController';

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

    // On expose des hooks pour les modules qui veulent gérer le filtrage des vos suivant l'utilisateur connecté
    public access_hooks: { [api_type_id: string]: { [access_type: string]: IHookFilterVos<IDistantVOBase> } } = {};

    // private pre_read_trigger_hook: DAOTriggerHook;
    public pre_update_trigger_hook: DAOTriggerHook;
    public pre_create_trigger_hook: DAOTriggerHook;
    public pre_delete_trigger_hook: DAOTriggerHook;

    // private post_read_trigger_hook: DAOTriggerHook;
    public post_update_trigger_hook: DAOTriggerHook;
    public post_create_trigger_hook: DAOTriggerHook;
    // private post_delete_trigger_hook: DAOTriggerHook;
    /**
     * Local thread cache -----
     */

    private constructor() {
        ForkedTasksController.getInstance().register_task(DAOServerController.TASK_NAME_add_segmented_known_databases, this.add_segmented_known_databases.bind(this));
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
}