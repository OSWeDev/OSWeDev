import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ForkedTasksController from '../Fork/ForkedTasksController';
import DAOTriggerHook from './triggers/DAOTriggerHook';

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