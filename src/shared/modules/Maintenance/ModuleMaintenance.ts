import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleAPI from '../API/ModuleAPI';
import NumberParamVO from '../API/vos/apis/NumberParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VOsTypesManager';
import MaintenanceVO from './vos/MaintenanceVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import ModuleDAO from '../DAO/ModuleDAO';

export default class ModuleMaintenance extends Module {

    public static MODULE_NAME: string = 'Maintenance';

    public static MSG1_code_text = 'maintenance.msg1' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static MSG2_code_text = 'maintenance.msg2' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static MSG3_code_text = 'maintenance.msg3' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    public static MSG4_code_text = 'maintenance.msg4' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;

    public static PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES = 'msg1_minutes';
    public static PARAM_NAME_SEND_MSG2_WHEN_SHORTER_THAN_MINUTES = 'msg2_minutes';
    public static PARAM_NAME_SEND_MSG3_WHEN_SHORTER_THAN_MINUTES = 'msg3_minutes';
    public static PARAM_NAME_INFORM_EVERY_MINUTES = 'inform_minutes';

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

    private constructor() {

        super("maintenance", ModuleMaintenance.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<void, void>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, MaintenanceVO.API_TYPE_ID),
            ModuleMaintenance.APINAME_START_MAINTENANCE,
            [MaintenanceVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<void, void>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, MaintenanceVO.API_TYPE_ID),
            ModuleMaintenance.APINAME_END_PLANNED_MAINTENANCE,
            [MaintenanceVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<NumberParamVO, void>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, MaintenanceVO.API_TYPE_ID),
            ModuleMaintenance.APINAME_END_MAINTENANCE,
            [MaintenanceVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams
        ));
    }

    public async start_maintenance(): Promise<void> {
        return ModuleAPI.getInstance().handleAPI<void, void>(ModuleMaintenance.APINAME_START_MAINTENANCE);
    }

    public async end_maintenance(maintenance_vo_id: number): Promise<void> {
        return ModuleAPI.getInstance().handleAPI<NumberParamVO, void>(ModuleMaintenance.APINAME_END_MAINTENANCE, maintenance_vo_id);
    }

    public async end_planned_maintenance(): Promise<void> {
        return ModuleAPI.getInstance().handleAPI<void, void>(ModuleMaintenance.APINAME_END_PLANNED_MAINTENANCE);
    }

    public initialize() {
        this.fields = [
            new ModuleTableField(ModuleMaintenance.PARAM_NAME_SEND_MSG1_WHEN_SHORTER_THAN_MINUTES, ModuleTableField.FIELD_TYPE_float, 'Envoie du MSG1 quand la maintenance est dans moins de x minutes', true, true, 120),
            new ModuleTableField(ModuleMaintenance.PARAM_NAME_SEND_MSG2_WHEN_SHORTER_THAN_MINUTES, ModuleTableField.FIELD_TYPE_float, 'Envoie du MSG2 ...', true, true, 15),
            new ModuleTableField(ModuleMaintenance.PARAM_NAME_SEND_MSG3_WHEN_SHORTER_THAN_MINUTES, ModuleTableField.FIELD_TYPE_float, 'Envoie du MSG3 ...', true, true, 5),
            new ModuleTableField(ModuleMaintenance.PARAM_NAME_INFORM_EVERY_MINUTES, ModuleTableField.FIELD_TYPE_float, 'Informer les utilisateurs chaque x minutes (valable pour MSG2 et MSG3)', true, true, 1),
        ];
        this.datatables = [];

        this.initializeMaintenanceVO();
    }

    private initializeMaintenanceVO() {
        let author_id = new ModuleTableField('author_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Auteur', false);

        let fields = [
            new ModuleTableField('start_ts', ModuleTableField.FIELD_TYPE_tstz, 'Début de la maintenance', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('end_ts', ModuleTableField.FIELD_TYPE_tstz, 'Fin de la maintenance', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('broadcasted_msg1', ModuleTableField.FIELD_TYPE_boolean, 'MSG1 broadcasté', true, true, false),
            new ModuleTableField('broadcasted_msg2', ModuleTableField.FIELD_TYPE_boolean, 'MSG2 broadcasté', true, true, false),
            new ModuleTableField('broadcasted_msg3', ModuleTableField.FIELD_TYPE_boolean, 'MSG3 broadcasté', true, true, false),
            new ModuleTableField('maintenance_over', ModuleTableField.FIELD_TYPE_boolean, 'Maintenance terminée', true, true, false),
            new ModuleTableField('creation_date', ModuleTableField.FIELD_TYPE_tstz, 'Date de création', true).set_segmentation_type(TimeSegment.TYPE_SECOND),
            author_id,
        ];

        author_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        let table = new ModuleTable(this, MaintenanceVO.API_TYPE_ID, () => new MaintenanceVO(), fields, null, 'Maintenances');
        this.datatables.push(table);
    }
}