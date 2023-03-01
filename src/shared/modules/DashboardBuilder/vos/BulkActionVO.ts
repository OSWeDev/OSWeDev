import IWeightedItem from "../../../tools/interfaces/IWeightedItem";
import IDistantVOBase from "../../IDistantVOBase";
import DefaultTranslation from "../../Translation/vos/DefaultTranslation";

export default class BulkActionVO implements IDistantVOBase, IWeightedItem {

    public static API_TYPE_ID: string = "bulk_action";

    public id: number;
    public _type: string = BulkActionVO.API_TYPE_ID;

    public label: string;
    public weight: number;
    public callback: () => Promise<void>;

    get translatable_title(): string {
        if (!this.label) {
            return null;
        }

        return "fields.labels." + this.label + ".__bulk_action__" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }
}