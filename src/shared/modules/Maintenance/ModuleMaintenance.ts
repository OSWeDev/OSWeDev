import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import MaintenanceVO from './vos/MaintenanceVO';

export default class ModuleMaintenance extends Module {

    public static MODULE_NAME: string = 'Maintenance';

    public static MSG1_code_text = 'maintenance.msg1' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static MSG2_code_text = 'maintenance.msg2' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static MSG3_code_text = 'maintenance.msg3' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static MSG4_code_text = 'maintenance.msg4' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;

    public static PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES = 'ModuleMaintenance.msg1_minutes';
    public static PARAM_NAME_SEND_MSG2_WHEN_SHORTER_THAN_MINUTES = 'ModuleMaintenance.msg2_minutes';
    public static PARAM_NAME_SEND_MSG3_WHEN_SHORTER_THAN_MINUTES = 'ModuleMaintenance.msg3_minutes';
    public static PARAM_NAME_INFORM_EVERY_MINUTES = 'ModuleMaintenance.inform_minutes';
    public static PARAM_NAME_start_maintenance_force_readonly_after_x_ms = 'ModuleMaintenance.start_maintenance_force_readonly_after_x_ms';

    public static APINAME_END_MAINTENANCE: string = "end_maintenance";
    public static APINAME_START_MAINTENANCE: string = "start_maintenance";
    public static APINAME_END_PLANNED_MAINTENANCE: string = "end_planned_maintenance";

    public static getInstance(): ModuleMaintenance {
        if (!ModuleMaintenance.instance) {
            ModuleMaintenance.instance = new ModuleMaintenance();
        }
        return ModuleMaintenance.instance;
    }

    private static instance: ModuleMaintenance = null;

    public start_maintenance: (validation_code: string) => Promise<void> = APIControllerWrapper.sah(ModuleMaintenance.APINAME_START_MAINTENANCE);
    public end_maintenance: (maintenance_vo_id: number) => Promise<void> = APIControllerWrapper.sah(ModuleMaintenance.APINAME_END_MAINTENANCE);
    public end_planned_maintenance: () => Promise<void> = APIControllerWrapper.sah(ModuleMaintenance.APINAME_END_PLANNED_MAINTENANCE);

    private constructor() {

        super("maintenance", ModuleMaintenance.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        /**
         * Cas spécifique d'une fonction GET qui réalise une modif en base (ici un start_maintenance) pour jenkins. à modifier probablement un jour
         */
        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, void>(
            null,
            ModuleMaintenance.APINAME_START_MAINTENANCE,
            [MaintenanceVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<void, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, MaintenanceVO.API_TYPE_ID),
            ModuleMaintenance.APINAME_END_PLANNED_MAINTENANCE,
            [MaintenanceVO.API_TYPE_ID]
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<NumberParamVO, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, MaintenanceVO.API_TYPE_ID),
            ModuleMaintenance.APINAME_END_MAINTENANCE,
            [MaintenanceVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeMaintenanceVO();
    }

    private initializeMaintenanceVO() {
        let author_id = new ModuleTableField('author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);

        let fields = [
            new ModuleTableField('start_ts', ModuleTableField.FIELD_TYPE_tstz, 'Début de la maintenance', true).set_segmentation_type(TimeSegment.TYPE_MINUTE),
            new ModuleTableField('end_ts', ModuleTableField.FIELD_TYPE_tstz, 'Fin de la maintenance', true).set_segmentation_type(TimeSegment.TYPE_MINUTE),
            new ModuleTableField('broadcasted_msg1', ModuleTableField.FIELD_TYPE_boolean, 'MSG1 broadcasté', true, true, false),
            new ModuleTableField('broadcasted_msg2', ModuleTableField.FIELD_TYPE_boolean, 'MSG2 broadcasté', true, true, false),
            new ModuleTableField('broadcasted_msg3', ModuleTableField.FIELD_TYPE_boolean, 'MSG3 broadcasté', true, true, false),
            new ModuleTableField('maintenance_over', ModuleTableField.FIELD_TYPE_boolean, 'Maintenance terminée', true, true, false),
            new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de création', true).set_segmentation_type(TimeSegment.TYPE_MINUTE),
            author_id,
        ];

        author_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);

        let table = new ModuleTable(this, MaintenanceVO.API_TYPE_ID, () => new MaintenanceVO(), fields, null, 'Maintenances');
        this.datatables.push(table);
    }
}