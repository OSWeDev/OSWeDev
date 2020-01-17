import { Component, Prop } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleMaintenance from '../../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import { ModuleDAOGetter } from '../../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import "./TerminateMaintenanceComponent.scss";

@Component({
    template: require('./TerminateMaintenanceComponent.pug')
})
export default class TerminateMaintenanceComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @Prop()
    private vo: MaintenanceVO;

    get is_planned(): boolean {
        if (!this.vo) {
            return false;
        }

        return !this.vo.maintenance_over;
    }

    private async terminate() {
        if (!this.vo) {
            return;
        }

        await ModuleMaintenance.getInstance().end_maintenance(this.vo.id);
    }
}