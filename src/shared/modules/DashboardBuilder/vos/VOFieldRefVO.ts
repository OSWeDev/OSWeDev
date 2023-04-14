import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DashboardBuilderController from "../DashboardBuilderController";

/**
 * VOFieldRefVO
 */
export default class VOFieldRefVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "vo_field_ref";

    public id: number;
    public _type: string = VOFieldRefVO.API_TYPE_ID;

    public api_type_id: string;
    public field_id: string;

    public weight: number;

    /**
     * Hydrate from the given properties
     *
     * @param {Partial<VOFieldRefVO>} props
     * @returns {VOFieldRefVO}
     */
    public from(props: Partial<VOFieldRefVO>): VOFieldRefVO {

        Object.assign(this, props);

        return this;
    }

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
}