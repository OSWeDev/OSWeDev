import DefaultTranslationVO from "../../Translation/vos/DefaultTranslationVO";

export default class BulkActionVO {

    public static createNew(
        vo_type_id: string,
        label: string,
        callback: (vo_ids: number[]) => Promise<void>,
    ): BulkActionVO {
        let res = new BulkActionVO();

        res.vo_type_id = vo_type_id;
        res.label = label;
        res.callback = callback;

        return res;
    }

    public vo_type_id: string;
    public label: string;
    public weight: number;
    public callback: (vo_ids: number[]) => Promise<void>;

    get translatable_title(): string {
        if (!this.label) {
            return null;
        }

        return "fields.labels.bulk_action." + this.vo_type_id + "." + this.label + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }
}