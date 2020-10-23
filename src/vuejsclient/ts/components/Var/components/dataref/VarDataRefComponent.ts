import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import './VarDataRefComponent.scss';

@Component({
    template: require('./VarDataRefComponent.pug')
})
export default class VarDataRefComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };
    @ModuleVarGetter
    public getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarGetter
    public get_dependencies_heatmap_version: number;
    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;
    @ModuleVarGetter
    public isDescMode: boolean;

    @Prop()
    public var_param: VarDataBaseVO;

    @Prop({ default: null })
    public var_value_callback: (var_value: VarDataValueResVO, component: VarDataRefComponent) => any;

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: false })
    public reload_on_mount: boolean;

    @Prop({ default: null })
    public prefix: string;

    @Prop({ default: null })
    public suffix: string;

    @Prop({ default: null })
    public null_value_replacement: string;

    @Prop({ default: null })
    public zero_value_replacement: string;

    @Prop({ default: false })
    public consider_zero_value_as_null: boolean;

    @Prop({ default: true })
    public use_intersector: boolean;

    @Prop({ default: false })
    public add_infos: string[]; // tableau de champs que l'on veut afficher

    @Prop({ default: false })
    public add_infos_additional_params: any[];  // tableau des params pour chacun des champs présents dans add_infos

    private entered_once: boolean = false;

    get is_being_updated(): boolean {

        if (!this.var_data) {
            return true;
        }

        return typeof this.var_data.value === 'undefined';
    }

    get filtered_value() {

        if (!this.var_data) {
            return null;
        }

        if (!this.filter) {
            return this.var_data_value;
        }

        let params = [this.var_data_value];

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    get var_data_value() {
        if (!this.var_data) {
            return null;
        }

        if (!this.var_value_callback) {
            return this.var_data.value;
        }

        return this.var_value_callback(this.var_data, this);
    }

    get is_selected_var(): boolean {
        if ((!this.isDescMode) || (!this.getDescSelectedVarParam)) {
            return false;
        }
        return this.getDescSelectedVarParam.index == this.var_param.index;
    }

    get var_index(): string {
        if (!this.var_param) {
            return null;
        }

        return this.var_param.index;
    }

    get var_data(): VarDataValueResVO {

        if (!this.entered_once) {
            return null;
        }

        if ((!this.getVarDatas) || (!this.var_param)) {
            return null;
        }

        return this.getVarDatas[this.var_param.index];
    }

    public mounted() {
        if (!this.use_intersector) {
            this.intersect_in();
        }
    }

    public destroyed() {
        this.unregister();
    }

    private intersect_in() {
        this.entered_once = true;
        this.register();
    }

    private intersect_out() {
        this.unregister();
    }

    private register(var_param: VarDataBaseVO = null) {
        if (!this.entered_once) {
            return;
        }

        VarsClientController.getInstance().registerParams([var_param ? var_param : this.var_param]);
    }

    private unregister(var_param: VarDataBaseVO = null) {
        if (!this.entered_once) {
            return;
        }

        VarsClientController.getInstance().unRegisterParams([var_param ? var_param : this.var_param]);
    }

    @Watch('var_param')
    private onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

        // On doit vérifier qu'ils sont bien différents
        if (new_var_param.index == old_var_param.index) {
            return;
        }

        if (old_var_param) {
            this.unregister(old_var_param);
        }

        if (new_var_param) {
            this.register();
        }
    }

    private selectVar() {
        if (!this.isDescMode) {
            return;
        }

        this.setDescSelectedVarParam(this.var_param);
    }
}