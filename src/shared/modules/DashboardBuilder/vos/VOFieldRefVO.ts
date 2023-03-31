import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import DashboardBuilderController from "../DashboardBuilderController";
import { IVOFieldRefVOProps } from '../interfaces/IVOFieldRefVOProps';

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
     * @param props {IVOFieldRefVOProps}
     * @returns {VOFieldRefVO}
     */
    public from(props: IVOFieldRefVOProps): VOFieldRefVO {

        this.api_type_id = props.api_type_id ?? this.api_type_id;
        this.field_id = props.field_id ?? this.field_id;
        this.weight = props.weight ?? this.weight;
        this._type = props._type ?? this._type;
        this.id = props.id ?? this.id;

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