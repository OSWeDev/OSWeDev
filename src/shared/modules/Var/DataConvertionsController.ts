import RangeHandler from '../../tools/RangeHandler';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VOsTypesManager';
import VarsController from './VarsController';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';

export default class DataConvertionsController {

    public static getInstance(): DataConvertionsController {
        if (!DataConvertionsController.instance) {
            DataConvertionsController.instance = new DataConvertionsController();
        }
        return DataConvertionsController.instance;
    }

    protected static instance: DataConvertionsController = null;

    public specialized_converters: { [from_api_type_id: string]: { [to_api_type_id: string]: (param: VarDataBaseVO) => {} } } = {};

    private constructor() { }

    /**
     * ATTENTION : on change le param directement sans copie, on le renvoie juste pour assurer une continuité dans l'écriture - Proxy Pattern
     * @param param l'objet que l'on veut convertir
     */
    public convertVarDataFromVarName(param: VarDataBaseVO, target_var_name: string): VarDataBaseVO {

        return this.convertVarDataFromVarConf(param, VarsController.getInstance().var_conf_by_name[target_var_name]);
    }

    /**
     * ATTENTION : on change le param directement sans copie, on le renvoie juste pour assurer une continuité dans l'écriture - Proxy Pattern
     * @param param l'objet que l'on veut convertir
     */
    public convertVarDataFromVarId(param: VarDataBaseVO, target_var_id: number): VarDataBaseVO {

        return this.convertVarDataFromVarConf(param, VarsController.getInstance().var_conf_by_id[target_var_id]);
    }


    /**
     * ATTENTION : on change le param directement sans copie, on le renvoie juste pour assurer une continuité dans l'écriture - Proxy Pattern
     *  On adapte aussi le segment_type du ts_ranges (ou nom équivalent définit dans la conf de la var)
     * @param param l'objet que l'on veut convertir
     */
    public convertVarDataFromVarConf(param: VarDataBaseVO, target_var_conf: VarConfVO): VarDataBaseVO {

        if ((!param) || (!target_var_conf) || (target_var_conf.id == param.var_id)) {
            return param;
        }

        let moduletable_from = VOsTypesManager.getInstance().moduleTables_by_voType[param._type];
        let moduletable_to = VOsTypesManager.getInstance().moduleTables_by_voType[target_var_conf.var_data_vo_type];

        /**
         * Les champs manquants dans le type cible on les supprime
         * Les champs nouveaux dans le type cible on les crée en max range
         * On supprime l'index et on change le type
         *
         * Pour les champs qui restent valides mais qui changent de segmentation => si la nouvelle est plus large que l'ancienne, on adapte le(s) range(s)
         */
        let common_fields: Array<ModuleTableField<any>> = [];
        let new_fields: Array<ModuleTableField<any>> = [];
        let deleted_fields: Array<ModuleTableField<any>> = [];
        VOsTypesManager.getInstance().getChangingFieldsFromDifferentApiTypes(moduletable_from, moduletable_to, common_fields, new_fields, deleted_fields);

        new_fields.forEach((field: ModuleTableField<any>) => param[field.field_id] = RangeHandler.getInstance().getMaxRange(field));
        deleted_fields.forEach((field: ModuleTableField<any>) => delete param[field.field_id]);

        if (target_var_conf.ts_ranges_segment_type != null) {

            param[target_var_conf.ts_ranges_field_name] = RangeHandler.getInstance().get_ranges_according_to_segment_type(param[target_var_conf.ts_ranges_field_name], target_var_conf.ts_ranges_segment_type);
        }

        param._type = target_var_conf.var_data_vo_type;
        delete param['_index'];
        return param;
    }



    /**
     * ATTENTION : on change les params directement sans copie, on les renvoie juste pour assurer une continuité dans l'écriture - Proxy Pattern
     * @param params les objets que l'on veut convertir
     */
    public convertVarDatasFromVarName(params: VarDataBaseVO[], target_var_name: string): VarDataBaseVO[] {

        params.forEach((param) => DataConvertionsController.getInstance().convertVarDataFromVarConf(
            param, VarsController.getInstance().var_conf_by_name[target_var_name]));
        return params;
    }

    /**
     * ATTENTION : on change les params directement sans copie, on les renvoie juste pour assurer une continuité dans l'écriture - Proxy Pattern
     * @param params les objets que l'on veut convertir
     */
    public convertVarDatasFromVarId(params: VarDataBaseVO[], target_var_id: number): VarDataBaseVO[] {

        params.forEach((param) => DataConvertionsController.getInstance().convertVarDataFromVarConf(
            param, VarsController.getInstance().var_conf_by_id[target_var_id]));
        return params;
    }

    /**
     * ATTENTION : on change les params directement sans copie, on les renvoie juste pour assurer une continuité dans l'écriture - Proxy Pattern
     * @param params les objets que l'on veut convertir
     */
    public convertVarDatasFromVarConf(params: VarDataBaseVO[], target_var_conf: VarConfVO): VarDataBaseVO[] {

        params.forEach((param) => DataConvertionsController.getInstance().convertVarDataFromVarConf(param, target_var_conf));
        return params;
    }
}