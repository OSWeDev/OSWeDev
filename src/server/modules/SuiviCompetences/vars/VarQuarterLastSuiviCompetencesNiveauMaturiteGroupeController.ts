import TSRange from "../../../../shared/modules/DataRender/vos/TSRange";
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import SuiviCompetencesVarsNamesHolder from "../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder";
import SuiviCompetencesGroupeUserTsRangesDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesGroupeUserTsRangesDataRangesVO";
import VarsController from "../../../../shared/modules/Var/VarsController";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import VarDAGNode from "../../Var/vos/VarDAGNode";
import VarDayLastSuiviCompetencesNiveauMaturiteGroupeController from "./VarDayLastSuiviCompetencesNiveauMaturiteGroupeController";

export default class VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController extends VarServerControllerBase<SuiviCompetencesGroupeUserTsRangesDataRangesVO> {
    public static DEP_DayLastSuiviCompetencesNiveauMaturiteGroupe: string = 'VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteGroupe' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    protected static instance: VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SuiviCompetencesVarsNamesHolder.VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
                SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID,
                { ts_ranges: TimeSegment.TYPE_QUARTER }
            ),
            { 'fr-fr': 'QuarterLastSuiviCompetencesNiveauMaturiteGroupe' },
            { 'fr-fr': 'Niveau de maturité TSP pour Groupe par trimestre (denrier rapport)' },
            { 'fr-fr': '% du niveau de maturité TSP sur les groupes et sous groupes TSP par trimestre (dernier rapport)' },
            {
                [VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteGroupe]: { 'fr-fr': 'DayLastSuiviCompetencesNiveauMaturiteGroupe' },
            }
        );
    }

    public static getInstance(): VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController {
        if (!VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.instance) {
            VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.instance = new VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController();
        }
        return VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.instance;
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<SuiviCompetencesGroupeUserTsRangesDataRangesVO[]> {
        let res: SuiviCompetencesGroupeUserTsRangesDataRangesVO[] = [];

        for (let i in intersectors) {
            switch (intersectors[i]._type) {
                case SuiviCompetencesGroupeUserTsRangesDataRangesVO.API_TYPE_ID:
                    res.push(SuiviCompetencesGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesGroupeUserTsRangesDataRangesVO>(
                        this.varConf.name,
                        false,
                        (intersectors[i] as any as SuiviCompetencesGroupeUserTsRangesDataRangesVO).suivi_comp_groupe_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesGroupeUserTsRangesDataRangesVO).suivi_comp_grille_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesGroupeUserTsRangesDataRangesVO).user_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesGroupeUserTsRangesDataRangesVO).ts_ranges,
                    ));
                    break;
            }
        }

        return res;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteGroupe]: VarDayLastSuiviCompetencesNiveauMaturiteGroupeController.getInstance(),
        };
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        let param: SuiviCompetencesGroupeUserTsRangesDataRangesVO = varDAGNode.var_data as SuiviCompetencesGroupeUserTsRangesDataRangesVO;

        let res: { [dep_id: string]: SuiviCompetencesGroupeUserTsRangesDataRangesVO } = {};

        RangeHandler.foreach_ranges_sync(param.ts_ranges, (date: number) => {
            res[VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteGroupe + '_' + date] = SuiviCompetencesGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesGroupeUserTsRangesDataRangesVO>(
                SuiviCompetencesVarsNamesHolder.VarDayLastSuiviCompetencesNiveauMaturiteGroupeController_VAR_NAME,
                true,
                param.suivi_comp_groupe_id_ranges,
                param.suivi_comp_grille_id_ranges,
                param.user_id_ranges,
                [RangeHandler.createNew(
                    TSRange.RANGE_TYPE,
                    date,
                    Dates.endOf(date, TimeSegment.TYPE_QUARTER),
                    true,
                    true,
                    TimeSegment.TYPE_DAY
                )]
            );
        }, TimeSegment.TYPE_QUARTER);

        return res;
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        let res: number = 0;
        let cpt: number = 0;

        for (let i in varDAGNode.outgoing_deps) {
            let outgoing = varDAGNode.outgoing_deps[i];

            let var_data = (outgoing.outgoing_node as VarDAGNode).var_data as SuiviCompetencesGroupeUserTsRangesDataRangesVO;
            let value = var_data ? var_data.value : null;
            if ((value == null) || (isNaN(value))) {
                continue;
            }

            if (outgoing.dep_name.startsWith(VarQuarterLastSuiviCompetencesNiveauMaturiteGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteGroupe)) {
                res += value;
                cpt++;
            }
        }

        return cpt ? (res / cpt) : null;
    }
}