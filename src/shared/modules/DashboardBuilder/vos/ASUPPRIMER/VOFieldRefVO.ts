import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import AbstractVO from "../../VO/abstract/AbstractVO";
import DashboardBuilderController from "../DashboardBuilderController";

/**
 * TODO FIXME à supprimer, il s'agit simplement d'un lien vers ModulatableFieldVO
 * VOFieldRefVO
 * - Field Filter definition for a dashboard page
 * - Its defined the api_type_id and field_id from which a filter widget shall filter on
 */
export default class VOFieldRefVO extends AbstractVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "vo_field_ref";

    public _type: string = VOFieldRefVO.API_TYPE_ID;

    public id: number;

    public api_type_id: string;

    public field_id: string;

    // public get_translatable_name_code_text(page_widget_id: number): string {

    //     if (!page_widget_id) {
    //         return null;
    //     }

    //     if (!this.api_type_id) {
    //         return null;
    //     }

    //     if (!this.field_id) {
    //         return null;
    //     }

    //     return DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget_id + '.' + this.api_type_id + '.' + this.field_id;
    // }
}