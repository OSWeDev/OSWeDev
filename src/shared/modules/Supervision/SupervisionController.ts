import TimeSegment from '../DataRender/vos/TimeSegment';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import ISupervisedItemController from './interfaces/ISupervisedItemController';
import SupervisedCategoryVO from './vos/SupervisedCategoryVO';

/**
 * @class SupervisionController
 */
export default class SupervisionController {

    public static SUPERVISION_DASHBOARD_KEY: string = 'dashboard';

    public static ROUTE_NAME_DASHBOARD: string = 'SupervisionDashboard';
    public static ROUTE_NAME_DASHBOARD_ITEM: string = 'SupervisedItem';

    public static SUP_HIST_SCHEMA: string = 'supervsn_hist';
    public static SUP_HIST_TABLE_PREFIX: string = '_sh_';

    public static STATE_COLORS: string[] = ['red', 'orangered', 'orange', '#ffd400', 'green', 'blue', 'grey'];
    public static STATE_LABELS: string[] = [
        'supervision.STATE_ERROR',
        'supervision.STATE_ERROR_READ',
        'supervision.STATE_WARN',
        'supervision.STATE_WARN_READ',
        'supervision.STATE_OK',
        'supervision.STATE_PAUSED',
        'supervision.STATE_UNKOWN'
    ];

    public static STATE_ERROR = 0;
    public static STATE_ERROR_READ = 1;
    public static STATE_WARN = 2;
    public static STATE_WARN_READ = 3;
    public static STATE_OK = 4;
    public static STATE_PAUSED = 5;
    public static STATE_UNKOWN = 6;

    // Add labels for each state
    public static STATE_LABELS_BY_STATE: { [state: number]: string } = {
        [SupervisionController.STATE_ERROR]: 'supervision.STATE_ERROR',
        [SupervisionController.STATE_ERROR_READ]: 'supervision.STATE_ERROR_READ',
        [SupervisionController.STATE_WARN]: 'supervision.STATE_WARN',
        [SupervisionController.STATE_WARN_READ]: 'supervision.STATE_WARN_READ',
        [SupervisionController.STATE_OK]: 'supervision.STATE_OK',
        [SupervisionController.STATE_PAUSED]: 'supervision.STATE_PAUSED',
        [SupervisionController.STATE_UNKOWN]: 'supervision.STATE_UNKOWN',
    };

    public static getInstance(): SupervisionController {
        if (!SupervisionController.instance) {
            SupervisionController.instance = new SupervisionController();
        }
        return SupervisionController.instance;
    }

    private static instance: SupervisionController = null;

    /** les sondes enregistrées */
    private registered_api_type_by_ids: { [api_type_id: string]: ISupervisedItemController<any> } = {};

    private constructor() { }

    /** les sondes enregistrées */
    get registered_controllers(): { [api_type_id: string]: ISupervisedItemController<any> } {
        return this.registered_api_type_by_ids;
    }

    public getSupHistVoType(api_type_id: string): string {
        return SupervisionController.SUP_HIST_TABLE_PREFIX + api_type_id;
    }

    /**
     * rajoute les champs des sondes/controllers dans la moduletable et enregistre le controller dans {@link SupervisionController.registered_api_type_by_ids}
     * @param moduleTable
     * @param controller
     */
    public registerModuleTable(moduleTable: ModuleTable<any>, controller: ISupervisedItemController<any>) {

        this.registered_api_type_by_ids[moduleTable.vo_type] = controller;

        let name = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true).unique();
        moduleTable.push_field(name.setModuleTable(moduleTable));

        let category_id_field = new ModuleTableField('category_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Catégorie').addManyToOneRelation(
            VOsTypesManager.moduleTables_by_voType[SupervisedCategoryVO.API_TYPE_ID]
        );

        // rajoute les champs des sondes/controllers dans la moduletable
        moduleTable.push_field(new ModuleTableField('last_update', ModuleTableField.FIELD_TYPE_tstz, 'Date de dernière mise à jour', false).set_segmentation_type(TimeSegment.TYPE_SECOND).setModuleTable(moduleTable));
        moduleTable.push_field(new ModuleTableField('last_value', ModuleTableField.FIELD_TYPE_float, 'Dernière valeur', false).setModuleTable(moduleTable));
        moduleTable.push_field(new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de création', true).set_segmentation_type(TimeSegment.TYPE_SECOND).setModuleTable(moduleTable));
        moduleTable.push_field(new ModuleTableField('first_update', ModuleTableField.FIELD_TYPE_tstz, 'Date de dernière mise à jour', false).set_segmentation_type(TimeSegment.TYPE_SECOND).setModuleTable(moduleTable));
        moduleTable.push_field(new ModuleTableField('state', ModuleTableField.FIELD_TYPE_enum, 'Etat', true, true, SupervisionController.STATE_UNKOWN)
            .setEnumValues(SupervisionController.STATE_LABELS)
            .setEnumColorValues(SupervisionController.STATE_COLORS)
            .setModuleTable(moduleTable));
        moduleTable.push_field(new ModuleTableField('state_before_pause', ModuleTableField.FIELD_TYPE_enum, 'Etat - avant pause', true, true, SupervisionController.STATE_UNKOWN).setEnumValues(SupervisionController.STATE_LABELS).setEnumColorValues(SupervisionController.STATE_COLORS).setModuleTable(moduleTable));
        moduleTable.push_field(new ModuleTableField('invalid', ModuleTableField.FIELD_TYPE_boolean, 'Invalide', false, true, false).setModuleTable(moduleTable));
        moduleTable.push_field(category_id_field.setModuleTable(moduleTable));
        moduleTable.default_label_field = name;

        // On copie les champs, pour la table à créer automatiquement :
        //  - La table historique des valeurs
        let vo_types: string[] = [
            this.getSupHistVoType(moduleTable.vo_type),
        ];

        let databases: string[] = [
            SupervisionController.SUP_HIST_SCHEMA,
        ];

        for (let e in vo_types) {
            let vo_type = vo_types[e];
            let database = databases[e];

            let fields: Array<ModuleTableField<any>> = [];

            for (let i in moduleTable.get_fields()) {
                let vofield = moduleTable.get_fields()[i];

                let cloned_field = new ModuleTableField<any>(vofield.field_id, vofield.field_type, vofield.field_label, vofield.field_required, vofield.has_default, vofield.field_default);
                cloned_field.enum_values = vofield.enum_values;
                cloned_field.is_inclusive_data = vofield.is_inclusive_data;
                cloned_field.is_inclusive_ihm = vofield.is_inclusive_ihm;
                fields.push(cloned_field);
            }

            let newTable: ModuleTable<any> = new ModuleTable<any>(moduleTable.module, vo_type, moduleTable.voConstructor, fields, null, vo_type);
            newTable.set_bdd_ref(database, moduleTable.name);
            newTable.set_inherit_rights_from_vo_type(moduleTable.vo_type);

            for (let i in moduleTable.get_fields()) {
                let vofield = moduleTable.get_fields()[i];

                if (!vofield.has_relation) {
                    continue;
                }

                newTable.getFieldFromId(vofield.field_id).addManyToOneRelation(vofield.manyToOne_target_moduletable);
            }

            moduleTable.module.datatables.push(newTable);
        }
    }
}