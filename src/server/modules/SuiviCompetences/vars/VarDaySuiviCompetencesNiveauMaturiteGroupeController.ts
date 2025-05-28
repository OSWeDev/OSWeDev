import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumRange from "../../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import SuiviCompetencesVarsNamesHolder from "../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder";
import SuiviCompetencesRapportGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO";
import SuiviCompetencesGrilleVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGrilleVO";
import SuiviCompetencesGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO";
import SuiviCompetencesItemRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO";
import SuiviCompetencesItemVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import SuiviCompetencesSousGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesSousGroupeVO";
import VarsController from "../../../../shared/modules/Var/VarsController";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import DataSourceControllerBase from "../../Var/datasource/DataSourceControllerBase";
import VarDAGNode from "../../Var/vos/VarDAGNode";
import SuiviCompetencesItemRangesDatasourceController from "../datasources/SuiviCompetencesItemRangesDatasourceController";
import SuiviCompetencesItemRapportRangesDatasourceController from "../datasources/SuiviCompetencesItemRapportRangesDatasourceController";

export default class VarDaySuiviCompetencesNiveauMaturiteGroupeController extends VarServerControllerBase<SuiviCompetencesRapportGroupeDataRangesVO> {
    public static DEP_DaySuiviCompetencesNiveauMaturiteGroupe: string = 'VarDaySuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    protected static instance: VarDaySuiviCompetencesNiveauMaturiteGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
                SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID,
            ).disable_optimization__has_no_imports()
            ,
            { 'fr-fr': 'DaySuiviCompetencesNiveauMaturiteGroupe' },
            { 'fr-fr': 'Niveau de maturité TSP pour Groupe' },
            { 'fr-fr': '% du niveau de maturité TSP sur les groupes et sous groupes TSP' },
            {
                [VarDaySuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe]: { 'fr-fr': 'DaySuiviCompetencesNiveauMaturiteGroupe' },
            }
        );
    }

    public static getInstance(): VarDaySuiviCompetencesNiveauMaturiteGroupeController {
        if (!VarDaySuiviCompetencesNiveauMaturiteGroupeController.instance) {
            VarDaySuiviCompetencesNiveauMaturiteGroupeController.instance = new VarDaySuiviCompetencesNiveauMaturiteGroupeController();
        }
        return VarDaySuiviCompetencesNiveauMaturiteGroupeController.instance;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            SuiviCompetencesItemRangesDatasourceController.getInstance(),
            SuiviCompetencesItemRapportRangesDatasourceController.getInstance(),
        ];
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [VarDaySuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe]: VarDaySuiviCompetencesNiveauMaturiteGroupeController.getInstance(),
        };
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        let param: SuiviCompetencesRapportGroupeDataRangesVO = varDAGNode.var_data as SuiviCompetencesRapportGroupeDataRangesVO;

        // Si on a pas de sous groupe ou qu'un seul, on n'a pas de dépendance
        if (!param.suivi_comp_rapport_id_ranges?.length || RangeHandler.get_all_segmented_elements_from_ranges(param.suivi_comp_rapport_id_ranges).length <= 1) {
            return null;
        }

        let res: { [dep_id: string]: VarDataBaseVO } = {};

        RangeHandler.foreach_ranges_sync(param.suivi_comp_rapport_id_ranges, (rapport_id: number) => {
            res[VarDaySuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe + '_' + rapport_id] = SuiviCompetencesRapportGroupeDataRangesVO.createNew<SuiviCompetencesRapportGroupeDataRangesVO>(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
                true,
                [RangeHandler.create_single_elt_NumRange(rapport_id, NumSegment.TYPE_INT)],
                param.suivi_comp_groupe_id_ranges
            );
        });

        return res;
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<SuiviCompetencesRapportGroupeDataRangesVO[]> {
        let res: SuiviCompetencesRapportGroupeDataRangesVO[] = [];

        for (let i in intersectors) {
            switch (intersectors[i]._type) {
                case SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID:
                    res.push(SuiviCompetencesRapportGroupeDataRangesVO.createNew<SuiviCompetencesRapportGroupeDataRangesVO>(
                        this.varConf.name,
                        false,
                        (intersectors[i] as any as SuiviCompetencesRapportGroupeDataRangesVO).suivi_comp_rapport_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesRapportGroupeDataRangesVO).suivi_comp_groupe_id_ranges,
                    ));
                    break;
            }
        }

        return res;
    }

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<SuiviCompetencesRapportGroupeDataRangesVO[]> {
        return [
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, c_or_d_vo)
        ];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<SuiviCompetencesRapportGroupeDataRangesVO[]> {

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
            case SuiviCompetencesRapportVO.API_TYPE_ID:
                return true;
            case SuiviCompetencesGrilleVO.API_TYPE_ID:
                if (
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesGrilleVO).calcul_niveau_maturite != (u_vo_holder.post_update_vo as any as SuiviCompetencesGrilleVO).calcul_niveau_maturite) ||
                    (!RangeHandler.are_same((u_vo_holder.pre_update_vo as any as SuiviCompetencesGrilleVO).suivi_comp_item_id_ranges, (u_vo_holder.post_update_vo as any as SuiviCompetencesGrilleVO).suivi_comp_item_id_ranges))
                ) {
                    return true;
                }
                break;
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

    public async get_invalid_params_intersectors_from_vo<T extends IDistantVOBase>(var_name: string, vo: T): Promise<SuiviCompetencesRapportGroupeDataRangesVO> {
        let tsp_groupe_id_ranges: NumRange[] = null;
        let rapport_id_ranges: NumRange[] = null;

        switch (vo._type) {
            case SuiviCompetencesRapportVO.API_TYPE_ID:
                rapport_id_ranges = [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesRapportVO).id, NumSegment.TYPE_INT)];
                break;
            case SuiviCompetencesGrilleVO.API_TYPE_ID:
                break;
            case SuiviCompetencesItemRapportVO.API_TYPE_ID:
                const tsp_item: SuiviCompetencesItemVO = await query(SuiviCompetencesItemVO.API_TYPE_ID).filter_by_id((vo as any as SuiviCompetencesItemRapportVO).suivi_comp_item_id).select_one();
                tsp_groupe_id_ranges = tsp_item ? [RangeHandler.create_single_elt_NumRange(tsp_item.groupe_id, NumSegment.TYPE_INT)] : null;
                rapport_id_ranges = [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesItemRapportVO).rapport_id, NumSegment.TYPE_INT)];
                break;
            case SuiviCompetencesItemVO.API_TYPE_ID:
                tsp_groupe_id_ranges = [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesItemVO).groupe_id, NumSegment.TYPE_INT)];
                break;
            case SuiviCompetencesGroupeVO.API_TYPE_ID:
                tsp_groupe_id_ranges = [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesGroupeVO).id, NumSegment.TYPE_INT)];
                break;
            case SuiviCompetencesSousGroupeVO.API_TYPE_ID:
                tsp_groupe_id_ranges = [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesSousGroupeVO).groupe_id, NumSegment.TYPE_INT)];
                break;
        }

        if (!rapport_id_ranges?.length) {
            rapport_id_ranges = [RangeHandler.getMaxNumRange()];
        }

        if (!tsp_groupe_id_ranges?.length) {
            tsp_groupe_id_ranges = [RangeHandler.getMaxNumRange()];
        }

        return SuiviCompetencesRapportGroupeDataRangesVO.createNew<SuiviCompetencesRapportGroupeDataRangesVO>(
            var_name,
            false,
            rapport_id_ranges,
            tsp_groupe_id_ranges,
        );
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        let param: SuiviCompetencesRapportGroupeDataRangesVO = varDAGNode.var_data as SuiviCompetencesRapportGroupeDataRangesVO;

        // Si on a pas de sous groupe ou qu'un seul, on n'a pas de dépendance donc on calcul
        if (!param.suivi_comp_rapport_id_ranges?.length || RangeHandler.get_all_segmented_elements_from_ranges(param.suivi_comp_rapport_id_ranges).length <= 1) {
            let item_value: number = varDAGNode.datasources[SuiviCompetencesItemRangesDatasourceController.getInstance().name];
            let item_rapport_value: number = varDAGNode.datasources[SuiviCompetencesItemRapportRangesDatasourceController.getInstance().name];

            if ((item_value == null) || (item_rapport_value == null)) {
                return null;
            }

            return item_rapport_value / item_value;
        }

        let res: number = 0;
        let cpt: number = 0;

        for (let i in varDAGNode.outgoing_deps) {
            let outgoing = varDAGNode.outgoing_deps[i];

            let var_data = (outgoing.outgoing_node as VarDAGNode).var_data as SuiviCompetencesRapportGroupeDataRangesVO;
            let value = var_data ? var_data.value : null;
            if ((!var_data) || (isNaN(value))) {
                continue;
            }

            if ((value == null) || (typeof value == 'undefined')) {
                continue;
            }

            cpt++;
            res += value;
        }

        return cpt ? (res / cpt) : null;
    }
}