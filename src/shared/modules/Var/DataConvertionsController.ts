import RangeHandler from '../../tools/RangeHandler';
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
         */
        let new_fields: Array<ModuleTableField<any>> = [];
        let deleted_fields: Array<ModuleTableField<any>> = [];
        VOsTypesManager.getInstance().getChangingFieldsFromDifferentApiTypes(moduletable_from, moduletable_to, new_fields, deleted_fields);

        new_fields.forEach((field: ModuleTableField<any>) => param[field.field_id] = RangeHandler.getInstance().getMaxRange(field));
        deleted_fields.forEach((field: ModuleTableField<any>) => delete param[field.field_id]);

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