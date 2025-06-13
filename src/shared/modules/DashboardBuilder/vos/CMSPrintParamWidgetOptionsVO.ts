import ParamVO from "../../Params/vos/ParamVO";
import AbstractVO from "../../VO/abstract/AbstractVO";

export default class CMSPrintParamWidgetOptionsVO extends AbstractVO {

    public static TYPE_STRING: number = 1;
    public static TYPE_BOOLEAN: number = 2;
    public static TYPE_INT: number = 3;
    public static TYPE_FLOAT: number = 4;
    public static TYPE_DATE: number = 5;
    public static TYPE_STRING_LABEL: string = 'cms_print_param.string';
    public static TYPE_BOOLEAN_LABEL: string = 'cms_print_param.boolean';
    public static TYPE_INT_LABEL: string = 'cms_print_param.int';
    public static TYPE_FLOAT_LABEL: string = 'cms_print_param.float';
    public static TYPE_DATE_LABEL: string = 'cms_print_param.date';

    public type_param: number;
    public param_name: string;
    public titre: string;

    public static createNew(
        type_param: number,
        param_name: string,
        titre: string
    ): CMSPrintParamWidgetOptionsVO {
        const res = new CMSPrintParamWidgetOptionsVO();

        res.type_param = type_param;
        res.param_name = param_name;
        res.titre = titre;

        return res;
    }
}