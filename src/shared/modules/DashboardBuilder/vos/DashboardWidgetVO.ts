import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import INamedVO from "../../../interfaces/INamedVO";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";
import DashboardBuilderController from "../DashboardBuilderController";


/**
 * @class DashboardWidgetVO
 *  - DashboardWidgetVO is the DashboardPageWidgetVO type actually
 *
 * May be renamed to DashboardWidgetTypeVO
 */
export default class DashboardWidgetVO implements IDistantVOBase, IWeightedItem, INamedVO {
    public static API_TYPE_ID: string = "dashboard_widget";

    public static WIDGET_NAME_perfreportgraph: string = 'perfreportgraph';
    public static WIDGET_NAME_bulkops: string = 'bulkops';
    public static WIDGET_NAME_checklist: string = 'checklist';
    public static WIDGET_NAME_supervision: string = 'supervision';
    public static WIDGET_NAME_supervision_type: string = 'supervision_type';
    public static WIDGET_NAME_datatable: string = 'datatable';
    public static WIDGET_NAME_oseliathread: string = 'oseliathread';
    public static WIDGET_NAME_fieldvaluefilter: string = 'fieldvaluefilter';
    public static WIDGET_NAME_dowfilter: string = 'dowfilter';
    public static WIDGET_NAME_monthfilter: string = 'monthfilter';
    public static WIDGET_NAME_advanceddatefilter: string = 'advanceddatefilter';
    public static WIDGET_NAME_yearfilter: string = 'yearfilter';
    public static WIDGET_NAME_currentuserfilter: string = 'currentuserfilter';
    public static WIDGET_NAME_validationfilters: string = 'validationfilters';
    public static WIDGET_NAME_savefavoritesfilters: string = 'savefavoritesfilters';
    public static WIDGET_NAME_showfavoritesfilters: string = 'showfavoritesfilters';
    public static WIDGET_NAME_var: string = 'var';
    public static WIDGET_NAME_pageswitch: string = 'pageswitch';
    public static WIDGET_NAME_varpiechart: string = 'varpiechart';
    public static WIDGET_NAME_varchoroplethchart: string = 'varchoroplethchart';
    public static WIDGET_NAME_varradarchart: string = 'varradarchart';
    public static WIDGET_NAME_varmixedcharts: string = 'varmixedcharts';
    public static WIDGET_NAME_oseliarungraphwidget: string = 'oseliarungraphwidget';
    public static WIDGET_NAME_resetfilters: string = 'resetfilters';
    public static WIDGET_NAME_bloctext: string = 'BlocText';
    public static WIDGET_NAME_suivicompetences: string = 'SuiviCompetences';


    public static WIDGET_NAME_cmsbloctext: string = 'cmsbloctext';
    public static WIDGET_NAME_cmsimage: string = 'cmsimage';
    public static WIDGET_NAME_cmslinkbutton: string = 'cmslinkbutton';
    public static WIDGET_NAME_cmslikebutton: string = 'cmslikebutton';
    public static WIDGET_NAME_crudbuttons: string = 'crudbuttons';
    public static WIDGET_NAME_cmsprintparam: string = 'cmsprintparam';
    public static WIDGET_NAME_cmsvisionneusepdf: string = 'cmsvisionneusepdf';
    public static WIDGET_NAME_cmsbooleanbutton: string = 'cmsbooleanbutton';

    public static WIDGET_NAME_TemplateConsultation_crudbuttons: string = 'templateconsultation_crudbuttons';
    public static WIDGET_NAME_TemplateConsultation_bloctext: string = 'templateconsultation_bloctext';
    public static WIDGET_NAME_TemplateConsultation_image: string = 'templateconsultation_image';
    public static WIDGET_NAME_TemplateConsultation_linkbutton: string = 'templateconsultation_linkbutton';
    public static WIDGET_NAME_TemplateConsultation_visionneusepdf: string = 'templateconsultation_visionneusepdf';


    public id: number;
    public _type: string = DashboardWidgetVO.API_TYPE_ID;

    public label: string;

    public weight: number;

    public widget_component: string;
    public options_component: string;

    /**
     * @deprecated Use icon_html instead
     */
    public icon_component: string;

    /**
     * Le code html de l'icône du widget
     */
    public icon_html: string;

    public default_width: number;
    public default_height: number;

    /**
     * Needs to be unique for ergonomy and widget retrieval
     */
    public name: string;

    public default_background: string;

    public is_filter: boolean;
    public is_validation_filters: boolean;
}