import DocumentTagVO from "../../../../../shared/modules/Document/vos/DocumentTagVO";
import DocumentVO from "../../../../../shared/modules/Document/vos/DocumentVO";

export default class DocumentHandlerReloadListVO {
    public static createNew(
        ds_by_dt_ids_and_by_ids: { [dt_id: number]: { [d_id: number]: DocumentVO } },
        list: DocumentVO[],
        dts_by_weight: DocumentTagVO[],
        d_by_ids: { [id: number]: DocumentVO },
        has_docs_route_name: { [route_name: string]: boolean },
    ): DocumentHandlerReloadListVO {
        let res: DocumentHandlerReloadListVO = new DocumentHandlerReloadListVO();

        res.ds_by_dt_ids_and_by_ids = ds_by_dt_ids_and_by_ids;
        res.list = list;
        res.dts_by_weight = dts_by_weight;
        res.d_by_ids = d_by_ids;
        res.has_docs_route_name = has_docs_route_name;

        return res;
    }

    public ds_by_dt_ids_and_by_ids: { [dt_id: number]: { [d_id: number]: DocumentVO } };
    public list: DocumentVO[];
    public dts_by_weight: DocumentTagVO[];
    public d_by_ids: { [id: number]: DocumentVO };
    public has_docs_route_name: { [route_name: string]: boolean };
}