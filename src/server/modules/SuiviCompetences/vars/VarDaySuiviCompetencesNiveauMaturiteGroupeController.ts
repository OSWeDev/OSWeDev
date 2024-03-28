import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumSegment from "../../../../shared/modules/DataRender/vos/NumSegment";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import SuiviCompetencesVarsNamesHolder from "../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder";
import SuiviCompetencesRapportGroupeDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesRapportGroupeDataRangesVO";
import SuiviCompetencesGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesGroupeVO";
import SuiviCompetencesItemRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemRapportVO";
import SuiviCompetencesItemVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesItemVO";
import SuiviCompetencesRapportVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesRapportVO";
import SuiviCompetencesSousGroupeVO from "../../../../shared/modules/SuiviCompetences/vos/SuiviCompetencesSousGroupeVO";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import DataSourceControllerBase from "../../Var/datasource/DataSourceControllerBase";
import VarDAGNode from "../../Var/vos/VarDAGNode";
import SuiviCompetencesItemRangesDatasourceController from "../datasources/SuiviCompetencesItemRangesDatasourceController";
import SuiviCompetencesItemRapportRangesDatasourceController from "../datasources/SuiviCompetencesItemRapportRangesDatasourceController";

export default class VarDaySuiviCompetencesNiveauMaturiteGroupeController extends VarServerControllerBase<SuiviCompetencesRapportGroupeDataRangesVO> {

    public static getInstance(): VarDaySuiviCompetencesNiveauMaturiteGroupeController {
        if (!VarDaySuiviCompetencesNiveauMaturiteGroupeController.instance) {
            VarDaySuiviCompetencesNiveauMaturiteGroupeController.instance = new VarDaySuiviCompetencesNiveauMaturiteGroupeController();
        }
        return VarDaySuiviCompetencesNiveauMaturiteGroupeController.instance;
    }

    protected static instance: VarDaySuiviCompetencesNiveauMaturiteGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SuiviCompetencesVarsNamesHolder.VarDaySuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
                SuiviCompetencesRapportGroupeDataRangesVO.API_TYPE_ID,
            ),
            { 'fr-fr': 'DaySuiviCompetencesNiveauMaturiteGroupe' },
            { 'fr-fr': 'Niveau de maturité TSP pour Groupe' },
            { 'fr-fr': '% du niveau de maturité TSP sur les groupes et sous groupes TSP' },
            {}
        );

        this.optimization__has_no_imports = true;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            SuiviCompetencesItemRangesDatasourceController.getInstance(),
            SuiviCompetencesItemRapportRangesDatasourceController.getInstance(),
        ];
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
        let tsp_groupe_id: number = null;
        let rapport_ids: number[] = null;

        switch (vo._type) {
            case SuiviCompetencesItemRapportVO.API_TYPE_ID:
                let tsp_item: SuiviCompetencesItemVO = await query(SuiviCompetencesItemVO.API_TYPE_ID).filter_by_id((vo as any as SuiviCompetencesItemRapportVO).suivi_comp_item_id).select_one();
                tsp_groupe_id = tsp_item ? tsp_item.groupe_id : null;
                rapport_ids = [(vo as any as SuiviCompetencesItemRapportVO).rapport_id];
                break;
            case SuiviCompetencesItemVO.API_TYPE_ID:
                tsp_groupe_id = (vo as any as SuiviCompetencesItemVO).groupe_id;
                break;
            case SuiviCompetencesGroupeVO.API_TYPE_ID:
                tsp_groupe_id = (vo as any as SuiviCompetencesGroupeVO).id;
                break;
            case SuiviCompetencesSousGroupeVO.API_TYPE_ID:
                tsp_groupe_id = (vo as any as SuiviCompetencesSousGroupeVO).groupe_id;
                break;
        }

        if (!rapport_ids || !rapport_ids.length) {
            let rapports: any[] = await query(SuiviCompetencesRapportVO.API_TYPE_ID).select_vos<SuiviCompetencesRapportVO>();
            rapport_ids = rapports ? rapports.map((e) => e.id) : null;
        }

        if (!tsp_groupe_id || !rapport_ids || !rapport_ids.length) {
            return null;
        }

        return SuiviCompetencesRapportGroupeDataRangesVO.createNew<SuiviCompetencesRapportGroupeDataRangesVO>(
            var_name,
            false,
            RangeHandler.create_multiple_NumRange_from_ids(rapport_ids, NumSegment.TYPE_INT),
            [RangeHandler.create_single_elt_NumRange(tsp_groupe_id, NumSegment.TYPE_INT)],
        );
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let item_value: number = varDAGNode.datasources[SuiviCompetencesItemRangesDatasourceController.getInstance().name];
        let item_rapport_value: number = varDAGNode.datasources[SuiviCompetencesItemRapportRangesDatasourceController.getInstance().name];

        if (!item_value) {
            return null;
        }

        return item_rapport_value / item_value;
    }
}