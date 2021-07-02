import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import DashboardPageVO from './vos/DashboardPageVO';
import DashboardPageWidgetVO from './vos/DashboardPageWidgetVO';
import DashboardVO from './vos/DashboardVO';
import DashboardWidgetVO from './vos/DashboardWidgetVO';
import VOFieldRefVO from './vos/VOFieldRefVO';

export default class ModuleDashboardBuilder extends Module {

    public static MODULE_NAME: string = "DashboardBuilder";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".BO_ACCESS";

    public static getInstance(): ModuleDashboardBuilder {
        if (!ModuleDashboardBuilder.instance) {
            ModuleDashboardBuilder.instance = new ModuleDashboardBuilder();
        }
        return ModuleDashboardBuilder.instance;
    }

    private static instance: ModuleDashboardBuilder = null;

    private constructor() {

        super("dashboardbuilder", ModuleDashboardBuilder.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.init_DashboardVO();
        this.init_DashboardPageVO();
        this.init_DashboardWidgetVO();
        this.init_VOFieldRefVO();
    }

    private init_DashboardVO() {

        let datatable_fields = [
        ];

        let datatable = new ModuleTable(this, DashboardVO.API_TYPE_ID, () => new DashboardVO(), datatable_fields, null, "Dashboards");
    }

    private init_DashboardPageVO() {
        this.fields = [];
        this.datatables = [];

        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_string, 'Dashboard', true);

        let datatable_fields = [
            dashboard_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, DashboardPageVO.API_TYPE_ID, () => new DashboardPageVO(), datatable_fields, null, "Pages de Dashboard");
        dashboard_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[DashboardVO.API_TYPE_ID]);
    }

    private init_DashboardWidgetVO() {
        this.fields = [];
        this.datatables = [];

        let datatable_fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('options_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Options', true),
            new ModuleTableField('default_width', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 100),
            new ModuleTableField('default_height', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, DashboardWidgetVO.API_TYPE_ID, () => new DashboardWidgetVO(), datatable_fields, null, "Widgets de Dashboard");
    }

    private init_DashboardPageWidgetVO() {
        this.fields = [];
        this.datatables = [];

        let widget_id = new ModuleTableField('widget_id', ModuleTableField.FIELD_TYPE_string, 'Widget', true);
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_string, 'Page Dashboard', true);

        let datatable_fields = [
            widget_id,
            page_id,
            new ModuleTableField('isDraggable', ModuleTableField.FIELD_TYPE_boolean, 'isDraggable', true, true, true),
            new ModuleTableField('isResizable', ModuleTableField.FIELD_TYPE_boolean, 'isResizable', true, true, true),
            new ModuleTableField('static', ModuleTableField.FIELD_TYPE_boolean, 'static', true, true, false),
            new ModuleTableField('minH', ModuleTableField.FIELD_TYPE_int, 'minH', true, true, 1),
            new ModuleTableField('minW', ModuleTableField.FIELD_TYPE_int, 'minW', true, true, 1),
            new ModuleTableField('maxH', ModuleTableField.FIELD_TYPE_int, 'maxH', true, true, 720),
            new ModuleTableField('maxW', ModuleTableField.FIELD_TYPE_int, 'maxW', true, true, 1280),
            new ModuleTableField('x', ModuleTableField.FIELD_TYPE_int, 'x', true, true, 0),
            new ModuleTableField('y', ModuleTableField.FIELD_TYPE_int, 'y', true, true, 0),
            new ModuleTableField('w', ModuleTableField.FIELD_TYPE_int, 'w', true, true, 0),
            new ModuleTableField('h', ModuleTableField.FIELD_TYPE_int, 'h', true, true, 0),
            new ModuleTableField('i', ModuleTableField.FIELD_TYPE_int, 'i', true),
            new ModuleTableField('dragAllowFrom', ModuleTableField.FIELD_TYPE_string, 'dragAllowFrom', false),
            new ModuleTableField('dragIgnoreFrom', ModuleTableField.FIELD_TYPE_string, 'dragIgnoreFrom', false, true, 'a, button'),
            new ModuleTableField('resizeIgnoreFrom', ModuleTableField.FIELD_TYPE_string, 'resizeIgnoreFrom', false, true, 'a, button'),
            new ModuleTableField('preserveAspectRatio', ModuleTableField.FIELD_TYPE_boolean, 'preserveAspectRatio', true, true, false),

            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true),

            new ModuleTableField('json_options', ModuleTableField.FIELD_TYPE_string, 'json_options', false),
        ];

        let datatable = new ModuleTable(this, DashboardPageWidgetVO.API_TYPE_ID, () => new DashboardPageWidgetVO(), datatable_fields, null, "Pages de Dashboard");
        widget_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[DashboardWidgetVO.API_TYPE_ID]);
        page_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[DashboardPageVO.API_TYPE_ID]);
    }

    private init_VOFieldRefVO() {
        this.fields = [];
        this.datatables = [];

        let datatable_fields = [
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'VO Type', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'ID Champs', true),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        let datatable = new ModuleTable(this, VOFieldRefVO.API_TYPE_ID, () => new VOFieldRefVO(), datatable_fields, null, "Référence de champs");
    }
}