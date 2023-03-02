import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import IDistantVOBase from "../../IDistantVOBase";

export default class TableBulkButtonDescVO implements IDistantVOBase, IWeightedItem {

    public static API_TYPE_ID: string = "table_bulk_button_desc";

    public id: number;
    public _type: string = TableBulkButtonDescVO.API_TYPE_ID;

    public button_width: number;
    public button_height: number;
    public button_bg_color: string;
    public button_font_color: string;
    public button_title: string;

    public callback_name: string;

    public weight: number;

}