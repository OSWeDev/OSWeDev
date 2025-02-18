import APIControllerWrapper from "../../../../shared/modules/API/APIControllerWrapper";
import UserVO from "../../../../shared/modules/AccessPolicy/vos/UserVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import IExportableDatas from "../../../../shared/modules/DataExport/interfaces/IExportableDatas";
import ExportHistoricVO from "../../../../shared/modules/DataExport/vos/ExportHistoricVO";
import NumRange from "../../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ModuleSuiviCompetences from "../../../../shared/modules/SuiviCompetences/ModuleSuiviCompetences";
import SuiviCompetencesGroupeResult from "../../../../shared/modules/SuiviCompetences/apis/SuiviCompetencesGroupeResult";
import ExportSuiviCompetencesRapportHandlerParam from "../../../../shared/modules/SuiviCompetences/exports/ExportSuiviCompetencesRapportHandlerParam";
import SuiviCompetencesIndicateurTableFieldTypeController from "../../../../shared/modules/SuiviCompetences/fields/indicateur/SuiviCompetencesIndicateurTableFieldTypeController";
import SuiviCompetencesIndicateurVO from "../../../../shared/modules/SuiviCompetences/fields/indicateur/vos/SuiviCompetencesIndicateurVO";
import SuiviCompetencesGrilleVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO";
import SuiviCompetencesItemRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO";
import SuiviCompetencesItemVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import VOsTypesManager from "../../../../shared/modules/VO/manager/VOsTypesManager";
import ObjectHandler, { field_names } from "../../../../shared/tools/ObjectHandler";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import ExportHandlerBase from "../../DataExport/ExportHandlerBase";

export default class SuiviCompetencesRapportExportHandler extends ExportHandlerBase {

    public static getInstance() {
        if (!SuiviCompetencesRapportExportHandler.instance) {
            SuiviCompetencesRapportExportHandler.instance = new SuiviCompetencesRapportExportHandler();
        }
        return SuiviCompetencesRapportExportHandler.instance;
    }

    private static instance: SuiviCompetencesRapportExportHandler = null;

    private column_labels: { [field_name: string]: string } = {};
    private ordered_column_list: string[] = [];

    protected constructor() {
        super();
    }

    public async prepare_datas(exhi: ExportHistoricVO): Promise<IExportableDatas> {

        let datas: IExportableDatas = {
            api_type_id: ModuleSuiviCompetences.EXPORT_SUIVI_COMPETENCES_RAPPORT,
            column_labels: null,
            datas: await this.get_datas(exhi),
            filename: ModuleSuiviCompetences.EXPORT_SUIVI_COMPETENCES_RAPPORT + '_' + Dates.format(exhi.creation_date, 'DD_MM') + '_' + exhi.creation_date + '.xlsx',
            ordered_column_list: null
        };

        datas.column_labels = this.column_labels;
        datas.ordered_column_list = this.ordered_column_list;

        if (!datas.datas) {
            return null;
        }

        return datas;
    }

    private async get_datas(exhi: ExportHistoricVO): Promise<any[]> {
        let res: any[] = [];

        if ((!exhi.export_to_uid) || (!exhi.export_params_stringified)) {
            return null;
        }

        // let import_params: ExportSuiviCompetencesRapportHandlerParam = APIControllerWrapper.try_translate_vo_from_api(JSON.parse(exhi.export_params_stringified));
        let import_params: ExportSuiviCompetencesRapportHandlerParam = ObjectHandler.reapply_prototypes(JSON.parse(exhi.export_params_stringified));

        let datas: SuiviCompetencesItemRapportVO[] = await query(SuiviCompetencesItemRapportVO.API_TYPE_ID)
            .filter_by_num_x_ranges(field_names<SuiviCompetencesItemRapportVO>().rapport_id, import_params.rapport_id_ranges)
            .select_vos<SuiviCompetencesItemRapportVO>();

        let item_by_ids: { [id: number]: SuiviCompetencesItemVO } = VOsTypesManager.vosArray_to_vosByIds(
            await query(SuiviCompetencesItemVO.API_TYPE_ID).select_vos<SuiviCompetencesItemVO>()
        );
        let rapport_by_ids: { [id: number]: SuiviCompetencesRapportVO } = VOsTypesManager.vosArray_to_vosByIds(
            await query(SuiviCompetencesRapportVO.API_TYPE_ID).filter_by_ids(import_params.rapport_id_ranges).select_vos<SuiviCompetencesRapportVO>()
        );

        let grille_id_ranges: NumRange[] = RangeHandler.create_multiple_NumRange_from_ids(ObjectHandler.arrayFromMap(rapport_by_ids).map((e) => e.suivi_comp_grille_id), NumSegment.TYPE_INT);

        let grille_by_ids: { [id: number]: SuiviCompetencesGrilleVO } = VOsTypesManager.vosArray_to_vosByIds(
            await query(SuiviCompetencesGrilleVO.API_TYPE_ID).filter_by_ids(grille_id_ranges).select_vos<SuiviCompetencesGrilleVO>()
        );

        let all_groupe: SuiviCompetencesGroupeResult[] = await ModuleSuiviCompetences.getInstance().get_all_suivi_competences_groupe(
            grille_id_ranges
        );

        let item_rapport_by_item_id_rapport_id: { [item_id: number]: { [rapport_id: number]: SuiviCompetencesItemRapportVO } } = {};

        for (let i in datas) {
            let data: SuiviCompetencesItemRapportVO = datas[i];

            let item: SuiviCompetencesItemVO = item_by_ids[data.suivi_comp_item_id];

            if (!item) {
                continue;
            }

            if (!item_rapport_by_item_id_rapport_id[data.suivi_comp_item_id]) {
                item_rapport_by_item_id_rapport_id[data.suivi_comp_item_id] = {};
            }

            item_rapport_by_item_id_rapport_id[data.suivi_comp_item_id][data.rapport_id] = data;
        }

        for (let i in all_groupe) {
            let groupe: SuiviCompetencesGroupeResult = all_groupe[i];

            for (let j in groupe.sous_groupe) {
                let sous_groupe: { id: number, name: string, items: SuiviCompetencesItemVO[] } = groupe.sous_groupe[j];

                for (let k in sous_groupe.items) {
                    let item: SuiviCompetencesItemVO = sous_groupe.items[k];

                    let data: any = {
                        groupe: groupe.name,
                        sous_groupe: sous_groupe.name,
                        item: item.name,
                        kpi: item.kpis,
                    };

                    let indicateurs: SuiviCompetencesIndicateurVO[] = SuiviCompetencesIndicateurTableFieldTypeController.getInstance().get_value(item);

                    RangeHandler.foreach_ranges_sync(import_params.rapport_id_ranges, (rapport_id: number) => {
                        let item_rapport: SuiviCompetencesItemRapportVO = item_rapport_by_item_id_rapport_id[item.id] ?
                            item_rapport_by_item_id_rapport_id[item.id][rapport_id] : null;

                        if (item_rapport) {
                            let item_rapport_indicateur: SuiviCompetencesIndicateurVO = (item_rapport.indicateur > 0) ? indicateurs[(item_rapport.indicateur - 1)] : null;

                            data['commentaires_' + rapport_id] = item_rapport.etat_des_lieux;
                            data['cible_' + rapport_id] = item_rapport.cible;
                            data['delais_' + rapport_id] = item_rapport.delais;
                            data['bilan_precedent_' + rapport_id] = item_rapport.bilan_precedent;
                            data['plan_action_' + rapport_id] = item_rapport.plan_action;

                            if (item_rapport_indicateur) {
                                data['indicateur_' + rapport_id] = item_rapport_indicateur.titre;
                                data['indicateur_detail_' + rapport_id] = item_rapport_indicateur.description;
                            }
                        }
                    });

                    res.push(data);
                }
            }
        }

        this.set_column_labels(import_params.rapport_id_ranges, rapport_by_ids);

        let show_column_rapport_plan_action: boolean = false;
        let show_column_rapport_etat_des_lieux: boolean = false;
        let show_column_rapport_cible: boolean = false;
        let show_column_rapport_delais: boolean = false;
        let show_column_rapport_bilan_precedent: boolean = false;
        let show_column_rapport_indicateur: boolean = false;

        for (let i in rapport_by_ids) {
            let grille: SuiviCompetencesGrilleVO = grille_by_ids[rapport_by_ids[i].suivi_comp_grille_id];

            if (!grille) {
                continue;
            }

            if (grille.show_column_rapport_plan_action) {
                show_column_rapport_plan_action = true;
            }
            if (grille.show_column_rapport_etat_des_lieux) {
                show_column_rapport_etat_des_lieux = true;
            }
            if (grille.show_column_rapport_cible) {
                show_column_rapport_cible = true;
            }
            if (grille.show_column_rapport_delais) {
                show_column_rapport_delais = true;
            }
            if (grille.show_column_bilan_precedent) {
                show_column_rapport_bilan_precedent = true;
            }
            if (grille.show_column_rapport_indicateur) {
                show_column_rapport_indicateur = true;
            }
        }

        this.set_ordered_column_list(
            import_params.rapport_id_ranges,
            show_column_rapport_plan_action,
            show_column_rapport_etat_des_lieux,
            show_column_rapport_cible,
            show_column_rapport_delais,
            show_column_rapport_bilan_precedent,
            show_column_rapport_indicateur,
        );

        return res;
    }

    private set_column_labels(
        rapport_id_ranges: NumRange[],
        rapport_by_ids: { [id: number]: SuiviCompetencesRapportVO },
    ) {
        let res: { [field_name: string]: string } = {
            groupe: 'Groupe',
            sous_groupe: 'Sous-groupe',
            item: 'Element',
            kpi: 'KPI',
        };

        RangeHandler.foreach_ranges_sync(rapport_id_ranges, (rapport_id: number) => {
            let rapport: SuiviCompetencesRapportVO = rapport_by_ids[rapport_id];

            res['indicateur_' + rapport_id] = rapport.name;
            res['indicateur_detail_' + rapport_id] = "Détail de l'indicateur";
            res['commentaires_' + rapport_id] = "Commentaires";
            res['cible_' + rapport_id] = "Cible";
            res['delais_' + rapport_id] = "Delais";
            res['bilan_precedent_' + rapport_id] = "Bilan précédent";
            res['plan_action_' + rapport_id] = "Plan d'action";
        });

        this.column_labels = res;
    }

    private set_ordered_column_list(
        rapport_id_ranges: NumRange[],
        show_column_rapport_plan_action: boolean,
        show_column_rapport_etat_des_lieux: boolean,
        show_column_rapport_cible: boolean,
        show_column_rapport_delais: boolean,
        show_column_rapport_bilan_precedent: boolean,
        show_column_rapport_indicateur: boolean,
    ) {
        let res: string[] = [
            'groupe',
            'sous_groupe',
            'item',
            'kpi',
        ];

        RangeHandler.foreach_ranges_sync(rapport_id_ranges, (rapport_id: number) => {
            if (show_column_rapport_indicateur) {
                res.push(
                    'indicateur_' + rapport_id,
                    'indicateur_detail_' + rapport_id,
                );
            }
            if (show_column_rapport_cible) {
                res.push('cible_' + rapport_id);
            }
            if (show_column_rapport_etat_des_lieux) {
                res.push('commentaires_' + rapport_id);
            }
            if (show_column_rapport_plan_action) {
                res.push('plan_action_' + rapport_id);
            }
            if (show_column_rapport_delais) {
                res.push('delais_' + rapport_id);
            }
            if (show_column_rapport_bilan_precedent) {
                res.push('bilan_precedent_' + rapport_id);
            }
        });

        this.ordered_column_list = res;
    }
}