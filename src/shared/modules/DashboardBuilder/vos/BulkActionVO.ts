import DatatableField from "../../DAO/vos/datatable/DatatableField";
import DefaultTranslation from "../../Translation/vos/DefaultTranslation";

export default class BulkActionVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "bulk_action";

    public static createNew(
        label: string,
        callback: () => Promise<void>,
    ): BulkActionVO<any, any> {
        let res = new BulkActionVO();

        res.label = label;
        res.callback = callback;
        return res;
    }

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