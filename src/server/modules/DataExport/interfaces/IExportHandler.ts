import ExportHistoricVO from '../../../../shared/modules/DataExport/vos/ExportHistoricVO';
import IExportableDatas from './IExportableDatas';

export default interface IExportHandler {
    prepare_datas: (exhi: ExportHistoricVO) => Promise<IExportableDatas>;
    export: (exhi: ExportHistoricVO, datas: IExportableDatas) => Promise<boolean>;
    send: (exhi: ExportHistoricVO) => Promise<boolean>;
}