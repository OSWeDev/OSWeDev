import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardBuilderController from "../DashboardBuilderController";

/**
 * VOFieldRefVO
 * - Field Filter definition for a dashboard page
 * - Its defined the api_type_id and field_id from which a filter widget shall filter on
 */
export default class VOFieldRefVO extends AbstractVO implements IDistantVOBase, IWeightedItem {
    public static VOFIELDREF_TYPE_ENUM_CODE: string = "vo_field_ref.type.enum";
    public static VOFIELDREF_TYPE_STRING_CODE: string = "vo_field_ref.type.string";
    public static VOFIELDREF_TYPE_BOOLEAN_CODE: string = "vo_field_ref.type.boolean";
    public static VOFIELDREF_TYPE_DATE_CODE: string = "vo_field_ref.type.date";
    public static VOFIELDREF_TYPE_NUMBER_CODE: string = "vo_field_ref.type.number";

    public static API_TYPE_ID: string = "vo_field_ref";

    public _type: string = VOFieldRefVO.API_TYPE_ID;

    public id: number;

    public api_type_id: string;

    public field_id: string;

    public weight: number;

    public get_translatable_name_code_text(page_widget_id: number): string {

        if (!page_widget_id) {
            return null;
        }

        if (!this.api_type_id) {
            return null;
        }

        if (!this.field_id) {
            return null;
        }

        return DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget_id + '.' + this.api_type_id + '.' + this.field_id;
    }

    /**
     * get_translatable_type_code_text
     *
     * @param {string} type
     * @returns {string}
     */
    public get_translatable_type_code_text(type: string): string {
        let code_text: string = null;

        if (!type) {
            return null;
        }

        switch (type) {
            case 'enum':
                code_text = VOFieldRefVO.VOFIELDREF_TYPE_ENUM_CODE;
                break;
            case 'string':
                code_text = VOFieldRefVO.VOFIELDREF_TYPE_STRING_CODE;
                break;
            case 'boolean':
                code_text = VOFieldRefVO.VOFIELDREF_TYPE_BOOLEAN_CODE;
                break;
            case 'date':
                code_text = VOFieldRefVO.VOFIELDREF_TYPE_DATE_CODE;
                break;
            case 'number':
                code_text = VOFieldRefVO.VOFIELDREF_TYPE_NUMBER_CODE;
                break;
        }

        return code_text;
    }
}