import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarsManagerComponent.scss';
import moment = require('moment');
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter, ModuleVarAction } from '../../store/VarStore';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';

@Component({
    template: require('./VarsManagerComponent.pug')
})
export default class VarsManagerComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public isUpdating: boolean;
    @ModuleVarAction
    public setVarData: (varData: IVarDataVOBase) => void;
    @ModuleVarAction
    public removeVarData: (varDataParam: IVarDataParamVOBase) => void;
    @ModuleVarAction
    public setIsUpdating: (is_updating: boolean) => void;


    public mounted() {
        VarsController.getInstance().registerStoreHandlers(this.getVarDatas, this.setVarData, this.setIsUpdating);
    }
}