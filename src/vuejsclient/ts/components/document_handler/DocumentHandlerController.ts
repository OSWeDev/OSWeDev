import Component from 'vue-class-component';
import VueComponentBase from '../VueComponentBase';
import DocumentHandlerButtonComponent from './button/DocumentHandlerButtonComponent';
import DocumentHandlerModalComponent from './modal/DocumentHandlerModalComponent';
import './DocumentHandlerComponent.scss';
import { ModuleDocumentAction, ModuleDocumentGetter } from './store/DocumentStore';
import DocumentVO from '../../../../shared/modules/Document/vos/DocumentVO';
import DocumentTagVO from '../../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentTagGroupVO from '../../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentDocumentTagVO from '../../../../shared/modules/Document/vos/DocumentDocumentTagVO';
import { Watch } from 'vue-property-decorator';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ModuleDocument from '../../../../shared/modules/Document/ModuleDocument';
import DocumentTagDocumentTagGroupVO from '../../../../shared/modules/Document/vos/DocumentTagDocumentTagGroupVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import DocumentHandlerReloadListVO from './vos/DocumentHandlerReloadListVO';
import DocumentHandlerDatasVO from './vos/DocumentHandlerDatasVO';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';

export default class DocumentHandlerController {

    public static getInstance(): DocumentHandlerController {
        if (!DocumentHandlerController.instance) {
            DocumentHandlerController.instance = new DocumentHandlerController();
        }

        return DocumentHandlerController.instance;
    }

    private static instance: DocumentHandlerController = null;

    public async reloadDatas(): Promise<DocumentHandlerDatasVO> {
        let promises: Array<Promise<any>> = [];

        let res: DocumentHandlerDatasVO = new DocumentHandlerDatasVO();

        let tmp_dtg_by_ids: { [id: number]: DocumentTagGroupVO } = {};
        let tmp_dts_by_dtg_ids: { [dtg_id: number]: DocumentTagVO[] } = {};

        promises.push((async () => {
            res.all_d_by_ids = VOsTypesManager.vosArray_to_vosByIds(await ModuleDocument.getInstance().get_ds_by_user_lang());
        })());
        promises.push((async () => {
            res.all_dt_by_ids = VOsTypesManager.vosArray_to_vosByIds(await ModuleDocument.getInstance().get_dts_by_user_lang());
        })());

        let tmp_dtgs_by_weight: DocumentTagGroupVO[] = [];
        promises.push((async () => {
            tmp_dtgs_by_weight = await ModuleDocument.getInstance().get_dtgs_by_user_lang();
            tmp_dtg_by_ids = VOsTypesManager.vosArray_to_vosByIds(tmp_dtgs_by_weight);
        })());

        await all_promises(promises);

        promises = [];

        let valid_dt_by_ids: { [id: number]: DocumentTagVO } = {};
        let valid_dtg_by_ids: { [id: number]: DocumentTagGroupVO } = tmp_dtg_by_ids;

        let dt_dtgs: DocumentTagDocumentTagGroupVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<DocumentTagDocumentTagGroupVO>(
            DocumentTagDocumentTagGroupVO.API_TYPE_ID,
            'dt_id', ObjectHandler.getInstance().getIdsList(res.all_dt_by_ids),
            'dtg_id', ObjectHandler.getInstance().getIdsList(tmp_dtg_by_ids)
        );

        tmp_dts_by_dtg_ids = {};

        for (let i in dt_dtgs) {
            let dt_dtg = dt_dtgs[i];

            if (!tmp_dts_by_dtg_ids[dt_dtg.dtg_id]) {
                tmp_dts_by_dtg_ids[dt_dtg.dtg_id] = [];
            }
            tmp_dts_by_dtg_ids[dt_dtg.dtg_id].push(res.all_dt_by_ids[dt_dtg.dt_id]);

            if (!valid_dt_by_ids[dt_dtg.dt_id]) {
                valid_dt_by_ids[dt_dtg.dt_id] = res.all_dt_by_ids[dt_dtg.dt_id];
            }
        }

        res.d_dts = await ModuleDAO.getInstance().getVosByRefFieldsIds<DocumentDocumentTagVO>(
            DocumentDocumentTagVO.API_TYPE_ID,
            'd_id', ObjectHandler.getInstance().getIdsList(res.all_d_by_ids),
            'dt_id', ObjectHandler.getInstance().getIdsList(valid_dt_by_ids)
        );

        WeightHandler.getInstance().sortByWeight(tmp_dtgs_by_weight);
        res.dtgs_by_weight = tmp_dtgs_by_weight;

        res.dt_by_ids = valid_dt_by_ids;
        res.dtg_by_ids = valid_dtg_by_ids;

        res.dts_by_dtg_ids = tmp_dts_by_dtg_ids;

        return res;
    }

    public reload_list(
        d_dts: DocumentDocumentTagVO[],
        all_d_by_ids: { [id: number]: DocumentVO },
        only_routename: boolean,
        route_name: string,
        all_dt_by_ids: { [id: number]: DocumentTagVO }
    ): DocumentHandlerReloadListVO {
        let tmp_ds_by_dt_ids_and_by_ids: { [dt_id: number]: { [d_id: number]: DocumentVO } } = {};
        let tmp_list: DocumentVO[] = [];
        let tmp_dts_by_weight: DocumentTagVO[] = [];
        let valid_d_by_ids: { [id: number]: DocumentVO } = {};
        let has_docs_route_name: { [route_name: string]: boolean } = {};

        let already_add_dts: { [dt_id: number]: boolean } = {};

        for (let i in d_dts) {
            let d_dt = d_dts[i];

            let doc: DocumentVO = all_d_by_ids[d_dt.d_id];

            if (doc.target_route_name) {
                has_docs_route_name[doc.target_route_name] = true;
            }

            // Si on est en only_routename, on cherche a afficher les docs de la route seulement
            if (only_routename) {
                if (!doc.target_route_name || (doc.target_route_name != route_name)) {
                    continue;
                }
            }

            if (!tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id]) {
                tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id] = {};
            }

            tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id][d_dt.d_id] = doc;

            if (!valid_d_by_ids[d_dt.d_id]) {
                valid_d_by_ids[d_dt.d_id] = doc;
                tmp_list.push(doc);
            }

            if (!already_add_dts[d_dt.dt_id]) {
                already_add_dts[d_dt.dt_id] = true;
                tmp_dts_by_weight.push(all_dt_by_ids[d_dt.dt_id]);
            }
        }

        WeightHandler.getInstance().sortByWeight(tmp_list);
        WeightHandler.getInstance().sortByWeight(tmp_dts_by_weight);

        return DocumentHandlerReloadListVO.createNew(
            tmp_ds_by_dt_ids_and_by_ids,
            tmp_list,
            tmp_dts_by_weight,
            valid_d_by_ids,
            has_docs_route_name
        );
    }
}