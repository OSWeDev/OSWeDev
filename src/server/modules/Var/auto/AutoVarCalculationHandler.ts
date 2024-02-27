import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import Durations from "../../../../shared/modules/FormatDatesNombres/Dates/Durations";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";

export default class AutoVarCalculationHandler {

    public static do_calculation(deps_values: number[], auto_operator: number): number {

        const res = null;
        switch (auto_operator) {

            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => deps_values[0]
                );

            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => deps_values[0] ? 0 : 1
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return ((deps_values[0] == null) || (isNaN(deps_values[0]))) ? 1 : 0;
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return ((deps_values[0] == null) || (isNaN(deps_values[0]))) ? 0 : 1;

            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (deps_values[0] === 0) ? 0 : -deps_values[0]
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.abs(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.log(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.sqrt(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => deps_values[0]!
                );

            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.year(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.month(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.date(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.isoWeekday(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.hour(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.minute(deps_values[0])
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.second(deps_values[0])
                );

            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Durations.as(deps_values[0], TimeSegment.TYPE_YEAR)
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Durations.as(deps_values[0], TimeSegment.TYPE_MONTH)
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Durations.as(deps_values[0], TimeSegment.TYPE_WEEK)
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Durations.as(deps_values[0], TimeSegment.TYPE_DAY)
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Durations.as(deps_values[0], TimeSegment.TYPE_HOUR)
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Durations.as(deps_values[0], TimeSegment.TYPE_MINUTE)
                );
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES:
                AutoVarCalculationHandler.assert_has_1_dep(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Durations.as(deps_values[0], TimeSegment.TYPE_SECOND)
                );

            case VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => deps_values[0] + deps_values[1]
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => deps_values[1] ? (deps_values[0] - deps_values[1]) : deps_values[0]
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => deps_values[0] * deps_values[1]
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => deps_values[1] ? deps_values[0] / deps_values[1] : null
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => {
                        let a = deps_values[1] ? (deps_values[0] % deps_values[1]) : null;
                        if (a == -0) {
                            a = 0;
                        }
                        return a;
                    }
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.max(deps_values[0], deps_values[1])
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.min(deps_values[0], deps_values[1])
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return (deps_values[0] == deps_values[1]) ? 1 : 0;
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_INF:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (deps_values[0] < deps_values[1]) ? 1 : 0
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (deps_values[0] > deps_values[1]) ? 1 : 0
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (deps_values[0] <= deps_values[1]) ? 1 : 0
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (deps_values[0] >= deps_values[1]) ? 1 : 0
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return (deps_values[0] == deps_values[1]) ? 0 : 1;
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_ET:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (deps_values[0] && deps_values[1]) ? 1 : 0
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_OU:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (deps_values[0] || deps_values[1]) ? 1 : 0
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => ((!!deps_values[0]) !== (!!deps_values[1])) ? 1 : 0
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.round(deps_values[0] * Math.pow(10, deps_values[1])) / Math.pow(10, deps_values[1])
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.ceil(deps_values[0] * Math.pow(10, deps_values[1])) / Math.pow(10, deps_values[1])
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.floor(deps_values[0] * Math.pow(10, deps_values[1])) / Math.pow(10, deps_values[1])
                );
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Math.pow(deps_values[0], deps_values[1])
                );

            case VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF:
                AutoVarCalculationHandler.assert_has_2_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.startOf(deps_values[0], deps_values[1])
                );

            case VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI:
                AutoVarCalculationHandler.assert_has_3_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => (!deps_values[0]) ? deps_values[2] : deps_values[1]
                );
            case VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE:
                AutoVarCalculationHandler.assert_has_3_deps(auto_operator, deps_values);
                return AutoVarCalculationHandler.return_null_if_has_null_undefined_or_nan_dep(
                    deps_values,
                    () => Dates.add(deps_values[0], deps_values[1], deps_values[2])
                );

            case VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG:

            default:
                throw new Error('AutoVarCalculationHandler.getValue: auto_operator NOT IMPLEMENTED : ' + auto_operator);
        }
    }

    private static DEP_PREFIX: string = 'DEP';
    private static DEP_SEPARATOR: string = '_';

    private static return_null_if_has_null_undefined_or_nan_dep(deps_values: number[], else_function: () => number): number {
        if ((!deps_values) || (deps_values.length == 0)) {
            return null;
        }

        for (const i in deps_values) {
            if ((deps_values[i] == null) || (isNaN(deps_values[i]))) {
                return null;
            }
        }

        return else_function();
    }

    private static assert_has_1_dep(auto_operator: number, deps_values: number[]): void {
        if ((!deps_values) || (deps_values.length != 1)) {
            throw new Error('AutoVarCalculationHandler.assert_has_1_dep: auto_operator needs 1 dep : ' + auto_operator);
        }
    }
    private static assert_has_2_deps(auto_operator: number, deps_values: number[]): void {
        if ((!deps_values) || (deps_values.length != 2)) {
            throw new Error('AutoVarCalculationHandler.assert_has_2_deps: auto_operator needs 2 deps : ' + auto_operator);
        }
    }
    private static assert_has_3_deps(auto_operator: number, deps_values: number[]): void {
        if ((!deps_values) || (deps_values.length != 3)) {
            throw new Error('AutoVarCalculationHandler.getValue: auto_operator needs 3 deps : ' + auto_operator);
        }
    }
}