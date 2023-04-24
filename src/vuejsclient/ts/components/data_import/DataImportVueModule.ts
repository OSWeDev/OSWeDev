import Vue from 'vue';
import ComponentDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
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
        Vue.component('Reimportcomponent', async () => (await import(/* webpackChunkName: "ReimportComponent" */  './reimport_component/reimport_component')));
        TableWidgetController.getInstance().register_component(
            ComponentDatatableFieldVO.createNew('reimporter', 'Reimportcomponent', 'file_id')
                .setModuleTable(VOsTypesManager.moduleTables_by_voType[DataImportHistoricVO.API_TYPE_ID])
        );
    }
}