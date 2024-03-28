import ContextQueryVO, { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import SuiviCompetencesIndicateurTableFieldTypeController from "../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController";
import SuiviCompetencesIndicateurVO from "../../../../shared/modules/SuiviCompetences/fields/indicateur/vos/SuiviCompetencesIndicateurVO";
import SuiviCompetencesRapportGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO";
import SuiviCompetencesRapportSousGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO";
import SuiviCompetencesGrilleVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO";
import SuiviCompetencesGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO";
import SuiviCompetencesItemVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import SuiviCompetencesSousGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesSousGroupeVO";
import VOsTypesManager from "../../../../shared/modules/VO/manager/VOsTypesManager";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../../shared/tools/PromisePipeline/PromisePipeline";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import ConfigurationService from "../../../env/ConfigurationService";
import DataSourceControllerMatroidIndexedBase from "../../Var/datasource/DataSourceControllerMatroidIndexedBase";

export default class SuiviCompetencesItemRangesDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(): SuiviCompetencesItemRangesDatasourceController {
        if (!SuiviCompetencesItemRangesDatasourceController.instance) {
            SuiviCompetencesItemRangesDatasourceController.instance = new SuiviCompetencesItemRangesDatasourceController(
                'SuiviCompetencesItemRangesDatasourceController',
                [SuiviCompetencesItemVO.API_TYPE_ID, SuiviCompetencesGroupeVO.API_TYPE_ID, SuiviCompetencesSousGroupeVO.API_TYPE_ID],
                { 'fr-fr': 'Suivi Competences Item' }
            );
        }
        return SuiviCompetencesItemRangesDatasourceController.instance;
    }

    protected static instance: SuiviCompetencesItemRangesDatasourceController = null;

    public async get_data(param: (SuiviCompetencesRapportGroupeDataRangesVO | SuiviCompetencesRapportSousGroupeDataRangesVO)): Promise<number> {
        let limit: number = ConfigurationService.node_configuration.MAX_POOL / 2;
        let promise_pipeline: PromisePipeline = new PromisePipeline(limit);

        let grille_by_ids: { [grille_id: number]: SuiviCompetencesGrilleVO } = {};
        let groupe_by_ids: { [groupe_id: number]: SuiviCompetencesGroupeVO } = {};
        let sous_groupe_by_ids: { [sous_groupe_id: number]: SuiviCompetencesSousGroupeVO } = {};
        let item_by_ids: { [id: number]: SuiviCompetencesItemVO } = {};

        await promise_pipeline.push(async () => {
            grille_by_ids = VOsTypesManager.vosArray_to_vosByIds(
                await query(SuiviCompetencesGrilleVO.API_TYPE_ID)
                    .filter_by_id_in(
                        query(SuiviCompetencesRapportVO.API_TYPE_ID)
                            .field(field_names<SuiviCompetencesRapportVO>().suivi_comp_grille_id)
                            .filter_by_ids(param.suivi_comp_rapport_id_ranges)
                    )
                    .select_vos()
            );
        });

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

        await promise_pipeline.push(async () => {
            let query_: ContextQueryVO = query(SuiviCompetencesItemVO.API_TYPE_ID)
                .filter_by_num_x_ranges(field_names<SuiviCompetencesItemVO>().groupe_id, param.suivi_comp_groupe_id_ranges);

            if ((param as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_sous_groupe_id_ranges?.length) {
                query_.filter_by_num_x_ranges(
                    field_names<SuiviCompetencesItemVO>().sous_groupe_id,
                    (param as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_sous_groupe_id_ranges
                );
            }

            item_by_ids = VOsTypesManager.vosArray_to_vosByIds(
                await query_.select_vos()
            );
        });

        await promise_pipeline.end();

        let res: number = 0;

        for (let i in grille_by_ids) {
            let grille: SuiviCompetencesGrilleVO = grille_by_ids[i];

            RangeHandler.foreach_ranges_sync(grille.suivi_comp_item_id_ranges, (item_id: number) => {
                let item: SuiviCompetencesItemVO = item_by_ids[item_id];

                if (!item) {
                    return;
                }

                let groupe: SuiviCompetencesGroupeVO = groupe_by_ids[item.groupe_id];
                let sous_groupe: SuiviCompetencesSousGroupeVO = sous_groupe_by_ids[item.sous_groupe_id];
                let ponderation: number = sous_groupe ? sous_groupe.ponderation : (groupe.ponderation ? groupe.ponderation : 1);
                let indicateurs: SuiviCompetencesIndicateurVO[] = SuiviCompetencesIndicateurTableFieldTypeController.getInstance().get_value(item);
                let nb_indicateurs: number = indicateurs?.length ? indicateurs.length : 0;

                res += (nb_indicateurs * ponderation);
            });
        }

        return res ? res : null;
    }
}