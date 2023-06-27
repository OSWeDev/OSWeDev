import ContextFilterVO, { filter } from "../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import VarDAGNode from "../../../../shared/modules/Var/graph/VarDAGNode";
import ModuleVar from "../../../../shared/modules/Var/ModuleVar";
import VarConfAutoDepVO from "../../../../shared/modules/Var/vos/VarConfAutoDepVO";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import VarDataBaseVO from "../../../../shared/modules/Var/vos/VarDataBaseVO";
import VarParamFieldTransformStrategyVO from "../../../../shared/modules/Var/vos/VarParamFieldTransformStrategyVO";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import DataSourceControllerBase from "../datasource/DataSourceControllerBase";
import VarServerControllerBase from "../VarServerControllerBase";
import VarsServerController from "../VarsServerController";
import AutoVarCalculationHandler from "./AutoVarCalculationHandler";
import AutoVarDatasourceController from "./AutoVarDatasourceController";

export default class AutoVarServerController extends VarServerControllerBase<VarDataBaseVO> {

    public static getInstance(varconf: VarConfVO): AutoVarServerController {
        if (!AutoVarServerController.instances[varconf.id]) {
            AutoVarServerController.instances[varconf.id] = new AutoVarServerController(varconf);
        }
        return AutoVarServerController.instances[varconf.id];
    }

    protected static instances: { [varconf_id: number]: AutoVarServerController } = {};

    private static DEP_PREFIX: string = 'DEP';
    private static DEP_SEPARATOR: string = '_';

    private constructor(varconf: VarConfVO) {
        super(varconf, null, null, null, null);
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        /**
         * On a des deps de datas si on a un vofieldref
         */
        return (this.varConf.auto_operator == VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF) ? [
            AutoVarDatasourceController.getInstance(this.varConf)
        ] : null;
    }

    public getDataSourcesPredepsDependencies(): DataSourceControllerBase[] {
        return null;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        let res: { [dep_name: string]: VarServerControllerBase<any> } = {};

        for (let i in this.varConf.auto_deps) {
            let dep = this.varConf.auto_deps[i];

            if (dep.type !== VarConfAutoDepVO.DEP_TYPE_VAR) {
                continue;
            }

            res[AutoVarServerController.DEP_PREFIX + AutoVarServerController.DEP_SEPARATOR + i] = VarsServerController.getInstance().getVarControllerById(dep.var_id);
        }
        return res;
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {

        let res: { [dep_id: string]: VarDataBaseVO } = {};

        for (let i in this.varConf.auto_deps) {
            let dep = this.varConf.auto_deps[i];

            if (dep.type !== VarConfAutoDepVO.DEP_TYPE_VAR) {
                continue;
            }

            let this_dep_params = this.get_params_for_dep(varDAGNode, dep);
            for (let j in this_dep_params) {
                res[AutoVarServerController.DEP_PREFIX + AutoVarServerController.DEP_SEPARATOR + i + AutoVarServerController.DEP_SEPARATOR + j] = this_dep_params[j];
            }
        }
        return res;
    }

    // TODO
    // public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<VarDataBaseVO[]> {
    //     return [VarControllerHelpers.getInstance().get_invalid_CCS_params_intersectors_from_vo_famille_crescendo(this.varConf.name, c_or_d_vo)];
    // }

    // public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<VarDataBaseVO[]> {

    //     /**
    //      * Si on a pas touché aux champs utiles, on esquive la mise à jour
    //      */
    //     if (!this.has_changed_important_field(u_vo_holder)) {
    //         return null;
    //     }

    //     return [
    //         VarControllerHelpers.getInstance().get_invalid_CCS_params_intersectors_from_vo_famille_crescendo(this.varConf.name, u_vo_holder.pre_update_vo as any),
    //         VarControllerHelpers.getInstance().get_invalid_CCS_params_intersectors_from_vo_famille_crescendo(this.varConf.name, u_vo_holder.post_update_vo as any)
    //     ];
    // }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): Promise<VarDataBaseVO[]> {

        return this.get_params_from_dep(dep_id, intersectors);
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        let deps_values: number[] = [];

        for (let i in this.varConf.auto_deps) {
            let dep = this.varConf.auto_deps[i];

            switch (dep.type) {
                case VarConfAutoDepVO.DEP_TYPE_VAR:
                    let dep_value = VarsServerController.getInstance().get_outgoing_deps_sum(
                        varDAGNode, AutoVarServerController.DEP_PREFIX + AutoVarServerController.DEP_SEPARATOR + i + AutoVarServerController.DEP_SEPARATOR);
                    deps_values.push(dep_value);
                    break;
                case VarConfAutoDepVO.DEP_TYPE_NOW:
                    deps_values.push(Dates.now());
                    break;
                case VarConfAutoDepVO.DEP_TYPE_STATIC:
                    deps_values.push(dep.static_value);
                    break;
                default:
                    throw new Error('AutoVarServerController.getValue: dep.type inconnu : ' + dep.type);
            }
        }

        /**
         * On checke le nombre de values vs attente opérateur
         */
        switch (this.varConf.auto_operator) {
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOINS:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_NOT:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ABS:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNULL:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ISNOTNULL:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_FACTORIELLE:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_LN:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_RACINE:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_ANNEE:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_MOIS:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DU_MOIS:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_JOUR_DE_LA_SEMAINE:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_HEURE:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_MINUTE:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_SECONDE:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_ANNEES:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MOIS:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SEMAINES:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_JOURS:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_HEURES:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_MINUTES:
            case VarConfVO.AUTO_OPERATEUR_UNITAIRE_EN_SECONDES:
                if (deps_values.length != 1) {
                    throw new Error('AutoVarServerController.getValue: nombre de deps_values != 1 pour opérateur unitaire');
                }
                break;

            case VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MODULO:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MAX:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_MIN:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_EGAL:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_INF:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_SUP:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_INFEGAL:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_SUPEGAL:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_DIFFERENT:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_ET:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_OU:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_XOR:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_ROUND:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_CEIL:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_FLOOR:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_EXP:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_LOG:
            case VarConfVO.AUTO_OPERATEUR_BINAIRE_STARTOF:
                if (deps_values.length != 2) {
                    throw new Error('AutoVarServerController.getValue: nombre de deps_values != 2 pour opérateur binaire');
                }
                break;

            case VarConfVO.AUTO_OPERATEUR_TERNAIRE_SI:
            case VarConfVO.AUTO_OPERATEUR_TERNAIRE_AJOUT_DUREE:
                if (deps_values.length != 3) {
                    throw new Error('AutoVarServerController.getValue: nombre de deps_values != 3 pour opérateur ternaire');
                }
                break;

            default:
                throw new Error('AutoVarServerController.getValue: auto_operator NOT IMPLEMENTED : ' + this.varConf.auto_operator);
        }

        /**
         * On fait le calcul
         */
        return AutoVarCalculationHandler.do_calculation(deps_values, this.varConf.auto_operator);
    }

    private get_params_from_dep<T extends VarDataBaseVO>(dep_id: string, intersectors: T[]): VarDataBaseVO[] {

        if ((!this.varConf) || (!this.varConf.auto_deps) || (!dep_id)) {
            return null;
        }
        let depid_parts = dep_id.split(AutoVarServerController.DEP_SEPARATOR);
        if (depid_parts.length < 2) {
            return null;
        }
        let dep = this.varConf.auto_deps[depid_parts[1]];

        if (!dep) {
            return null;
        }

        let res: VarDataBaseVO[] = VarDataBaseVO.cloneArrayFrom<VarDataBaseVO, VarDataBaseVO>(
            intersectors as any as VarDataBaseVO[], this.varConf.name);

        for (let param_field_id in dep.params_transform_strategies) {
            let field_transform_strategies = dep.params_transform_strategies[param_field_id];

            if ((!field_transform_strategies) || (!field_transform_strategies.length) ||
                ((field_transform_strategies.length == 1) && (field_transform_strategies[0].type == VarParamFieldTransformStrategyVO.TYPE_COPY))) {
                continue;
            }

            for (let i in res) {
                let param = res[i];

                let field_value = param[param_field_id];
                for (let j in field_transform_strategies) {
                    let transform_strategy = field_transform_strategies[j];

                    switch (transform_strategy.type) {
                        case VarParamFieldTransformStrategyVO.TYPE_COPY:
                            // On commence toujours par une copie, elle est déjà faite
                            break;
                        case VarParamFieldTransformStrategyVO.TYPE_SEGMENT_SHIFT:
                            field_value = RangeHandler.get_ranges_shifted_by_x_segments(field_value, -transform_strategy.shift_size, transform_strategy.segmentation_type);
                            break;
                        case VarParamFieldTransformStrategyVO.TYPE_SEGMENT_SPLIT:
                            /**
                             * Plus compliqué il faut démultiplier les params en fonction des valeurs du segment sur lequel on splitt
                             *  Pas forcément compliqué à mettre en place mais à optimiser pour éviter 50 copies du même param ça c'est plus compliqué
                             */
                            throw new Error('Not implemented');
                    }
                }
                param[param_field_id] = field_value;
            }
        }

        return res;
    }

    private get_params_for_dep(varDAGNode: VarDAGNode, dep: VarConfAutoDepVO): VarDataBaseVO[] {
        let target_varconf: VarConfVO = VarsServerController.getInstance().getVarConfById(dep.var_id);

        let res: VarDataBaseVO[] = [];
        let cloned = VarDataBaseVO.cloneFromVarName<VarDataBaseVO, VarDataBaseVO>(
            varDAGNode.var_data as VarDataBaseVO, target_varconf.name, true);
        res.push(cloned);

        for (let param_field_id in dep.params_transform_strategies) {
            let field_transform_strategies = dep.params_transform_strategies[param_field_id];

            if ((!field_transform_strategies) || (!field_transform_strategies.length) ||
                ((field_transform_strategies.length == 1) && (field_transform_strategies[0].type == VarParamFieldTransformStrategyVO.TYPE_COPY))) {
                continue;
            }

            let field_value = cloned[param_field_id];
            for (let j in field_transform_strategies) {
                let transform_strategy = field_transform_strategies[j];

                switch (transform_strategy.type) {
                    case VarParamFieldTransformStrategyVO.TYPE_COPY:
                        // On commence toujours par une copie, elle est déjà faite
                        break;
                    case VarParamFieldTransformStrategyVO.TYPE_SEGMENT_SHIFT:
                        field_value = RangeHandler.get_ranges_shifted_by_x_segments(field_value, transform_strategy.shift_size, transform_strategy.segmentation_type);
                        break;
                    case VarParamFieldTransformStrategyVO.TYPE_SEGMENT_SPLIT:
                        /**
                         * Plus compliqué il faut démultiplier les params en fonction des valeurs du segment sur lequel on splitt
                         *  Pas forcément compliqué à mettre en place mais à optimiser pour éviter 50 copies du même param ça c'est plus compliqué
                         */
                        throw new Error('Not implemented');
                }
            }
            cloned[param_field_id] = field_value;
        }

        return res;
    }

    private has_changed_important_field<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): boolean {
        if ((!u_vo_holder) || ((!u_vo_holder.pre_update_vo) && (!u_vo_holder.post_update_vo)) ||
            (this.varConf.auto_operator != VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF) ||
            (!this.varConf.auto_vofieldref_api_type_id) || (!this.varConf.auto_vofieldref_api_type_id)) {
            return false;
        }

        if ((!u_vo_holder.pre_update_vo) && (u_vo_holder.post_update_vo._type == this.varConf.auto_vofieldref_api_type_id)) {
            return true;
        }

        if (!u_vo_holder.post_update_vo) {
            return false;
        }

        if (u_vo_holder.pre_update_vo._type != this.varConf.auto_vofieldref_api_type_id) {
            return false;
        }

        if (!u_vo_holder.post_update_vo) {
            return true;
        }

        if (u_vo_holder.post_update_vo._type != this.varConf.auto_vofieldref_api_type_id) {
            return false;
        }

        return u_vo_holder.post_update_vo[this.varConf.auto_vofieldref_field_id] != u_vo_holder.pre_update_vo[this.varConf.auto_vofieldref_field_id];
    }

    private async get_invalid_params_intersectors_from_vo(vo: IDistantVOBase): Promise<VarDataBaseVO> {

        let active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = {
            [vo._type]: { id: filter(vo._type).by_id(vo.id) }
        };

        let var_param = await ModuleVar.getInstance().getVarParamFromContextFilters(
            this.varConf.name,
            active_field_filters,
            null,
            this.varConf.auto_param_context_api_type_ids,
            this.varConf.auto_param_context_discarded_field_paths,
            true);
        //TODO FIXME handle return null case
        return var_param;
    }
}