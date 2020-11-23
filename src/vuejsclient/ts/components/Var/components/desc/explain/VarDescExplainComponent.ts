import { Component, Prop, Watch } from 'vue-property-decorator';
import IRange from '../../../../../../../shared/modules/DataRender/interfaces/IRange';
import MatroidController from '../../../../../../../shared/modules/Matroid/MatroidController';
import MainAggregateOperatorsHandlers from '../../../../../../../shared/modules/Var/MainAggregateOperatorsHandlers';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarGetter } from '../../../store/VarStore';
import VarsClientController from '../../../VarsClientController';
import './VarDescExplainComponent.scss';

@Component({
    template: require('./VarDescExplainComponent.pug'),
    components: {
        Vardescexplaindepcomponent: () => import(/* webpackChunkName: "VarDescExplainDepComponent" */ './dep/VarDescExplainDepComponent'),
        Vardescexplaindscomponent: () => import(/* webpackChunkName: "VarDescExplainDsComponent" */ './ds/VarDescExplainDsComponent')
    }
})
export default class VarDescExplainComponent extends VueComponentBase {

    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };

    @Prop()
    private var_param: VarDataBaseVO;

    private deps_loading: boolean = true;
    private deps_params: { [dep_id: string]: VarDataBaseVO } = {};
    private vars_deps: { [dep_name: string]: string } = {};
    private ds_values_jsoned: { [ds_name: string]: string } = null;

    private opened: boolean = true;

    private var_id_from_name(name: string): number {
        return VarsController.getInstance().var_conf_by_name[name].id;
    }

    private params_from_var_dep_id(var_dep_id: string): VarDataBaseVO[] {
        let res: VarDataBaseVO[] = [];

        for (let param_dep_id in this.deps_params) {
            if (!param_dep_id.startsWith(var_dep_id)) {
                continue;
            }

            res.push(this.deps_params[param_dep_id]);
        }
        return res;
    }

    @Watch('var_param', { immediate: true })
    private async load_param_infos() {

        if ((!this.var_param) || (!VarsController.getInstance().var_conf_by_id[this.var_param.var_id])) {
            return;
        }

        this.deps_loading = true;

        this.deps_params = await ModuleVar.getInstance().getParamDependencies(this.var_param);
        this.vars_deps = await ModuleVar.getInstance().getVarControllerVarsDeps(VarsController.getInstance().var_conf_by_id[this.var_param.var_id].name);
        this.ds_values_jsoned = await ModuleVar.getInstance().getVarParamDatas(this.var_param);

        this.deps_loading = false;
    }

    get self_param_loaded() {
        if (this.deps_loading) {
            return false;
        }

        let dep_data = this.getVarDatas[this.var_param.index];

        if ((!dep_data) || (typeof dep_data.value === 'undefined')) {
            return false;
        }

        return true;
    }

    get deps_params_loaded() {
        if (this.deps_loading || !this.self_param_loaded) {
            return false;
        }

        for (let i in this.deps_params) {
            let dep_param = this.deps_params[i];
            let dep_data = this.getVarDatas[dep_param.index];

            if ((!dep_data) || (typeof dep_data.value === 'undefined')) {
                return false;
            }
        }

        return true;
    }

    /**
     * par convention on met dans le param de la trad ces infos par dep_id :
     *  - DEP_ID + '__sum' = somme des deps qui commencent par ce dep_id
     *  - DEP_ID + '__max' = max des deps qui commencent par ce dep_id
     *  - DEP_ID + '__min' = min des deps qui commencent par ce dep_id
     *  - DEP_ID + '__times' = produit des deps qui commencent par ce dep_id
     *  - DEP_ID + '__and' = and sur les deps qui commencent par ce dep_id
     *  - DEP_ID + '__or' = or sur les deps qui commencent par ce dep_id
     *  - DEP_ID + '__xor' = xor sur les deps qui commencent par ce dep_id
     *  - DEP_ID + '__length' = nombre de deps qui commencent par ce dep_id
     *  - DEP_ID + '__' + i = valeur de chaque dep 0 indexed
     *
     * + 'self' pour la value du param
     *
     * + FIELD_ID + '__card' = le cardinal de chaque dimension du matroid
     */
    get explaination_sample_param() {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return null;
        }

        let res = {
            self: this.getVarDatas[this.var_param.index].value
        };
        let matroid_bases = MatroidController.getInstance().getMatroidBases(this.var_param);
        for (let i in matroid_bases) {
            let matroid_base = matroid_bases[i];

            if (!this.var_param[matroid_base.field_id]) {
                continue;
            }
            res[VarsController.getInstance().get_card_field_code(matroid_base.field_id)] =
                RangeHandler.getInstance().getCardinalFromArray(this.var_param[matroid_base.field_id] as Array<IRange<any>>);
        }
        for (let var_dep_id in this.vars_deps) {

            let values: number[] = [];
            for (let param_dep_id in this.deps_params) {
                if (!param_dep_id.startsWith(var_dep_id)) {
                    continue;
                }
                values.push(this.getVarDatas[this.deps_params[param_dep_id].index].value);
            }

            if ((!values) || (!values.length)) {
                continue;
            }

            res[VarsController.getInstance().get_sum_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_SUM(values);
            res[VarsController.getInstance().get_max_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_MAX(values);
            res[VarsController.getInstance().get_and_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_AND(values);
            res[VarsController.getInstance().get_min_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_MIN(values);
            res[VarsController.getInstance().get_or_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_OR(values);
            res[VarsController.getInstance().get_times_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_TIMES(values);
            res[VarsController.getInstance().get_xor_dep_code(var_dep_id)] = MainAggregateOperatorsHandlers.getInstance().aggregateValues_XOR(values);
        }

        return res;
    }

    get explaination(): string {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_explaination_by_var_id(this.var_param.var_id), this.explaination_sample_param);
    }

    get has_explaination(): boolean {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return false;
        }

        return VarsController.getInstance().get_translatable_explaination_by_var_id(this.var_param.var_id) != this.explaination;
    }

    get has_deps_params(): boolean {
        if ((!this.deps_params_loaded) || (!this.self_param_loaded)) {
            return false;
        }

        return ObjectHandler.getInstance().hasAtLeastOneAttribute(this.deps_params);
    }

    private destroyed() {
        this.unregister(this.deps_params);
    }

    private register(deps_params: { [dep_id: string]: VarDataBaseVO }) {
        if (!deps_params) {
            return;
        }

        if (deps_params && ObjectHandler.getInstance().hasAtLeastOneAttribute(deps_params)) {
            VarsClientController.getInstance().registerParams(Object.values(deps_params));
        }
    }

    private unregister(deps_params: { [dep_id: string]: VarDataBaseVO }) {
        if (!deps_params) {
            return;
        }

        if (deps_params && ObjectHandler.getInstance().hasAtLeastOneAttribute(deps_params)) {
            VarsClientController.getInstance().unRegisterParams(Object.values(deps_params));
        }
    }

    @Watch('deps_params')
    private onChangeVarParam(new_var_params: { [dep_id: string]: VarDataBaseVO }, old_var_params: { [dep_id: string]: VarDataBaseVO }) {

        if ((!new_var_params) && (!old_var_params)) {
            return;
        }

        // On doit vérifier qu'ils sont bien différents
        if (new_var_params && old_var_params && VarsController.getInstance().isSameParamArray(Object.values(new_var_params), Object.values(old_var_params))) {
            return;
        }

        if (old_var_params && ObjectHandler.getInstance().hasAtLeastOneAttribute(old_var_params)) {
            this.unregister(old_var_params);
        }

        if (new_var_params && ObjectHandler.getInstance().hasAtLeastOneAttribute(new_var_params)) {
            this.register(new_var_params);
        }
    }
}