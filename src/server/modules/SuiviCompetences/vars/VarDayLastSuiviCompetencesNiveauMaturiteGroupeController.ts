import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import SuiviCompetencesVarsNamesHolder from "../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder";
import SuiviCompetencesGroupeUserTsRangesDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesGroupeUserTsRangesDataRangesVO";
import SuiviCompetencesRapportGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO";
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
import VarDaySuiviCompetencesNiveauMaturiteGroupeController from "./VarDaySuiviCompetencesNiveauMaturiteGroupeController";

export default class VarDayLastSuiviCompetencesNiveauMaturiteGroupeController extends VarServerControllerBase<SuiviCompetencesGroupeUserTsRangesDataRangesVO> {
    public static DEP_DaySuiviCompetencesNiveauMaturiteGroupe: string = 'VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    protected static instance: VarDayLastSuiviCompetencesNiveauMaturiteGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SuiviCompetencesVarsNamesHolder.VarDayLastSuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
                SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID,
                { ts_ranges: TimeSegment.TYPE_DAY }
            ),
            { 'fr-fr': 'DayLastSuiviCompetencesNiveauMaturiteGroupe' },
            { 'fr-fr': 'Niveau de maturité TSP pour Groupe (denrier rapport)' },
            { 'fr-fr': '% du niveau de maturité TSP sur les groupes et sous groupes TSP (dernier rapport)' },
            {
                [VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe]: { 'fr-fr': 'DaySuiviCompetencesNiveauMaturiteGroupe' },
            }
        );
    }

    public static getInstance(): VarDayLastSuiviCompetencesNiveauMaturiteGroupeController {
        if (!VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.instance) {
            VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.instance = new VarDayLastSuiviCompetencesNiveauMaturiteGroupeController();
        }
        return VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.instance;
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

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<SuiviCompetencesGroupeUserTsRangesDataRangesVO[]> {
        return [
            await this.get_invalid_params_intersectors_from_vo(this.varConf.name, c_or_d_vo)
        ];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<SuiviCompetencesGroupeUserTsRangesDataRangesVO[]> {

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

    public async get_invalid_params_intersectors_from_vo<T extends IDistantVOBase>(var_name: string, vo: T): Promise<SuiviCompetencesGroupeUserTsRangesDataRangesVO> {
        switch (vo._type) {
            case SuiviCompetencesRapportVO.API_TYPE_ID:
                return SuiviCompetencesGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesGroupeUserTsRangesDataRangesVO>(
                    var_name,
                    false,
                    [RangeHandler.getMaxNumRange()],
                    [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesRapportVO).suivi_comp_grille_id, NumSegment.TYPE_INT)],
                    [RangeHandler.create_single_elt_NumRange((vo as any as SuiviCompetencesRapportVO).user_id, NumSegment.TYPE_INT)],
                    [RangeHandler.create_single_elt_TSRange((vo as any as SuiviCompetencesRapportVO).date, TimeSegment.TYPE_DAY)],
                );
        }

        return null;
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<SuiviCompetencesGroupeUserTsRangesDataRangesVO[]> {
        let res: SuiviCompetencesGroupeUserTsRangesDataRangesVO[] = [];

        for (let i in intersectors) {
            switch (intersectors[i]._type) {
                case SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID:
                    res.push(SuiviCompetencesGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesGroupeUserTsRangesDataRangesVO>(
                        this.varConf.name,
                        false,
                        (intersectors[i] as any as SuiviCompetencesRapportGroupeDataRangesVO).suivi_comp_groupe_id_ranges,
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
            [VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe]: VarDaySuiviCompetencesNiveauMaturiteGroupeController.getInstance(),
        };
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        let param: SuiviCompetencesGroupeUserTsRangesDataRangesVO = varDAGNode.var_data as SuiviCompetencesGroupeUserTsRangesDataRangesVO;
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
            [VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe]: SuiviCompetencesRapportGroupeDataRangesVO.createNew<SuiviCompetencesRapportGroupeDataRangesVO>(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
                true,
                RangeHandler.create_multiple_NumRange_from_ids(rapport_ids, NumSegment.TYPE_INT),
                param.suivi_comp_groupe_id_ranges
            )
        };
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        return VarsServerController.get_outgoing_deps_sum(varDAGNode, VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DaySuiviCompetencesNiveauMaturiteGroupe, null);
    }
}