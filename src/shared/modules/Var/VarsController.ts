import RangeHandler from '../../tools/RangeHandler';
import IRange from '../DataRender/interfaces/IRange';
import MatroidController from '../Matroid/MatroidController';
import DefaultTranslationVO from '../Translation/vos/DefaultTranslationVO';
import MainAggregateOperatorsHandlers from './MainAggregateOperatorsHandlers';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';
import VarDataInvalidatorVO from './vos/VarDataInvalidatorVO';

export default class VarsController {

    /**
     * Suffix obligatoire pour les deps_ids pour s'assurer de pouvoir utiliser le startsWith sans problème
     */
    public static MANDATORY_DEP_ID_SUFFIX: string = '_._';

    /**
     * Les confs de var par nom, pour avoir les infos les plus importantes sur les vars partout
     */
    public static var_conf_by_name: { [name: string]: VarConfVO } = {};
    public static var_conf_by_id: { [var_id: number]: VarConfVO } = {};

    public static clear_all_inits() {
        VarsController.var_conf_by_id = {};
        VarsController.var_conf_by_name = {};
    }

    public static initialize(var_conf_by_id: { [var_id: number]: VarConfVO } = null) {
        VarsController.var_conf_by_id = var_conf_by_id;
        for (const i in VarsController.var_conf_by_id) {
            const conf = VarsController.var_conf_by_id[i];
            VarsController.var_conf_by_name[conf.name] = conf;
        }
    }

    public static get_validator_config_id(
        invalidator: VarDataInvalidatorVO,
        include_index: boolean = true): string {

        return (invalidator && !!invalidator.var_data) ?
            invalidator.var_data.var_id + '_' + (invalidator.invalidate_denied ? '1' : '0') + '_' + (invalidator.invalidate_imports ? '1' : '0')
            + (include_index ? '_' + invalidator.var_data.index : '') :
            null;
    }

    public static get_card_field_code(field_id: string): string {
        return field_id.replace(/[.]/g, '_') + '__card';
    }
    public static get_sum_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__sum';
    }
    public static get_max_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__max';
    }
    public static get_and_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__and';
    }
    public static get_min_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__min';
    }
    public static get_or_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__or';
    }
    public static get_times_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__times';
    }
    public static get_xor_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__xor';
    }

    public static get_explaination_sample_param(
        var_data: VarDataBaseVO,
        var_deps_names: { [dep_name: string]: string },
        var_deps_values: { [dep_id: string]: VarDataBaseVO },
    ): any {

        const res = {
            self: var_data.value
        };
        const matroid_bases = MatroidController.getMatroidBases(var_data);
        for (const i in matroid_bases) {
            const matroid_base = matroid_bases[i];

            if (!var_data[matroid_base.field_id]) {
                continue;
            }
            res[VarsController.get_card_field_code(matroid_base.field_id)] =
                RangeHandler.getCardinalFromArray(var_data[matroid_base.field_id] as IRange[]);
        }
        for (const var_dep_id in var_deps_names) {

            const values: number[] = [];
            for (const param_dep_id in var_deps_values) {
                if (!param_dep_id.startsWith(var_dep_id)) {
                    continue;
                }
                values.push(var_deps_values[param_dep_id].value);
            }

            if ((!values) || (!values.length)) {
                continue;
            }

            res[VarsController.get_sum_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM(values);
            res[VarsController.get_max_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX(values);
            res[VarsController.get_and_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND(values);
            res[VarsController.get_min_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN(values);
            res[VarsController.get_or_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR(values);
            res[VarsController.get_times_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES(values);
            res[VarsController.get_xor_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR(values);
        }

        return res;
    }


    public static get_translatable_ds_name(ds_name: string): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + '__DS__' + ds_name + '.name' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
    }

    public static get_translatable_name_code_by_var_id(var_id: number): string {
        return (var_id && VarsController.var_conf_by_id[var_id]) ?
            VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.var_conf_by_id[var_id].name + '.translatable_name' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION :
            null;
    }

    public static get_translatable_description_code_by_var_id(var_id: number): string {
        return (var_id && VarsController.var_conf_by_id[var_id]) ?
            VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.var_conf_by_id[var_id].name + '.translatable_description' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION :
            null;
    }

    public static get_translatable_public_explaination_by_var_id(var_id: number): string {
        return (var_id && VarsController.var_conf_by_id[var_id]) ?
            VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.var_conf_by_id[var_id].name + '.translatable_public_explaination' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION :
            null;
    }

    public static get_translatable_explaination_by_var_id(var_id: number): string {
        return (var_id && VarsController.var_conf_by_id[var_id]) ?
            VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.var_conf_by_id[var_id].name + '.translatable_explaination' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION :
            null;
    }

    public static get_translatable_explaination(var_name: string): string {
        return var_name ? VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_explaination' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION : null;
    }

    public static get_translatable_dep_name(dep_id: string): string {
        return dep_id ? VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + '__DEPS__' + dep_id + '.name' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION : null;
    }

    public static get_translatable_params_desc_code_by_var_id(var_id: number): string {
        return (var_id && VarsController.var_conf_by_id[var_id]) ?
            VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.var_conf_by_id[var_id].name + '.translatable_params_desc' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION :
            null;
    }

    public static get_translatable_name_code(var_name: string): string {
        return var_name ? VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_name' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION : null;
    }

    public static get_translatable_description_code(var_name: string): string {
        return var_name ? VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_description' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION : null;
    }

    public static get_translatable_params_desc_code(var_name: string): string {
        return var_name ? VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_params_desc' + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION : null;
    }

    public static getValueOrDefault(data: VarDataBaseVO, default_value: any): number {
        return (data && (data.value != null)) ? data.value : default_value;
    }

    /**
     * Compare params. Return true if same and in same order
     * @param ps1
     * @param ps2
     */
    public static isSameParamArray(ps1: VarDataBaseVO[], ps2: VarDataBaseVO[]): boolean {
        ps1 = (ps1) ? ps1 : [];
        ps2 = (ps2) ? ps2 : [];

        if (ps1.length != ps2.length) {
            return false;
        }

        for (const i in ps1) {
            const p1: VarDataBaseVO = ps1[i];
            const p2: VarDataBaseVO = ps2[i];

            if (!this.isSameParam(p1, p2)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Compare params. Return true if same
     * @param p1
     * @param p2
     */
    public static isSameParam(p1: VarDataBaseVO, p2: VarDataBaseVO): boolean {
        if (p1 && !p2) {
            return false;
        }

        if (!p1 && p2) {
            return false;
        }

        if (!p1 && !p2) {
            return true;
        }

        return p1.index == p2.index;
    }

    /**
     * Renvoie var_datas - cutter
     */
    public static substract_vars_datas(var_datas: VarDataBaseVO[], cutter: VarDataBaseVO[]): VarDataBaseVO[] {
        const temp: { [index: string]: VarDataBaseVO } = {};

        for (const i in var_datas) {
            const var_data = var_datas[i];

            temp[var_data.index] = var_data;
        }

        for (const j in cutter) {
            const cut = cutter[j];

            delete temp[cut.index];
        }

        return Object.values(temp);
    }

    private static VARS_DESC_TRANSLATABLE_PREFIXES: string = "var.desc.";
}