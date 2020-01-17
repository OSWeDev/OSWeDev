import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleMaintenance from '../../../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../../../ts/components/DAO/store/DaoStore';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import './endmaintenance_component.scss';

@Component({
    template: require('./endmaintenance_component.pug')
})
export default class EndMaintenaceComponent extends VueComponentBase {
    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;

    @Prop()
    public vo: any;

    get bdd_vo(): MaintenanceVO {
        if (!this.vo) {
            return null;
        }

        if (!this.vo.id) {
            return null;
        }

        if (!this.getStoredDatas[MaintenanceVO.API_TYPE_ID]) {
            return null;
        }

        return this.getStoredDatas[MaintenanceVO.API_TYPE_ID][this.vo.id] as MaintenanceVO;
    }

    private async endmaintenance(): Promise<void> {
        if (!this.can_endmaintenance) {
            return;
        }

        await ModuleMaintenance.getInstance().end_maintenance(this.bdd_vo.id);
        this.updateData(this.bdd_vo);
    }

    get can_endmaintenance(): boolean {
        if (!this.bdd_vo) {
            return false;
        }

        if (this.bdd_vo.maintenance_over) {
            return false;
        }

        return true;
    }
}