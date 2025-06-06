import WidgetOptionsBaseVO from "../WidgetOptionsBaseVO";

export default class CMSPrintParamWidgetOptionsVO extends WidgetOptionsBaseVO {

    public static API_TYPE_ID: string = "cms_print_param_widget_options";

    public static TYPE_NA: number = 0; // Pour des raisons de compatibilité à la migration
    public static TYPE_STRING: number = 1;
    public static TYPE_BOOLEAN: number = 2;
    public static TYPE_INT: number = 3;
    public static TYPE_FLOAT: number = 4;
    public static TYPE_DATE: number = 5;
    public static TYPE_LABELS: { [key: number]: string } = {
        [CMSPrintParamWidgetOptionsVO.TYPE_NA]: 'cms_print_param.na',
        [CMSPrintParamWidgetOptionsVO.TYPE_STRING]: 'cms_print_param.string',
        [CMSPrintParamWidgetOptionsVO.TYPE_BOOLEAN]: 'cms_print_param.boolean',
        [CMSPrintParamWidgetOptionsVO.TYPE_INT]: 'cms_print_param.int',
        [CMSPrintParamWidgetOptionsVO.TYPE_FLOAT]: 'cms_print_param.float',
        [CMSPrintParamWidgetOptionsVO.TYPE_DATE]: 'cms_print_param.date',
    };

    public _type: string = CMSPrintParamWidgetOptionsVO.API_TYPE_ID;

    /**
     * Anciennement titre
     */
    public print_titre: string;

    public type_param: number;

    /**
     * Anciennement param
     */
    public param_id: number;
}