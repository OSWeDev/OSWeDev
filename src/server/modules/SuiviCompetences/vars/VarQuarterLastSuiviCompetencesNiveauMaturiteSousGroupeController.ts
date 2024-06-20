import TSRange from "../../../../shared/modules/DataRender/vos/TSRange";
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import SuiviCompetencesVarsNamesHolder from "../../../../shared/modules/SuiviCompetences/vars/SuiviCompetencesVarsNamesHolder";
import SuiviCompetencesSousGroupeUserTsRangesDataRangesVO from "../../../../shared/modules/SuiviCompetences/vars/vos/SuiviCompetencesSousGroupeUserTsRangesDataRangesVO";
import VarsController from "../../../../shared/modules/Var/VarsController";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import VarDAGNode from "../../Var/vos/VarDAGNode";
import VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController from "./VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController";

export default class VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController extends VarServerControllerBase<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO> {
    public static DEP_DayLastSuiviCompetencesNiveauMaturiteSousGroupe: string = 'VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteSousGroupe' + VarsController.MANDATORY_DEP_ID_SUFFIX;

    public static getInstance(): VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController {
        if (!VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.instance) {
            VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.instance = new VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController();
        }
        return VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.instance;
    }

    protected static instance: VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController = null;

    protected constructor() {
        super(
            new VarConfVO(
                SuiviCompetencesVarsNamesHolder.VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID,
                { ts_ranges: TimeSegment.TYPE_QUARTER }
            ),
            { 'fr-fr': 'QuarterLastSuiviCompetencesNiveauMaturiteSousGroupe' },
            { 'fr-fr': 'Niveau de maturité TSP pour Groupe par trimestre (denrier rapport)' },
            { 'fr-fr': '% du niveau de maturité TSP sur les groupes et sous groupes TSP par trimestre (dernier rapport)' },
            {
                [VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteSousGroupe]: { 'fr-fr': 'DayLastSuiviCompetencesNiveauMaturiteSousGroupe' },
            }
        );

        this.optimization__has_no_imports = true;
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO[]> {
        let res: SuiviCompetencesSousGroupeUserTsRangesDataRangesVO[] = [];

        for (let i in intersectors) {
            switch (intersectors[i]._type) {
                case SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.API_TYPE_ID:
                    res.push(SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>(
                        this.varConf.name,
                        false,
                        (intersectors[i] as any as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO).suivi_comp_groupe_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO).suivi_comp_sous_groupe_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO).suivi_comp_grille_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO).user_id_ranges,
                        (intersectors[i] as any as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO).ts_ranges,
                    ));
                    break;
            }
        }

        return res;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        return {
            [VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteSousGroupe]: VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController.getInstance(),
        };
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        let param: SuiviCompetencesSousGroupeUserTsRangesDataRangesVO = varDAGNode.var_data as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO;

        let res: { [dep_id: string]: SuiviCompetencesSousGroupeUserTsRangesDataRangesVO } = {};

        RangeHandler.foreach_ranges_sync(param.ts_ranges, (date: number) => {
            res[VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteSousGroupe + '_' + date] = SuiviCompetencesSousGroupeUserTsRangesDataRangesVO.createNew<SuiviCompetencesSousGroupeUserTsRangesDataRangesVO>(
                SuiviCompetencesVarsNamesHolder.VarDayLastSuiviCompetencesNiveauMaturiteSousGroupeController_VAR_NAME,
                true,
                param.suivi_comp_groupe_id_ranges,
                param.suivi_comp_sous_groupe_id_ranges,
                param.suivi_comp_grille_id_ranges,
                param.user_id_ranges,
                [RangeHandler.createNew(
                    TSRange.RANGE_TYPE,
                    date,
                    Dates.endOf(date, TimeSegment.TYPE_QUARTER),
                    true,
                    true,
                    TimeSegment.TYPE_DAY
                )],
            );
        }, TimeSegment.TYPE_QUARTER);

        return res;
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        let res: number = 0;
        let cpt: number = 0;

        for (let i in varDAGNode.outgoing_deps) {
            let outgoing = varDAGNode.outgoing_deps[i];

            let var_data = (outgoing.outgoing_node as VarDAGNode).var_data as SuiviCompetencesSousGroupeUserTsRangesDataRangesVO;
            let value = var_data ? var_data.value : null;
            if ((value == null) || (isNaN(value))) {
                continue;
            }

            if (outgoing.dep_name.startsWith(VarQuarterLastSuiviCompetencesNiveauMaturiteSousGroupeController.DEP_DayLastSuiviCompetencesNiveauMaturiteSousGroupe)) {
                res += value;
                cpt++;
            }
        }

        return cpt ? (res / cpt) : null;
    }
}