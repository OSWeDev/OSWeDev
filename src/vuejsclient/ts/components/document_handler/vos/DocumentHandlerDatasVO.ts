import DocumentDocumentTagVO from "../../../../../shared/modules/Document/vos/DocumentDocumentTagVO";
import DocumentTagGroupVO from "../../../../../shared/modules/Document/vos/DocumentTagGroupVO";
import DocumentTagVO from "../../../../../shared/modules/Document/vos/DocumentTagVO";
import DocumentVO from "../../../../../shared/modules/Document/vos/DocumentVO";

export default class DocumentHandlerDatasVO {
    public static createNew(
        all_d_by_ids: { [id: number]: DocumentVO },
        all_dt_by_ids: { [id: number]: DocumentTagVO },
        dt_by_ids: { [id: number]: DocumentTagVO },
        dts_by_dtg_ids: { [dtg_id: number]: DocumentTagVO[] },
        dtg_by_ids: { [id: number]: DocumentTagGroupVO },
        dtgs_by_weight: DocumentTagGroupVO[],
        d_dts: DocumentDocumentTagVO[],
    ): DocumentHandlerDatasVO {
        const res: DocumentHandlerDatasVO = new DocumentHandlerDatasVO();

        res.all_d_by_ids = all_d_by_ids;
        res.all_dt_by_ids = all_dt_by_ids;
        res.dt_by_ids = dt_by_ids;
        res.dts_by_dtg_ids = dts_by_dtg_ids;
        res.dtg_by_ids = dtg_by_ids;
        res.dtgs_by_weight = dtgs_by_weight;
        res.d_dts = d_dts;

        return res;
    }

    public all_d_by_ids: { [id: number]: DocumentVO };
    public all_dt_by_ids: { [id: number]: DocumentTagVO };
    public dt_by_ids: { [id: number]: DocumentTagVO };
    public dts_by_dtg_ids: { [dtg_id: number]: DocumentTagVO[] };
    public dtg_by_ids: { [id: number]: DocumentTagGroupVO };
    public dtgs_by_weight: DocumentTagGroupVO[];
    public d_dts: DocumentDocumentTagVO[];
}