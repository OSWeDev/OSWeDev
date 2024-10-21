import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import SuiviCompetencesVarsNamesHolder from "../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder";
import SuiviCompetencesRapportSousGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportSousGroupeDataRangesVO";
import SuiviCompetencesSousGroupeUserTsRangesDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesSousGroupeUserTsRangesDataRangesVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import VarsController from "../../../../shared/modules/Var/VarsController";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import VarsServerController from "../../Var/VarsServerController";
import DataSourceControllerBase from "../../Var/datasource/DataSourceControllerBase";
import VarDAGNode from "../../Var/vos/VarDAGNode";
import SuiviCompetencesRapportByUserRangesDatasourceController from "../datasources/SuiviCompetencesRapportByUserRangesDatasourceController";
import VarDaySuiviCompetencesNiveauMaturiteSousGroupeController from "./VarDaySuiviCompetencesNiveauMaturiteSousGroupeController";

export default class VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController extends VarServerControllerBase<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO> {
    public static DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe: string = 'VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    protected static instance: VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SuiviCompetencesVarsNamesHolder.VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID,
                { ts_ranges: TimeSegment.TYPE_DAY }
            ),
            { 'fr-fr': 'DayLastSuiviCompetencesNiveauMaturiteSousGroupe' },
            { 'fr-fr': 'Niveau de maturité TSP pour les sous Groupe (denrier rapport)' },
            { 'fr-fr': '% du niveau de maturité TSP sur les sous groupes TSP (dernier rapport)' },
            {
                [VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe]: { 'fr-fr': 'DaySuiviCompetencesNiveauMaturiteSousGroupe' },
            }
        );
    }

    public static getInstance(): VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController {
        if (!VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.instance) {
            VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.instance = new VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController();
        }
        return VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.instance;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            SuiviCompetencesRapportByUserRangesDatasourceController.getInstance(),
        ];
    }

    public getDataSourcesPredepsDependencies(): DataSourceControllerBase[] {
        return [
            SuiviCompetencesRapportByUserRangesDatasourceController.getInstance(),
        ];
    }

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO[]> {
        return [
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, c_or_d_vo)
        ];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO[]> {

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
                if (
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesRapportVO).date != (u_vo_holder.post_update_vo as any as SuiviCompetencesRapportVO).date) ||
                    ((u_vo_holder.pre_update_vo as any as SuiviCompetencesRapportVO).user_id != (u_vo_holder.post_update_vo as any as SuiviCompetencesRapportVO).user_id)
                ) {
                    return true;
                }
                break;
        }

        return false;
    }

    public async get_invalid_params_intersectors_from_vo<T extends IDistantVOBase>(var_name: string, vo: T): Promise<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO> {
        switch (vo._type) {
            case SuiviCompetencesRapportVO.API_TYPE_ID:
                return SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>(
                    var_name,
                    false,
                    [RangeHandler.getMaxNumRange()],
                    [RangeHandler.getMaxNumRange()],
                    [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesRapportVO).suivi_comp_grille_id, NumSegment.TYPE_INT)],
                    [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesRapportVO).user_id, NumSegment.TYPE_INT)],
                    [RangeHandler.create_single_elt_TSRange((vo as any as SuiviCompetencesRapportVO).date, TimeSegment.TYPE_DAY)],
                );
        }

        return null;
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO[]> {
        let res: SuiviCompetencesSousGroupeUserTsRangesDataRangesVO[] = [];

        for (let i in intersectors) {
            switch (intersectors[i]._type) {
                case SuiviCompetencesRapportSousGroupeDataRangesVO.API_TYPE_ID:
                    res.push(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>(
                        this.varConf.name,
                        false,
                        (intersectors[i] as any as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_groupe_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesRapportSousGroupeDataRangesVO).suivi_comp_sous_groupe_id_ranges,
                        [RangeHandler.getMaxNumRange()],
                        [RangeHandler.getMaxNumRange()],
                        [RangeHandler.getMaxTSRange()],
                    ));
                    break;
            }
        }

        return res;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe]: VarDaySuiviCompetencesNiveauMaturiteSousGroupeController.getInstance(),
        };
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        let param: SuiviCompetencesSousGroupeUserTsRangesDataRangesVO = varDAGNode.var_data as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO;
        let rapports_by_users: { [user_id: number]: SuiviCompetencesRapportVO[] } = varDAGNode.datasources[SuiviCompetencesRapportByUserRangesDatasourceController.getInstance().name];

        let rapport_ids: number[] = [];

        for (let user_id in rapports_by_users) {
            let last_rapport: SuiviCompetencesRapportVO = rapports_by_users[user_id][0];

            if (!last_rapport) {
                continue;
            }

            rapport_ids.push(last_rapport.id);
        }

        if (!rapport_ids?.length) {
            return {};
        }

        return {
            [VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe]: SuiviCompetencesRapportSousGroupeDataRangesVO.createNew<SuiviCompetencesRapportSousGroupeDataRangesVO>(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                true,
                RangeHandler.create_multiple_NumRange_from_ids(rapport_ids, NumSegment.TYPE_INT),
                param.suivi_comp_groupe_id_ranges,
                param.suivi_comp_sous_groupe_id_ranges,
            )
        };
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        return VarsServerController.get_outgoing_deps_sum(varDAGNode, VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteSousGroupe, null);
    }
}