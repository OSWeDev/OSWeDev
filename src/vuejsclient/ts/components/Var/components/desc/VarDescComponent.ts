import { Component, Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import './VarDescComponent.scss';

@Component({
    template: require('./VarDescComponent.pug'),
    components: {
        Vardesccontrollercomponent: () => import(/* webpackChunkName: "VarDescControllerComponent" */ './controller/VarDescControllerComponent'),
        Vardescparamfieldscomponent: () => import(/* webpackChunkName: "VarDescParamFieldsComponent" */ './param_fields/VarDescParamFieldsComponent'),
        Vardescexplaincomponent: () => import(/* webpackChunkName: "VarDescExplainComponent" */ './explain/VarDescExplainComponent')
    }
})
export default class VarDescComponent extends VueComponentBase {

    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };

    @Prop()
    private var_param: VarDataBaseVO;

    @Prop({ default: true })
    private show_deps: boolean;

    @Prop({ default: true })
    private show_imports: boolean;

    @Prop({ default: true })
    private show_last_update: boolean;

    get var_data_has_valid_value(): boolean {
        if (!this.var_param) {
            return false;
        }

        let var_data = this.getVarDatas[this.var_param.index];

        if ((!var_data) || (typeof var_data.value === 'undefined')) {
            return false;
        }

        return true;
    }

    get var_data_is_import(): boolean {
        if (!this.var_data_has_valid_value) {
            return false;
        }
        let var_data = this.getVarDatas[this.var_param.index];

        return var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT;
    }

    get var_id(): number {
        if (!this.var_param) {
            return null;
        }

        return this.var_param.var_id;
    }

    get var_description(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_description_code_by_var_id(this.var_param.var_id));
    }

    private async update_var_data() {
        if (this.var_param.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
            this.snotify.error(this.label('var.desc_mode.update_var_data.not_allowed_on_imports'));
            return;
        }
        this.var_param.value_ts = null;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.var_param);
        this.snotify.info(this.label('var.desc_mode.update_var_data'));
    }

    get var_data_last_update(): string {
        if (!this.var_data_has_valid_value) {
            return null;
        }

        let var_data = this.getVarDatas[this.var_param.index];

        return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(var_data.value_ts);
    }
}