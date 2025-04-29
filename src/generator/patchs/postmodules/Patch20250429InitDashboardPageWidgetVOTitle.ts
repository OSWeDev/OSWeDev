import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import UIDGenerator from "../../../server/UIDGenerator";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import DashboardPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import VOsTypesManager from "../../../shared/modules/VO/manager/VOsTypesManager";
import IGeneratorWorker from "../../IGeneratorWorker";

export default class Patch20250429InitDashboardPageWidgetVOTitle implements IGeneratorWorker {

    private static instance: Patch20250429InitDashboardPageWidgetVOTitle = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250429InitDashboardPageWidgetVOTitle';
    }

    public static getInstance(): Patch20250429InitDashboardPageWidgetVOTitle {
        if (!Patch20250429InitDashboardPageWidgetVOTitle.instance) {
            Patch20250429InitDashboardPageWidgetVOTitle.instance = new Patch20250429InitDashboardPageWidgetVOTitle();
        }
        return Patch20250429InitDashboardPageWidgetVOTitle.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // Là on est obligé de découper widget par widget, par ce que le title était en fait lié souvent au vofieldref des options du widget....


        const vos = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardPageWidgetVO>();
        const widgets_by_id = VOsTypesManager.vosArray_to_vosByIds(await query(DashboardWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardWidgetVO>());

        for (const i in vos) {
            const page_widget = vos[i];
            const widget = widgets_by_id[page_widget.widget_id];

            const options = JSON.parse(page_widget.json_options);
            let current_widget_title_code = null;
            /**
                WIDGET_NAME_perfreportgraph
                WIDGET_NAME_bulkops
                WIDGET_NAME_checklist
                WIDGET_NAME_supervision
                WIDGET_NAME_supervision_type
                WIDGET_NAME_datatable
                WIDGET_NAME_oseliathread
                WIDGET_NAME_oseliacreator
                WIDGET_NAME_fieldvaluefilter
                WIDGET_NAME_dowfilter
                WIDGET_NAME_monthfilter
                WIDGET_NAME_advanceddatefilter
                WIDGET_NAME_yearfilter
                WIDGET_NAME_currentuserfilter
                WIDGET_NAME_validationfilters
                WIDGET_NAME_savefavoritesfilters
                WIDGET_NAME_showfavoritesfilters
                WIDGET_NAME_var
                WIDGET_NAME_pageswitch
                WIDGET_NAME_varpiechart
                WIDGET_NAME_varchoroplethchart
                WIDGET_NAME_varradarchart
                WIDGET_NAME_varmixedcharts
                WIDGET_NAME_bloctext
                WIDGET_NAME_listobject
                WIDGET_NAME_cmsbloctext
                WIDGET_NAME_cmsimage
                WIDGET_NAME_cmslinkbutton
                WIDGET_NAME_cmslikebutton
                WIDGET_NAME_crudbuttons
                WIDGET_NAME_cmsprintparam
                WIDGET_NAME_cmsvisionneusepdf
                WIDGET_NAME_cmsbooleanbutton
                WIDGET_NAME_oseliarungraphwidget
             */
            switch (widget.name) {
                case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                case DashboardWidgetVO.WIDGET_NAME_advanceddatefilter:
                    // current_widget_title_code = "FieldValueFilterWidgetOptions.vo_field_ref.placeholder." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    current_widget_title_code = "dashboard.vofieldref.name." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    break;


                case DashboardWidgetVO.WIDGET_NAME_bloctext:
                case DashboardWidgetVO.WIDGET_NAME_cmsbloctext:
                case DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton:
                case DashboardWidgetVO.WIDGET_NAME_cmsimage:
                case DashboardWidgetVO.WIDGET_NAME_cmslinkbutton:
                case DashboardWidgetVO.WIDGET_NAME_cmslikebutton:
                case DashboardWidgetVO.WIDGET_NAME_cmsprintparam:
                case DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf:
                case DashboardWidgetVO.WIDGET_NAME_crudbuttons:
                case DashboardWidgetVO.WIDGET_NAME_currentuserfilter:
                case DashboardWidgetVO.WIDGET_NAME_listobject:
                case DashboardWidgetVO.WIDGET_NAME_oseliarungraphwidget:
                case DashboardWidgetVO.WIDGET_NAME_perfreportgraph:
                    current_widget_title_code = UIDGenerator.get_new_uid();
                    break;

                case DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters:
                case DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters:
                    current_widget_title_code = "FavoritesFiltersWidgetOptionsVO.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_bulkops:
                    current_widget_title_code = 'BulkOpsWidgetOptions.title.' + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_checklist:
                    current_widget_title_code = "ChecklistWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_datatable:
                    current_widget_title_code = "TableWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_dowfilter:
                    // current_widget_title_code = "DOWFilterWidgetOptions.vo_field_ref.placeholder." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    current_widget_title_code = "dashboard.vofieldref.name." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                    // current_widget_title_code = "MonthFilterWidgetOptions.vo_field_ref.placeholder." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    current_widget_title_code = "dashboard.vofieldref.name." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_oseliathread:
                    current_widget_title_code = "OseliaThreadWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_pageswitch:
                    current_widget_title_code = "PageSwitchWidgetOptions.title." + page_widget.page_id + '.' + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_supervision:
                    current_widget_title_code = "SupervisionWidgetOptionsVO.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_supervision_type:
                    current_widget_title_code = "SupervisionTypeWidgetOptionsVO.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_validationfilters:
                    current_widget_title_code = "ValidationFiltersWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_var:
                    current_widget_title_code = "VarWidgetOptions.title." + options.var_id + '.' + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_varchoroplethchart:
                    current_widget_title_code = "VarChoroplethChartWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_varmixedcharts:
                    current_widget_title_code = "VarMixedChartWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_varpiechart:
                    current_widget_title_code = "VarPieChartWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_varradarchart:
                    current_widget_title_code = "VarRadarChartWidgetOptions.title." + page_widget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                    // current_widget_title_code = "YearFilterWidgetOptions.vo_field_ref.placeholder." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    current_widget_title_code = "dashboard.vofieldref.name." + page_widget.id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                    break;

                default:
                    break;
            }
            page_widget.title = current_widget_title_code;
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos);
    }
}