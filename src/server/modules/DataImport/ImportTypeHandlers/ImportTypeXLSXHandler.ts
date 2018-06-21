import * as XLSX from 'xlsx';
import { WorkBook, WorkSheet, CellAddress } from 'xlsx';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import IImportData from '../../../../shared/modules/DataImport/interfaces/IImportData';
import { File } from 'formidable';
import DataImportFileVO from '../../../../shared/modules/DataImport/vos/DataImportFileVO';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import { Moment } from 'moment';
import * as moment from 'moment';
import DateHandler from '../../../../shared/tools/DateHandler';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import ImportLogger from '../logger/ImportLogger';
import ModuleServiceBase from '../../ModuleServiceBase';

export default class ImportTypeXLSXHandler {
    public static getInstance() {
        if (!ImportTypeXLSXHandler.instance) {
            ImportTypeXLSXHandler.instance = new ImportTypeXLSXHandler();
        }
        return ImportTypeXLSXHandler.instance;
    }

    protected static instance: ImportTypeXLSXHandler = null;

    protected constructor() { }

    public async importFile(
        dataImportFile: DataImportFileVO, dataImportColumns: DataImportColumnVO[], historic: DataImportHistoricVO,
        import_name: string, import_file: File, imported_data_target_date: Moment): Promise<IImportData[]> {

        let workbook: WorkBook = this.loadWorkbook(historic, import_name, import_file);
        if (!workbook) {
            ImportLogger.getInstance().log(historic, 'Impossible de charger le workbook', DataImportLogVO.LOG_LEVEL_50_ERROR);
            return null;
        }

        /**
         * Le document est chargé, on commence à charger les datas ligne par ligne pour les intégrer en base.
         *   On stocke tout dans un objet de base, et on met le _type qui correspond à la définition de table créée
         *      artificiellement pour ce type d'import.
         */
        let worksheet: WorkSheet = this.loadWorksheet(historic, import_name, dataImportFile, workbook);
        if (!worksheet) {
            ImportLogger.getInstance().log(historic, 'Impossible de charger le worksheet', DataImportLogVO.LOG_LEVEL_50_ERROR);
            return null;
        }

        let row_index: number = dataImportFile.first_row_index;
        let last_row_has_data: boolean = true;
        let datas: IImportData[] = [];

        while (last_row_has_data) {
            last_row_has_data = false;

            let rowData: IImportData = {
                imported_data_on_date: DateHandler.getInstance().formatDayForIndex(moment()),
                imported_data_target_date: DateHandler.getInstance().formatDayForIndex(moment(imported_data_target_date))
            };

            for (let i in dataImportColumns) {
                let dataImportColumn: DataImportColumnVO = dataImportColumns[i];

                let column_index: number = dataImportColumn.column_index;
                let cell_address: CellAddress = { c: column_index, r: row_index };

                let column_data_string: any = worksheet[XLSX.utils.encode_cell(cell_address)];

                if (column_data_string) {
                    last_row_has_data = true;

                    switch (dataImportColumn.type) {
                        case DataImportColumnVO.TYPE_DATE:
                            let epoch: Moment = moment('1900-01-01');
                            if (!!(((workbook.Workbook || {}).WBProps || {}).date1904)) {
                                epoch = moment('1904-01-01');
                            }
                            epoch.add(column_data_string.v, 'days');
                            rowData[dataImportColumn.name] = DateHandler.getInstance().formatDayForIndex(epoch);
                            break;
                        case DataImportColumnVO.TYPE_NUMBER:
                            if (column_data_string.h && column_data_string.h != "") {
                                rowData[dataImportColumn.name] = column_data_string.h.toString().replace(" ", "").replace(",", ".");
                            } else if (column_data_string.v && column_data_string.v != "") {
                                rowData[dataImportColumn.name] = column_data_string.v.toString().replace(" ", "").replace(",", ".");
                            } else if (column_data_string.w && column_data_string.w != "") {
                                rowData[dataImportColumn.name] = column_data_string.w.toString().replace(" ", "").replace(",", ".");
                            }
                            break;
                        case DataImportColumnVO.TYPE_STRING:
                        default:
                            if (column_data_string.h && column_data_string.h != "") {
                                rowData[dataImportColumn.name] = column_data_string.h;
                            } else if (column_data_string.w && column_data_string.w != "") {
                                rowData[dataImportColumn.name] = column_data_string.w;
                            } else if (column_data_string.v && column_data_string.v != "") {
                                rowData[dataImportColumn.name] = column_data_string.v;
                            }
                    }
                }
            }

            if (last_row_has_data) {
                datas.push(rowData);
            }

            row_index++;
        }

        try {
            await this.insertImportedDatasInDb(datas, dataImportFile, dataImportColumns, historic, import_name, import_file);
        } catch (error) {
            ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_50_ERROR);
            return null;
        }
        return datas;
    }

    private async insertImportedDatasInDb(
        vos: IImportData[], dataImportFile: DataImportFileVO, dataImportColumns: DataImportColumnVO[],
        historic: DataImportHistoricVO, import_name: string, import_file: File): Promise<any[]> {

        // Avant de remplir la base, on la vide.
        await ModuleServiceBase.getInstance().db.none("TRUNCATE " + dataImportFile.datatable_fullname + ";");

        let results: any[] = await ModuleServiceBase.getInstance().db.tx((t) => {

            let queries: any[] = [];

            for (let i in vos) {
                let vo: any = vos[i];
                let sql;

                const tableFields = [];
                const placeHolders = [];
                let hasFields: boolean = false;
                for (const f in dataImportColumns) {

                    if (typeof vo[dataImportColumns[f].name] != "undefined") {

                        hasFields = true;
                        tableFields.push(dataImportColumns[f].name);
                        placeHolders.push('${' + dataImportColumns[f].name + '}');
                    }
                }

                if (!hasFields) {
                    continue;
                }

                // Add dates fields
                tableFields.push("imported_data_on_date");
                placeHolders.push('${imported_data_on_date}');

                tableFields.push("imported_data_target_date");
                placeHolders.push('${imported_data_target_date}');

                sql = "INSERT INTO " + dataImportFile.datatable_fullname + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";

                queries.push(t.one(sql, vo));
            }

            return t.batch(queries);
        });

        return results;
    }

    private loadWorkbook(historic: DataImportHistoricVO, import_name: string, import_file: File): WorkBook {
        let workbook: WorkBook = null;

        try {
            workbook = XLSX.readFile(import_file.path);
        } catch (error) {
            console.error(error);
            ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_50_ERROR);
        }

        return workbook;
    }

    private loadWorksheet(historic: DataImportHistoricVO, import_name: string, dataImportFile: DataImportFileVO, workbook: WorkBook): WorkSheet {

        let worksheet: WorkSheet = null;

        try {
            let sheet_name: string = dataImportFile.sheet_name;
            if ((!sheet_name) || (sheet_name == '')) {
                sheet_name = workbook.SheetNames[dataImportFile.sheet_index];
            }
            worksheet = workbook.Sheets[sheet_name];
        } catch (error) {
            console.error(error);
            ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_50_ERROR);
        }

        return worksheet;
    }
}