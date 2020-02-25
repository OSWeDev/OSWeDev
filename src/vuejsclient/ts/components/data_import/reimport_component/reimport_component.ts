import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import Vuecomponentbase from '../../VueComponentBase';
import './reimport_component.scss';

@Component({
    template: require('./reimport_component.pug')
})
export default class ReimportComponent extends Vuecomponentbase {
    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;

    @Prop()
    public vo: any;

    @Prop()
    public param: number;

    get bdd_vo(): DataImportHistoricVO {
        if (!this.vo) {
            return null;
        }

        if (!this.vo.id) {
            return null;
        }

        if (!this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            return null;
        }

        return this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][this.vo.id] as DataImportHistoricVO;
    }

    private async reimporter(): Promise<void> {
        if (!this.can_reimport) {
            return;
        }

        let historic = this.bdd_vo;
        while (!!historic.reimport_of_dih_id) {
            historic = await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, historic.reimport_of_dih_id);
        }

        await ModuleDataImport.getInstance().reimportdih(historic);
        this.updateData(historic);
    }

    get can_reimport(): boolean {
        if (!this.bdd_vo) {
            return false;
        }

        if ([
            ModuleDataImport.IMPORTATION_STATE_FORMATTING,
            ModuleDataImport.IMPORTATION_STATE_IMPORTING,
            ModuleDataImport.IMPORTATION_STATE_POSTTREATING,
            ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
            ModuleDataImport.IMPORTATION_STATE_UPLOADED,
            ModuleDataImport.IMPORTATION_STATE_FORMATTED,
            ModuleDataImport.IMPORTATION_STATE_IMPORTED,
            ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT].indexOf(this.bdd_vo.state) >= 0) {
            return false;
        }

        if (!this.bdd_vo.file_id) {
            return false;
        }

        return true;
    }
}