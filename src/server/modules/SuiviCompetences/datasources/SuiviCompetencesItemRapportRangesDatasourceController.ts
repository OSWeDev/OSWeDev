import ContextQueryVO, { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SuiviCompetencesRapportGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO";
import SuiviCompetencesRapportSousGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO";
import SuiviCompetencesGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO";
import SuiviCompetencesItemRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO";
import SuiviCompetencesItemVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import SuiviCompetencesSousGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesSousGroupeVO";
import VOsTypesManager from "../../../../shared/modules/VO/manager/VOsTypesManager";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../../shared/tools/PromisePipeline/PromisePipeline";
import ConfigurationService from "../../../env/ConfigurationService";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";


export default class SuiviCompetencesItemRapportRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): SuiviCompetencesItemRapportRangesDatasourceController {
        if (!SuiviCompetencesItemRapportRangesDatasourceController.instance) {
            SuiviCompetencesItemRapportRangesDatasourceController.instance = new SuiviCompetencesItemRapportRangesDatasourceController(
                'SuiviCompetencesItemRapportRangesDatasourceController',
                [SuiviCompetencesItemRapportVO.API_TYPE_ID, SuiviCompetencesItemVO.API_TYPE_ID, SuiviCompetencesGroupeVO.API_TYPE_ID, SuiviCompetencesSousGroupeVO.API_TYPE_ID],
                { 'fr-fr': 'Suivi Competences Item Rapport' }
            );
        }
        return SuiviCompetencesItemRapportRangesDatasourceController.instance;
    }

    protected static instance: SuiviCompetencesItemRapportRangesDatasourceController = null;

    public async get_data(param: (SuiviCompetencesRapportGroupeDataRangesVO | SuiviCompetencesRapportSousGroupeDataRangesVO)): Promise<number> {
        let limit: number = ConfigurationService.node_configuration.MAX_POOL / 2;
        let promise_pipeline: PromisePipeline = new PromisePipeline(limit);

        let groupe_by_ids: { [groupe_id: number]: SuiviCompetencesGroupeVO } = {};
        let sous_groupe_by_ids: { [sous_groupe_id: number]: SuiviCompetencesSousGroupeVO } = {};
        let item_by_ids: { [item_id: number]: SuiviCompetencesItemVO } = {};
        let rapport_items: SuiviCompetencesItemRapportVO[] = [];

        await promise_pipeline.push(async () => {
            groupe_by_ids = VOsTypesManager.vosArray_to_vosByIds(
                await query(SuiviCompetencesGroupeVO.API_TYPE_ID).filter_by_ids(param.suivi_comp_groupe_id_ranges).select_vos()
            );
        });

        await promise_pipeline.push(async () => {
            let query_: ContextQueryVO = query(SuiviCompetencesSousGroupeVO.API_TYPE_ID)
                .filter_by_num_x_ranges(field_names<SuiviCompetencesSousGroupeVO>().groupe_id, param.suivi_comp_groupe_id_ranges);

            if ((param as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_sous_groupe_id_ranges?.length) {
                query_.filter_by_ids(
                    (param as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_sous_groupe_id_ranges
                );
            }

            sous_groupe_by_ids = VOsTypesManager.vosArray_to_vosByIds(
                await query_.select_vos()
            );
        });

        let query_item: ContextQueryVO = query(SuiviCompetencesItemVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<SuiviCompetencesItemVO>().groupe_id, param.suivi_comp_groupe_id_ranges);

        if ((param as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_sous_groupe_id_ranges?.length) {
            query_item.filter_by_num_x_ranges(
                field_names<SuiviCompetencesItemVO>().sous_groupe_id,
                (param as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_sous_groupe_id_ranges
            );
        }

        await promise_pipeline.push(async () => {
            item_by_ids = VOsTypesManager.vosArray_to_vosByIds(
                await query_item.select_vos()
            );
        });

        await promise_pipeline.push(async () => {
            let query_item_rapport: ContextQueryVO = query_item.clone();
            query_item_rapport.fields = [];
            query_item_rapport.field(field_names<SuiviCompetencesItemVO>().id);

            rapport_items = await query(SuiviCompetencesItemRapportVO.API_TYPE_ID)
                .filter_by_num_x_ranges(field_names<SuiviCompetencesItemRapportVO>().rapport_id, param.suivi_comp_rapport_id_ranges)
                .filter_by_num_in(field_names<SuiviCompetencesItemRapportVO>().suivi_comp_item_id, query_item_rapport)
                .select_vos();
        });

        await promise_pipeline.end();

        let res: number = 0;

        for (let i in rapport_items) {
            let rapport_item: SuiviCompetencesItemRapportVO = rapport_items[i];

            let item: SuiviCompetencesItemVO = item_by_ids[rapport_item.suivi_comp_item_id];

            if (!item) {
                continue;
            }

            let groupe: SuiviCompetencesGroupeVO = groupe_by_ids[item.groupe_id];
            let sous_groupe: SuiviCompetencesSousGroupeVO = sous_groupe_by_ids[item.sous_groupe_id];
            let ponderation: number = sous_groupe ? sous_groupe.ponderation : (groupe.ponderation ? groupe.ponderation : 1);
            let indicateur: number = rapport_item.indicateur ? rapport_item.indicateur : 0;

            res += (indicateur * ponderation);
        }

        return res ? res : null;
    }
}