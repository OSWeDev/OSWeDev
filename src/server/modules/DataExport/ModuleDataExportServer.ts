import ModuleServerBase from '../ModuleServerBase';
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import PostAPIDefinition from '../../../shared/modules/API/vos/PostAPIDefinition';
import ExportDataToXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import ModuleDataExport from '../../../shared/modules/DataExport/ModuleDataExport';
import APIDefinition from '../../../shared/modules/API/vos/APIDefinition';

export default class ModuleDataExportServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataExportServer.instance) {
            ModuleDataExportServer.instance = new ModuleDataExportServer();
        }
        return ModuleDataExportServer.instance;
    }

    private static instance: ModuleDataExportServer = null;

    get actif(): boolean {
        return ModuleDataExport.getInstance().actif;
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataExport.APINAME_ExportDataToXLSXParamVO, this.exportDataToXLSX.bind(this));
    }

    private async exportDataToXLSX(params: ExportDataToXLSXParamVO): Promise<any> {

        if ((!params) || (!params.filename) || (!params.datas) || (!params.column_labels) || (!params.ordered_column_list)) {
            return null;
        }

        console.log('EXPORT : ' + params.filename);

        let worksheetColumns = [];
        let spreedsheetName: string = 'Data';

        for (let i in params.ordered_column_list) {
            worksheetColumns.push({ wch: 25 });
        }

        let workbook: WorkBook = XLSX.utils.book_new();

        let ws_data = [];
        let ws_row = [];
        for (let i in params.ordered_column_list) {
            let data_field_name: string = params.ordered_column_list[i];
            let title: string = params.column_labels[data_field_name];

            ws_row.push(title);
        }
        ws_data.push(ws_row);

        for (let r in params.datas) {
            let row_data = params.datas[r];
            let ws_row = [];

            for (let i in params.ordered_column_list) {
                let data_field_name: string = params.ordered_column_list[i];
                let data = row_data[data_field_name];

                ws_row.push(data);
            }
            ws_data.push(ws_row);
        }

        let ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(workbook, ws, "Datas");

        // /* Add the worksheet to the workbook */
        // XLSX.utils.book_append_sheet(workbook, ws, "Datas");
        //         {
        //     SheetNames: [spreedsheetName],
        //     Sheets: {
        //         [spreedsheetName]: {
        //             '!ref': 'A1:',
        //             '!cols': worksheetColumns
        //         }
        //     }
        // };

        // for (let i in params.ordered_column_list) {
        //     let data_field_name: string = params.ordered_column_list[i];
        //     let title: string = params.column_labels[data_field_name];

        //     workbook.Sheets[spreedsheetName][XLSX.utils.encode_cell({ c: parseInt(i.toString()), r: 0 })] = {
        //         t: "s",
        //         v: title,
        //         s: {
        //             font: {
        //                 bold: true
        //             }
        //         }
        //     };
        // }

        // for (let r in params.datas) {
        //     let row_data = params.datas[r];

        //     for (let i in params.ordered_column_list) {
        //         let data_field_name: string = params.ordered_column_list[i];
        //         let data = row_data[data_field_name];

        //         workbook.Sheets[spreedsheetName][XLSX.utils.encode_cell({ c: parseInt(i.toString()), r: parseInt(r.toString()) + 1 })] = {
        //             t: 's',
        //             v: data
        //         };
        //     }
        // }

        // return XLSX.write(workbook, { type: "buffer", bookType: 'xlsx' });
        // return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        let filepath: string = "temp/" + params.filename;
        XLSX.writeFile(workbook, filepath);
        return filepath;
    }
}