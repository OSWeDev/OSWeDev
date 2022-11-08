import AccessPolicyTools from '../../tools/AccessPolicyTools';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VarConfVO from '../Var/vos/VarConfVO';
import VOsTypesManager from '../VOsTypesManager';
import AdvancedDateFilterOptDescVO from './vos/AdvancedDateFilterOptDescVO';
import DashboardGraphVORefVO from './vos/DashboardGraphVORefVO';
import DashboardPageVO from './vos/DashboardPageVO';
import DashboardPageWidgetVO from './vos/DashboardPageWidgetVO';
import DashboardVO from './vos/DashboardVO';
import DashboardWidgetVO from './vos/DashboardWidgetVO';
import TableColumnDescVO from './vos/TableColumnDescVO';
import VOFieldRefVO from './vos/VOFieldRefVO';

export default class ModuleDashboardBuilder extends Module {

    public static MODULE_NAME: string = "DashboardBuilder";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleDashboardBuilder.MODULE_NAME + ".FO_ACCESS";

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

        let db_table = this.init_DashboardVO();
        let db_page = this.init_DashboardPageVO(db_table);
        this.init_DashboardGraphVORefVO(db_table);
        let db_widget = this.init_DashboardWidgetVO();
        this.init_DashboardPageWidgetVO(db_page, db_widget);
        this.init_VOFieldRefVO();
        this.init_TableColumnDescVO();
        this.init_AdvancedDateFilterOptDescVO();
    }

    private init_DashboardVO(): ModuleTable<any> {

        let datatable_fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('api_type_ids', ModuleTableField.FIELD_TYPE_string_array, 'Types', false)
        ];

        let res = new ModuleTable(this, DashboardVO.API_TYPE_ID, () => new DashboardVO(), datatable_fields, null, "Dashboards");
        this.datatables.push(res);
        return res;
    }


    private init_DashboardGraphVORefVO(db_table: ModuleTable<any>): ModuleTable<any> {

        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dashboard', true);

        let datatable_fields = [
            dashboard_id,
            new ModuleTableField('x', ModuleTableField.FIELD_TYPE_int, 'x', true),
            new ModuleTableField('y', ModuleTableField.FIELD_TYPE_int, 'y', true),
            new ModuleTableField('width', ModuleTableField.FIELD_TYPE_int, 'largeur', true),
            new ModuleTableField('height', ModuleTableField.FIELD_TYPE_int, 'hauteur', true),
            new ModuleTableField('vo_type', ModuleTableField.FIELD_TYPE_string, 'VOType', true),
            new ModuleTableField('values_to_exclude', ModuleTableField.FIELD_TYPE_string_array, 'field_id des liens à exclure'),
        ];

        let res = new ModuleTable(this, DashboardGraphVORefVO.API_TYPE_ID, () => new DashboardGraphVORefVO(), datatable_fields, null, "Cellule du graph de vos de Dashboard");
        this.datatables.push(res);
        dashboard_id.addManyToOneRelation(db_table);
        return res;
    }

    private init_DashboardPageVO(db_table: ModuleTable<any>): ModuleTable<any> {

        let dashboard_id = new ModuleTableField('dashboard_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Dashboard', true);

        let datatable_fields = [
            dashboard_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('hide_navigation', ModuleTableField.FIELD_TYPE_boolean, 'Cacher la navigation', true, true, false),
            new ModuleTableField('group_filters', ModuleTableField.FIELD_TYPE_boolean, 'Grouper les filtres', false, true, false),
        ];

        let res = new ModuleTable(this, DashboardPageVO.API_TYPE_ID, () => new DashboardPageVO(), datatable_fields, null, "Pages de Dashboard");
        this.datatables.push(res);
        dashboard_id.addManyToOneRelation(db_table);
        return res;
    }

    private init_DashboardWidgetVO(): ModuleTable<any> {

        let name = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', true).unique();

        let datatable_fields = [
            name,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('widget_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Widget', true),
            new ModuleTableField('options_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Options', true),
            new ModuleTableField('icon_component', ModuleTableField.FIELD_TYPE_string, 'Composant - Icône', true),
            new ModuleTableField('default_width', ModuleTableField.FIELD_TYPE_int, 'Largeur par défaut', true, true, 106),
            new ModuleTableField('default_height', ModuleTableField.FIELD_TYPE_int, 'Hauteur par défaut', true, true, 30),
            new ModuleTableField('default_background', ModuleTableField.FIELD_TYPE_string, 'default_background', true, true, '#f5f5f5'),
            new ModuleTableField('is_filter', ModuleTableField.FIELD_TYPE_boolean, 'is_filter'),
            new ModuleTableField('is_validation_filters', ModuleTableField.FIELD_TYPE_boolean, 'is_validation_filters'),
        ];

        let res = new ModuleTable(this, DashboardWidgetVO.API_TYPE_ID, () => new DashboardWidgetVO(), datatable_fields, name, "Widgets de Dashboard");
        this.datatables.push(res);
        return res;
    }

    private init_DashboardPageWidgetVO(db_page: ModuleTable<any>, db_widget: ModuleTable<any>) {

        let widget_id = new ModuleTableField('widget_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Widget', true);
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page Dashboard', true);

        let datatable_fields = [
            widget_id,
            page_id,
            new ModuleTableField('isDraggable', ModuleTableField.FIELD_TYPE_boolean, 'isDraggable', true, true, true),
            new ModuleTableField('isResizable', ModuleTableField.FIELD_TYPE_boolean, 'isResizable', true, true, true),
            new ModuleTableField('static', ModuleTableField.FIELD_TYPE_boolean, 'static', true, true, false),
            new ModuleTableField('minH', ModuleTableField.FIELD_TYPE_int, 'minH', false, true, 1),
            new ModuleTableField('minW', ModuleTableField.FIELD_TYPE_int, 'minW', false, true, 1),
            new ModuleTableField('maxH', ModuleTableField.FIELD_TYPE_int, 'maxH', false, true, 720),
            new ModuleTableField('maxW', ModuleTableField.FIELD_TYPE_int, 'maxW', false, true, 1272),
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

            new ModuleTableField('background', ModuleTableField.FIELD_TYPE_string, 'background', true),
        ];

        this.datatables.push(new ModuleTable(this, DashboardPageWidgetVO.API_TYPE_ID, () => new DashboardPageWidgetVO(), datatable_fields, null, "Pages de Dashboard"));
        widget_id.addManyToOneRelation(db_widget);
        page_id.addManyToOneRelation(db_page);
    }

    private init_VOFieldRefVO() {

        let datatable_fields = [
            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'VO Type', true),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'ID Champs', true),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
        ];

        this.datatables.push(new ModuleTable(this, VOFieldRefVO.API_TYPE_ID, () => new VOFieldRefVO(), datatable_fields, null, "Référence de champs"));
    }

    private init_TableColumnDescVO() {

        let var_id = new ModuleTableField('var_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Var', false);

        let datatable_fields = [
            new ModuleTableField('type', ModuleTableField.FIELD_TYPE_enum, 'Type de colonne', true).setEnumValues(TableColumnDescVO.TYPE_LABELS),

            new ModuleTableField('api_type_id', ModuleTableField.FIELD_TYPE_string, 'VO Type', false),
            new ModuleTableField('field_id', ModuleTableField.FIELD_TYPE_string, 'ID Champs', false),

            var_id,
            new ModuleTableField('component_name', ModuleTableField.FIELD_TYPE_string, 'Composant', false),

            new ModuleTableField('filter_type', ModuleTableField.FIELD_TYPE_string, 'Filtre', false),
            new ModuleTableField('filter_additional_params', ModuleTableField.FIELD_TYPE_string, 'Paramètres filtre', false),

            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0),
            new ModuleTableField('many_to_many_aggregate', ModuleTableField.FIELD_TYPE_boolean, 'Aggrégation des liens ManyToMany'),
            new ModuleTableField('disabled_many_to_one_link', ModuleTableField.FIELD_TYPE_boolean, 'Désactiver les liens ManyToOne'),
            new ModuleTableField('is_nullable', ModuleTableField.FIELD_TYPE_boolean, "La donnée peut-être null"),
            new ModuleTableField('show_tooltip', ModuleTableField.FIELD_TYPE_boolean, "Afficher la popup"),
            new ModuleTableField('is_sticky', ModuleTableField.FIELD_TYPE_boolean, "Figer", false, true, false),
            new ModuleTableField('header_name', ModuleTableField.FIELD_TYPE_string, "Entête de colonne"),

            new ModuleTableField('filter_custom_field_filters', ModuleTableField.FIELD_TYPE_plain_vo_obj, "filter_custom_field_filters").set_plain_obj_cstr(() => { }),
        ];

        this.datatables.push(new ModuleTable(this, TableColumnDescVO.API_TYPE_ID, () => new TableColumnDescVO(), datatable_fields, null, "Référence de champs"));

        var_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[VarConfVO.API_TYPE_ID]);
    }

    private init_AdvancedDateFilterOptDescVO() {

        let datatable_fields = [
            new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Nom', false),
            new ModuleTableField('value', ModuleTableField.FIELD_TYPE_int, 'Valeur', false),
            new ModuleTableField('ts_range', ModuleTableField.FIELD_TYPE_tsrange, 'Date', false).set_segmentation_type(TimeSegment.TYPE_DAY),

            new ModuleTableField('search_type', ModuleTableField.FIELD_TYPE_enum, 'Type de recherche').setEnumValues(AdvancedDateFilterOptDescVO.SEARCH_TYPE_LABELS),
            new ModuleTableField('segmentation_type', ModuleTableField.FIELD_TYPE_enum, 'Type de segment').setEnumValues(TimeSegment.TYPE_NAMES_ENUM),
        ];

        this.datatables.push(new ModuleTable(this, AdvancedDateFilterOptDescVO.API_TYPE_ID, () => new AdvancedDateFilterOptDescVO(), datatable_fields, null, "Option filtre date avancé"));
    }

}