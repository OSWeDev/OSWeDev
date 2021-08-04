import { templateSettings } from 'lodash';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';

export default class VarsController {

    /**
     * Suffix obligatoire pour les deps_ids pour s'assurer de pouvoir utiliser le startsWith sans problème
     */
    public static MANDATORY_DEP_ID_SUFFIX: string = '_._';

    public static getInstance(): VarsController {
        if (!VarsController.instance) {
            VarsController.instance = new VarsController();
        }
        return VarsController.instance;
    }

    private static VARS_DESC_TRANSLATABLE_PREFIXES: string = "var.desc.";
    private static instance: VarsController = null;

    /**
     * Les confs de var par nom, pour avoir les infos les plus importantes sur les vars partout
     */
    public var_conf_by_name: { [name: string]: VarConfVO } = {};
    public var_conf_by_id: { [var_id: number]: VarConfVO } = {};

    protected constructor() {
    }

    public clear_all_inits() {
        VarsController.getInstance().var_conf_by_id = {};
        VarsController.getInstance().var_conf_by_name = {};
    }

    public async initializeasync(var_conf_by_id: { [var_id: number]: VarConfVO } = null) {
        VarsController.getInstance().var_conf_by_id = var_conf_by_id;
        for (let i in VarsController.getInstance().var_conf_by_id) {
            let conf = VarsController.getInstance().var_conf_by_id[i];
            VarsController.getInstance().var_conf_by_name[conf.name] = conf;
        }
    }

    public get_card_field_code(field_id: string): string {
        return field_id.replace(/[.]/g, '_') + '__card';
    }
    public get_sum_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__sum';
    }
    public get_max_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__max';
    }
    public get_and_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__and';
    }
    public get_min_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__min';
    }
    public get_or_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__or';
    }
    public get_times_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__times';
    }
    public get_xor_dep_code(dep_id: string): string {
        return dep_id.replace(/[.]/g, '_') + '__xor';
    }

    public get_translatable_ds_name(ds_name: string): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + '__DS__' + ds_name + '.name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_name_code_by_var_id(var_id: number): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_description_code_by_var_id(var_id: number): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_description' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_explaination_by_var_id(var_id: number): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_explaination' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_explaination(var_name: string): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_explaination' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_dep_name(dep_id: string): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + '__DEPS__' + dep_id + '.name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_params_desc_code_by_var_id(var_id: number): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_params_desc' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_name_code(var_name: string): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_description_code(var_name: string): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_description' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_params_desc_code(var_name: string): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_params_desc' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public getValueOrDefault(data: VarDataBaseVO, default_value: any): number {
        return (data && (data.value != null)) ? data.value : default_value;
    }

    /**
     * Compare params. Return true if same and in same order
     * @param ps1
     * @param ps2
     */
    public isSameParamArray(ps1: VarDataBaseVO[], ps2: VarDataBaseVO[]): boolean {
        ps1 = (!!ps1) ? ps1 : [];
        ps2 = (!!ps2) ? ps2 : [];

        if (ps1.length != ps2.length) {
            return false;
        }

        for (let i in ps1) {
            let p1: VarDataBaseVO = ps1[i];
            let p2: VarDataBaseVO = ps2[i];

            if (p1.index != p2.index) {
                return false;
            }
        }
        return true;
    }

    /**
     * Renvoie var_datas - cutter
     */
    public substract_vars_datas(var_datas: VarDataBaseVO[], cutter: VarDataBaseVO[]): VarDataBaseVO[] {
        let temp: { [index: string]: VarDataBaseVO } = {};

        for (let i in var_datas) {
            let var_data = var_datas[i];

            temp[var_data.index] = var_data;
        }

        for (let j in cutter) {
            let cut = cutter[j];

            delete temp[cut.index];
        }

        return Object.values(temp);
    }
}