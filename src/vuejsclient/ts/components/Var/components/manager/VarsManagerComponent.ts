import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarsManagerComponent.scss';
import moment = require('moment');
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter, ModuleVarAction } from '../../store/VarStore';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarDescRegistrationsComponent from '../desc/registrations/VarDescRegistrationsComponent';

@Component({
    template: require('./VarsManagerComponent.pug'),
    components: {
        "var-desc-registrations": VarDescRegistrationsComponent
    }
})
export default class VarsManagerComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public isUpdating: boolean;
    @ModuleVarGetter
    public isDescMode: boolean;
    @ModuleVarGetter
    public isDescOpened: boolean;
    @ModuleVarGetter
    public isDescRegistrationsOpened: boolean;
    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarGetter
    public getUpdatingParamsByVarsIds: { [var_id: number]: { [index: string]: IVarDataParamVOBase } };

    @ModuleVarAction
    public setVarData: (varData: IVarDataVOBase) => void;
    @ModuleVarAction
    public removeVarData: (varDataParam: IVarDataParamVOBase) => void;
    @ModuleVarAction
    public setIsUpdating: (is_updating: boolean) => void;
    @ModuleVarAction
    public setDescMode: (desc_mode: boolean) => void;
    @ModuleVarAction
    public setDescOpened: (desc_opened: boolean) => void;
    @ModuleVarAction
    public setDescRegistrationsOpened: (desc_registrations_opened: boolean) => void;
    @ModuleVarAction
    public setUpdatingParamsByVarsIds: (updating_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } }) => void;

    public mounted() {
        VarsController.getInstance().registerStoreHandlers(this.getVarDatas, this.setVarData, this.setIsUpdating, this.getUpdatingParamsByVarsIds, this.setUpdatingParamsByVarsIds);
    }

    private async switchDescMode() {
        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_DESC_MODE_ACCESS)) {
            return;
        }

        this.setDescMode(!this.isDescMode);
    }
}