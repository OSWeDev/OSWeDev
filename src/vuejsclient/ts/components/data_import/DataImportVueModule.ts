import ComponentDatatableField from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableField';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import TableWidgetController from '../dashboard_builder/widgets/table_widget/TableWidgetController';
import ReimportComponent from './reimport_component/reimport_component';
import './scss/data_import.scss';

export default class DataImportVueModule extends VueModuleBase {

    public static getInstance(): DataImportVueModule {
        if (!DataImportVueModule.instance) {
            DataImportVueModule.instance = new DataImportVueModule();
        }

        return DataImportVueModule.instance;
    }

    private static instance: DataImportVueModule = null;

    private constructor() {
        super(ModuleDataImport.getInstance().name);
    }

    public initialize() {
        TableWidgetController.getInstance().register_component(
            new ComponentDatatableField('reimporter', ReimportComponent, 'file_id')
                .setModuleTable(VOsTypesManager.moduleTables_by_voType[DataImportHistoricVO.API_TYPE_ID])
        );
    }
}