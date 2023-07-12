/* istanbul ignore file : nothing to test in this VO */

import IDistantVOBase from '../../IDistantVOBase';
import VarParamFieldTransformStrategyVO from './VarParamFieldTransformStrategyVO';

export default class VarConfAutoDepVO implements IDistantVOBase {

    /**
     * Une var
     */
    public static DEP_TYPE_VAR: number = 0;
    /**
     * Un nombre fixe (date ou nombre)
     */
    public static DEP_TYPE_STATIC: number = 1;
    /**
     * La date au moment du calcul
     */
    public static DEP_TYPE_NOW: number = 2;

    public static DEP_TYPE_LABELS: { [id: number]: string } = {
        [VarConfAutoDepVO.DEP_TYPE_VAR]: 'var_conf_auto_dep.dep_type.var',
        [VarConfAutoDepVO.DEP_TYPE_STATIC]: 'var_conf_auto_dep.dep_type.static',
        [VarConfAutoDepVO.DEP_TYPE_NOW]: 'var_conf_auto_dep.dep_type.now',
    };

    public static API_TYPE_ID: string = "var_conf_auto_dep";

    public id: number;
    public _type: string = VarConfAutoDepVO.API_TYPE_ID;

    public type: number;

    /**
     * Dans le cas d'une dep de type var, l'id de la var
     */
    public var_id: number;

    /**
     * Dans le cas d'une dep de type static, la valeur
     */
    public static_value: number;

    /**
     * Dans le cas d'une dep de type var, on fournit la statégie de transformation des params pour chaque dimension
     */
    public params_transform_strategies: { [param_field_id: string]: VarParamFieldTransformStrategyVO[] } = {};
}