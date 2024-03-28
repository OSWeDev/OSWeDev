import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import SuiviCompetencesVarsNamesHolder from "../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder";
import SuiviCompetencesRapportSousGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO";
import SuiviCompetencesGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO";
import SuiviCompetencesItemRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO";
import SuiviCompetencesItemVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import SuiviCompetencesSousGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesSousGroupeVO";
import VarsController from "../../../../shared/modules/Var/VarsController";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import DataSourceControllerBase from "../../Var/datasource/DataSourceControllerBase";
import VarDAGNode from "../../Var/vos/VarDAGNode";
import SuiviCompetencesItemRangesDatasourceController from "../datasources/SuiviCompetencesItemRangesDatasourceController";
import SuiviCompetencesItemRapportRangesDatasourceController from "../datasources/SuiviCompetencesItemRapportRangesDatasourceController";

export default class VarDaySuiviCompetencesNiveauMaturiteSousGroupeController extends VarServerControllerBase<SuiviCompetencesRapportSousGroupeDataRangesVO> {

    public static DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe: string = 'VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.DaySuiviCompetencesNiveauMaturiteSousGroupe' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    public static getInstance(): VarDaySuiviCompetencesNiveauMaturiteSousGroupeController {
        if (!VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.instance) {
            VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.instance = new VarDaySuiviCompetencesNiveauMaturiteSousGroupeController();
        }
        return VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.instance;
    }

    protected static instance: VarDaySuiviCompetencesNiveauMaturiteSousGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                SuiviCompetencesRapportSousGroupeDataRangesVO.API_TYPE_ID
            ),
            { 'fr-fr': 'DaySuiviCompetencesNiveauMaturiteSousGroupe' },
            { 'fr-fr': 'Niveau de maturité TSP Sous Groupe' },
            { 'fr-fr': '% du niveau de maturité TSP sur les groupes et sous groupes TSP' },
            {
                [VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe]: { 'fr-fr': 'Niveau maturité TSP Sous Groupe' },
            }
        );

        this.optimization__has_no_imports = true;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            SuiviCompetencesItemRangesDatasourceController.getInstance(),
            SuiviCompetencesItemRapportRangesDatasourceController.getInstance(),
        ];
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe]: VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.getInstance(),
        };
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        let res: { [dep_id: string]: VarDataBaseVO } = {};

        let param: SuiviCompetencesRapportSousGroupeDataRangesVO = (varDAGNode.var_data as SuiviCompetencesRapportSousGroupeDataRangesVO);

        // Si on a pas de sous groupe ou qu'un seul, on n'a pas de dépendance
        if (!param.suivi_comp_sous_groupe_id_ranges?.length || RangeHandler.get_all_segmented_elements_from_ranges(param.suivi_comp_sous_groupe_id_ranges).length <= 1) {
            return null;
        }

        RangeHandler.foreach_ranges_sync(param.suivi_comp_sous_groupe_id_ranges, (sous_groupe_id: number) => {
            res[VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe + '_' + sous_groupe_id] = SuiviCompetencesRapportSousGroupeDataRangesVO.createNew(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                false,
                param.suivi_comp_rapport_id_ranges,
                param.suivi_comp_groupe_id_ranges,
                [RangeHandler.create_single_elt_NumRange(sous_groupe_id, NumSegment.TYPE_INT)],
            );
        });

        return res;
    }

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<SuiviCompetencesRapportSousGroupeDataRangesVO[]> {
        return [
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, c_or_d_vo)
        ];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<SuiviCompetencesRapportSousGroupeDataRangesVO[]> {

        /**
         * Si on a pas touché aux champs utiles, on esquive la mise à jour
         */
        if (!this.has_changed_important_field(u_vo_holder as any)) {
            return null;
        }

        return [
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, u_vo_holder.pre_update_vo as any),
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, u_vo_holder.post_update_vo as any)
        ];
    }

    public has_changed_important_field<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): boolean {

        switch (u_vo_holder.pre_update_vo._type) {
            case SuiviCompetencesItemRapportVO.API_TYPE_ID:
                if (
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesItemRapportVO).indicateur != (u_vo_holder.post_update_vo as any as SuiviCompetencesItemRapportVO).indicateur)
                ) {
                    return true;
                }
                break;
            case SuiviCompetencesItemVO.API_TYPE_ID:
                if (
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesItemVO).groupe_id != (u_vo_holder.post_update_vo as any as SuiviCompetencesItemVO).groupe_id) ||
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesItemVO).sous_groupe_id != (u_vo_holder.post_update_vo as any as SuiviCompetencesItemVO).sous_groupe_id) ||
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesItemVO).active != (u_vo_holder.post_update_vo as any as SuiviCompetencesItemVO).active)
                ) {
                    return true;
                }
                break;
            case SuiviCompetencesGroupeVO.API_TYPE_ID:
                if (
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesGroupeVO).ponderation != (u_vo_holder.post_update_vo as any as SuiviCompetencesGroupeVO).ponderation)
                ) {
                    return true;
                }
                break;
            case SuiviCompetencesSousGroupeVO.API_TYPE_ID:
                if (
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesSousGroupeVO).groupe_id != (u_vo_holder.post_update_vo as any as SuiviCompetencesSousGroupeVO).groupe_id) ||
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesSousGroupeVO).ponderation != (u_vo_holder.post_update_vo as any as SuiviCompetencesSousGroupeVO).ponderation)
                ) {
                    return true;
                }
                break;
        }

        return false;
    }

    public async get_invalid_params_intersectors_from_vo<T extends IDistantVOBase>(var_name: string, vo: T): Promise<SuiviCompetencesRapportSousGroupeDataRangesVO> {
        let tsp_groupe_id: number = null;
        let tsp_sous_groupe_ids: number[] = null;
        let rapport_ids: number[] = null;

        switch (vo._type) {
            case SuiviCompetencesItemRapportVO.API_TYPE_ID:
                let tsp_item: SuiviCompetencesItemVO = await query(SuiviCompetencesItemVO.API_TYPE_ID).filter_by_id((vo as any as SuiviCompetencesItemRapportVO).suivi_comp_item_id).select_vo();
                tsp_groupe_id = tsp_item ? tsp_item.groupe_id : null;

                if (tsp_item.sous_groupe_id) {
                    tsp_sous_groupe_ids = [tsp_item.sous_groupe_id];
                }

                rapport_ids = [(vo as any as SuiviCompetencesItemRapportVO).rapport_id];
                break;
            case SuiviCompetencesItemVO.API_TYPE_ID:
                tsp_groupe_id = (vo as any as SuiviCompetencesItemVO).groupe_id;

                if ((vo as any as SuiviCompetencesItemVO).sous_groupe_id) {
                    tsp_sous_groupe_ids = [(vo as any as SuiviCompetencesItemVO).sous_groupe_id];
                }
                break;
            case SuiviCompetencesGroupeVO.API_TYPE_ID:
                tsp_groupe_id = (vo as any as SuiviCompetencesGroupeVO).id;
                let tsp_sous_groupes: any[] = await query(SuiviCompetencesSousGroupeVO.API_TYPE_ID)
                    .field(field_names<SuiviCompetencesSousGroupeVO>().id)
                    .filter_by_num_eq(field_names<SuiviCompetencesSousGroupeVO>().groupe_id, (vo as any as SuiviCompetencesGroupeVO).id)
                    .select_vos();
                tsp_sous_groupe_ids = tsp_sous_groupes ? tsp_sous_groupes.map((e) => e.id) : null;
                break;
            case SuiviCompetencesSousGroupeVO.API_TYPE_ID:
                tsp_groupe_id = (vo as any as SuiviCompetencesSousGroupeVO).groupe_id;
                tsp_sous_groupe_ids = [(vo as any as SuiviCompetencesSousGroupeVO).id];
                break;
        }

        if (!rapport_ids || !rapport_ids.length) {
            let rapports: any[] = await query(SuiviCompetencesRapportVO.API_TYPE_ID).select_vos<SuiviCompetencesRapportVO>();
            rapport_ids = rapports ? rapports.map((e) => e.id) : null;
        }

        if (!tsp_groupe_id || !tsp_sous_groupe_ids || !tsp_sous_groupe_ids.length || !rapport_ids || !rapport_ids.length) {
            return null;
        }

        return SuiviCompetencesRapportSousGroupeDataRangesVO.createNew<SuiviCompetencesRapportSousGroupeDataRangesVO>(
            var_name,
            false,
            RangeHandler.create_multiple_NumRange_from_ids(rapport_ids, NumSegment.TYPE_INT),
            [RangeHandler.create_single_elt_NumRange(tsp_groupe_id, NumSegment.TYPE_INT)],
            RangeHandler.create_multiple_NumRange_from_ids(tsp_sous_groupe_ids, NumSegment.TYPE_INT),
        );
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let param: SuiviCompetencesRapportSousGroupeDataRangesVO = (varDAGNode.var_data as SuiviCompetencesRapportSousGroupeDataRangesVO);

        // Si on a pas de sous groupe ou qu'un seul, on n'a pas de dépendance donc on calcul
        if (!param.suivi_comp_sous_groupe_id_ranges?.length || RangeHandler.get_all_segmented_elements_from_ranges(param.suivi_comp_sous_groupe_id_ranges).length <= 1) {
            let item_value: number = varDAGNode.datasources[SuiviCompetencesItemRangesDatasourceController.getInstance().name];
            let item_rapport_value: number = varDAGNode.datasources[SuiviCompetencesItemRapportRangesDatasourceController.getInstance().name];

            if (!item_value) {
                return null;
            }

            return item_rapport_value / item_value;
        }

        let res: number = 0;
        let cpt: number = 0;

        for (let i in varDAGNode.outgoing_deps) {
            let outgoing = varDAGNode.outgoing_deps[i];

            let var_data = (outgoing.outgoing_node as VarDAGNode).var_data as SuiviCompetencesRapportSousGroupeDataRangesVO;
            let value = var_data ? var_data.value : null;
            if ((!var_data) || (isNaN(value))) {
                continue;
            }

            cpt++;

            if ((value == null) || (typeof value == 'undefined')) {
                continue;
            }

            res += value;
        }

        return cpt ? res / cpt : null;
    }
}