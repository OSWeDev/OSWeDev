import * as moment from 'moment';
import { Moment } from 'moment';
import * as XLSX from 'xlsx';
import { CellAddress, WorkBook, WorkSheet } from 'xlsx';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import DateHandler from '../../../../shared/tools/DateHandler';
import ImportLogger from '../logger/ImportLogger';

export default class ImportTypeXLSXHandler {
    public static getInstance() {
        if (!ImportTypeXLSXHandler.instance) {
            ImportTypeXLSXHandler.instance = new ImportTypeXLSXHandler();
        }
        return ImportTypeXLSXHandler.instance;
    }

    protected static instance: ImportTypeXLSXHandler = null;

    protected constructor() { }

    /**
     * 
     * @param dataImportFormat 
     * @param dataImportColumns 
     * @param historic 
     * @param muted Par défaut on mute cette fonction pour éviter de spammer des logs quand on test les différents formats....
     */
    public async importFile(dataImportFormat: DataImportFormatVO, dataImportColumns: DataImportColumnVO[], historic: DataImportHistoricVO, muted: boolean = true): Promise<IImportedData[]> {

        let workbook: WorkBook = await this.loadWorkbook(historic, muted);
        if (!workbook) {
            if (!muted) {
                ImportLogger.getInstance().log(historic, 'Impossible de charger le workbook', DataImportLogVO.LOG_LEVEL_ERROR);
            }
            return null;
        }

        /**
         * Le document est chargé, on commence à charger les datas ligne par ligne pour les intégrer en base.
         *   On stocke tout dans un objet de base, et on met le _type qui correspond à la définition de table créée
         *      artificiellement pour ce type d'import.
         */
        let worksheet: WorkSheet = this.loadWorksheet(historic, dataImportFormat, workbook);
        if (!worksheet) {
            if (!muted) {
                ImportLogger.getInstance().log(historic, 'Impossible de charger le worksheet', DataImportLogVO.LOG_LEVEL_ERROR);
            }
            return null;
        }

        // Suivant le type de positionnement des colonnes on fait l'imort des datas
        switch (dataImportFormat.type_column_position) {
            case DataImportFormatVO.TYPE_COLUMN_POSITION_LABEL:

                // On cherche à retrouver les colonnes par le nom sur la ligne des titres de colonnes
                let row_index: number = dataImportFormat.column_labels_row_index;
                let column_index: number = 0;

                for (let i in dataImportColumns) {
                    dataImportColumns[i].column_index = null;
                }

                // on arrête si on voit qu'il y a 10 cases vides de suite.
                // a voir comment améliorer ce système...
                let empty_columns: number = 0;
                while (empty_columns < 10) {

                    let cell_address: CellAddress = { c: column_index, r: row_index };
                    let column_data_string: any = worksheet[XLSX.utils.encode_cell(cell_address)];

                    if (column_data_string) {
                        let titre: string = this.getStringfromColumnDataString(column_data_string);

                        if (titre) {
                            for (let i in dataImportColumns) {
                                if (dataImportColumns[i].title && (dataImportColumns[i].title.toLowerCase() == titre.toLowerCase())) {
                                    dataImportColumns[i].column_index = column_index;
                                    break;
                                }
                            }
                        }
                    }

                    column_index++;

                    empty_columns = column_data_string ? 0 : (empty_columns + 1);
                }

                for (let i in dataImportColumns) {
                    if ((dataImportColumns[i].column_index == null) && (dataImportColumns[i].mandatory)) {
                        return null;
                    }
                }

                return this.importRawsData(dataImportFormat, dataImportColumns, historic, workbook, worksheet);
                break;
            case DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX:
            default:
                return this.importRawsData(dataImportFormat, dataImportColumns, historic, workbook, worksheet);
        }

    }

    private getStringfromColumnDataString(column_data_string: any): string {
        if (column_data_string.h && column_data_string.h != "") {
            return column_data_string.h;
        } else if (column_data_string.w && column_data_string.w != "") {
            return column_data_string.w;
        } else if (column_data_string.v && column_data_string.v != "") {
            return column_data_string.v;
        }
        return null;
    }

    private importRawsData(
        dataImportFormat: DataImportFormatVO,
        dataImportColumns: DataImportColumnVO[],
        historic: DataImportHistoricVO,
        workbook: WorkBook,
        worksheet: WorkSheet): IImportedData[] {
        let row_index: number = dataImportFormat.first_row_index;
        let last_row_has_data: boolean = true;
        let datas: IImportedData[] = [];

        while (last_row_has_data) {
            last_row_has_data = false;

            let rowData: IImportedData = {
                _type: ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(dataImportFormat.api_type_id),
                importation_state: ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                not_validated_msg: null,
                not_imported_msg: null,
                not_posttreated_msg: null,
                creation_date: DateHandler.getInstance().formatDateTimeForBDD(moment()),
                historic_id: historic.id
            } as any;

            for (let i in dataImportColumns) {
                let dataImportColumn: DataImportColumnVO = dataImportColumns[i];

                if (dataImportColumn.column_index == null) {
                    continue;
                }

                let column_index: number = dataImportColumn.column_index;
                let cell_address: CellAddress = { c: column_index, r: row_index };

                let column_data_string: any = worksheet[XLSX.utils.encode_cell(cell_address)];

                try {

                    if (column_data_string) {
                        last_row_has_data = true;

                        switch (dataImportColumn.type) {
                            case DataImportColumnVO.TYPE_DATE:
                                let epoch: Moment = moment('1900-01-01');
                                if (!!(((workbook.Workbook || {}).WBProps || {}).date1904)) {
                                    epoch = moment('1904-01-01');
                                }
                                epoch.add(column_data_string.v, 'days');
                                rowData[dataImportColumn.vo_field_name] = DateHandler.getInstance().formatDayForIndex(epoch);
                                break;
                            case DataImportColumnVO.TYPE_NUMBER:
                                if (column_data_string.h && column_data_string.h != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.h.toString().replace(" ", "").replace(",", ".");
                                } else if (column_data_string.v && column_data_string.v != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.v.toString().replace(" ", "").replace(",", ".");
                                } else if (column_data_string.w && column_data_string.w != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.w.toString().replace(" ", "").replace(",", ".");
                                }
                                break;
                            case DataImportColumnVO.TYPE_STRING:
                            default:
                                rowData[dataImportColumn.vo_field_name] = this.getStringfromColumnDataString(column_data_string);
                        }
                    }
                } catch (error) {
                    rowData.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                    rowData.not_validated_msg = (rowData.not_validated_msg ? rowData.not_validated_msg + ', ' : '') + "Column error:" + dataImportColumn.title;
                }
            }

            if (last_row_has_data) {
                datas.push(rowData);
            }

            row_index++;
        }

        return datas;
    }

    private async loadWorkbook(importHistoric: DataImportHistoricVO, muted: boolean = true): Promise<WorkBook> {
        let workbook: WorkBook = null;
        let fileVO: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, importHistoric.file_id);

        if ((!fileVO) || (!fileVO.path)) {
            if (!muted) {
                await ImportLogger.getInstance().log(importHistoric, "Aucun fichier à importer", DataImportLogVO.LOG_LEVEL_FATAL);
            }
            return null;
        }

        try {
            workbook = XLSX.readFile(fileVO.path);
        } catch (error) {
            if (!muted) {
                console.error(error);
                ImportLogger.getInstance().log(importHistoric, error, DataImportLogVO.LOG_LEVEL_ERROR);
            }
            return null;
        }

        return workbook;
    }

    private loadWorksheet(historic: DataImportHistoricVO, dataImportFile: DataImportFormatVO, workbook: WorkBook): WorkSheet {

        let worksheet: WorkSheet = null;

        try {
            let sheet_name: string = dataImportFile.sheet_name;
            if ((!sheet_name) || (sheet_name == '')) {
                sheet_name = workbook.SheetNames[dataImportFile.sheet_index];
            }
            worksheet = workbook.Sheets[sheet_name];
        } catch (error) {
            console.error(error);
            ImportLogger.getInstance().log(historic, error, DataImportLogVO.LOG_LEVEL_ERROR);
        }

        return worksheet;
    }
}