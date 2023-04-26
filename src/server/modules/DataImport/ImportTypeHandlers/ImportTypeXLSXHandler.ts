

import XLSX from 'xlsx';
import { CellAddress, WorkBook, WorkSheet } from 'xlsx';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import { VOsTypesManager } from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../shared/tools/DateHandler';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import ImportLogger from '../logger/ImportLogger';
import TextHandler from '../../../../shared/tools/TextHandler';
import moment from 'moment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

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

        let workbook: WorkBook = await this.loadWorkbook(historic, dataImportFormat, muted);
        if (!workbook) {
            if (!muted) {
                await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger le document.', DataImportLogVO.LOG_LEVEL_ERROR);
            }
            return null;
        }

        /**
         * Le document est chargé, on commence à charger les datas ligne par ligne pour les intégrer en base.
         *   On stocke tout dans un objet de base, et on met le _type qui correspond à la définition de table créée
         *      artificiellement pour ce type d'import.
         */
        // Suivant le type de positionnement de l'onglet, on teste un onglet, ou on les teste tous
        let worksheet: WorkSheet;
        let scan_index: number = 0;
        switch (dataImportFormat.type_sheet_position) {
            case DataImportFormatVO.TYPE_SHEET_POSITION_SCAN:
                worksheet = await this.loadWorksheet_Index(historic, dataImportFormat, workbook, scan_index);
                break;
            case DataImportFormatVO.TYPE_SHEET_POSITION_LABEL:
                worksheet = await this.loadWorksheet_Label(historic, dataImportFormat, workbook);
                break;
            case DataImportFormatVO.TYPE_SHEET_POSITION_INDEX:
            default:
                worksheet = await this.loadWorksheet_Index(historic, dataImportFormat, workbook, dataImportFormat.sheet_index);
                break;
        }

        if ((dataImportFormat.type_sheet_position != DataImportFormatVO.TYPE_SHEET_POSITION_SCAN) && (!worksheet)) {
            if (!muted) {
                if ((!dataImportFormat.sheet_name) || (dataImportFormat.sheet_name == '')) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger l\'onglet numéro ' + (dataImportFormat.sheet_index + 1) + '.', DataImportLogVO.LOG_LEVEL_ERROR);
                } else {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger l\'onglet nommé "' + dataImportFormat.sheet_name + '".', DataImportLogVO.LOG_LEVEL_ERROR);
                }
            }
            return null;
        }
        if ((dataImportFormat.type_sheet_position == DataImportFormatVO.TYPE_SHEET_POSITION_SCAN) && (!worksheet)) {
            if (!muted) {
                await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de scanner les onglets. Aucun onglet trouvé dans le fichier.', DataImportLogVO.LOG_LEVEL_ERROR);
            }
            return null;
        }

        let worsheet_datas: IImportedData[] = null;
        while (!!worksheet) {

            worsheet_datas = null;
            if (dataImportFormat.type_sheet_position == DataImportFormatVO.TYPE_SHEET_POSITION_SCAN) {
                if (!muted) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'SCAN:Scan de l\'onglet numéro ' + (scan_index + 1) + '.', DataImportLogVO.LOG_LEVEL_INFO);
                }
            }

            // Suivant le type de positionnement des colonnes on fait l'import des datas
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

                        if (!!column_data_string) {
                            let titre: string = this.getStringfromColumnDataString(column_data_string);

                            if ((!!titre) && (TypesHandler.getInstance().isString(titre))) {
                                titre = titre.trim();

                                //on ignore les retours à la ligne
                                titre = titre.replace(/\n/ig, '');
                                titre = titre.replace(/\r/ig, '');

                                for (let i in dataImportColumns) {
                                    let dataImportColumn = dataImportColumns[i];

                                    let titre_standard = TextHandler.getInstance().standardize_for_comparaison(titre);
                                    let found: boolean = (dataImportColumn.title && (TextHandler.getInstance().standardize_for_comparaison(dataImportColumn.title) == titre_standard));

                                    if (!found) {
                                        for (let other_column_labels_i in dataImportColumn.other_column_labels) {
                                            let other_column_label: string = dataImportColumn.other_column_labels[other_column_labels_i];

                                            if (other_column_label && (TextHandler.getInstance().standardize_for_comparaison(other_column_label) == titre_standard)) {
                                                found = true;
                                                break;
                                            }
                                        }
                                    }

                                    if (found) {

                                        if (dataImportColumn.column_index != null) {
                                            if (!muted) {
                                                await ImportLogger.getInstance().log(historic, dataImportFormat, 'Ce titre de colonne existe en double :' + dataImportColumn.title + '.', DataImportLogVO.LOG_LEVEL_WARN);
                                            }
                                            break;
                                        }
                                        dataImportColumn.column_index = column_index;
                                        break;
                                    }
                                }
                            }
                        }

                        column_index++;

                        empty_columns = column_data_string ? 0 : (empty_columns + 1);
                    }

                    let misses_mandatory_columns: boolean = false;
                    for (let i in dataImportColumns) {
                        if ((dataImportColumns[i].column_index === null) && (dataImportColumns[i].mandatory)) {

                            // On est dans un cas bien particulier, a priori on aura pas 50 types d'imports par nom de colonnes sur un type de fichier
                            //  donc on doit remonter l'info des colonnes obligatoires que l'on ne trouve pas
                            await ImportLogger.getInstance().log(historic, dataImportFormat, "Format :" + dataImportFormat.import_uid + ": Colonne obligatoire manquante :" + dataImportColumns[i].title + ": Ce format ne sera pas retenu.", DataImportLogVO.LOG_LEVEL_WARN);

                            misses_mandatory_columns = true;
                            break;
                        }
                    }

                    if (misses_mandatory_columns) {
                        worsheet_datas = null;
                    } else {
                        worsheet_datas = this.importRawsData(dataImportFormat, dataImportColumns, historic, workbook, worksheet);
                    }
                    break;
                case DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX:
                default:
                    worsheet_datas = this.importRawsData(dataImportFormat, dataImportColumns, historic, workbook, worksheet);
            }

            if ((!!worsheet_datas) && (worsheet_datas.length > 0)) {

                if (dataImportFormat.type_sheet_position == DataImportFormatVO.TYPE_SHEET_POSITION_SCAN) {
                    if (!muted) {
                        await ImportLogger.getInstance().log(historic, dataImportFormat, 'SCAN:Datas trouvées dans l\'onglet numéro ' + (scan_index + 1) + '.', DataImportLogVO.LOG_LEVEL_INFO);
                    }
                }

                return worsheet_datas;
            }

            if (dataImportFormat.type_sheet_position == DataImportFormatVO.TYPE_SHEET_POSITION_SCAN) {
                if (!muted) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'SCAN:Aucune data trouvée dans l\'onglet numéro ' + (scan_index + 1) + '.', DataImportLogVO.LOG_LEVEL_WARN);
                }
            }

            switch (dataImportFormat.type_sheet_position) {
                case DataImportFormatVO.TYPE_SHEET_POSITION_SCAN:
                    scan_index++;
                    worksheet = await this.loadWorksheet_Index(historic, dataImportFormat, workbook, scan_index);
                    break;
                case DataImportFormatVO.TYPE_SHEET_POSITION_LABEL:
                case DataImportFormatVO.TYPE_SHEET_POSITION_INDEX:
                default:
                    worksheet = null;
                    break;
            }
        }

        return worsheet_datas;
    }

    /**
     * TODO FIXME ASAP TU
     */
    public getMomentFromXLSDateString(column_data_string: any): number {
        if (!column_data_string) {
            return null;
        }

        if (/^[0-9][0-9][/][0-9][0-9][/][0-9][0-9][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'DD/MM/YYYY').utc(true).unix();
        }
        if (/^[0-9][/][0-9][0-9][/][0-9][0-9][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'D/MM/YYYY').utc(true).unix();
        }
        if (/^[0-9][0-9][/][0-9][/][0-9][0-9][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'DD/M/YYYY').utc(true).unix();
        }
        if (/^[0-9][/][0-9][/][0-9][0-9][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'D/M/YYYY').utc(true).unix();
        }

        if (/^[0-9][0-9][/][0-9][0-9][/][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'DD/MM/YY').utc(true).unix();
        }
        if (/^[0-9][/][0-9][0-9][/][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'D/MM/YY').utc(true).unix();
        }
        if (/^[0-9][0-9][/][0-9][/][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'DD/M/YY').utc(true).unix();
        }
        if (/^[0-9][/][0-9][/][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'D/M/YY').utc(true).unix();
        }


        if (/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YYYY-MM-DD').utc(true).unix();
        }
        if (/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YYYY-MM-D').utc(true).unix();
        }
        if (/^[0-9][0-9][0-9][0-9]-[0-9]-[0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YYYY-M-DD').utc(true).unix();
        }
        if (/^[0-9][0-9][0-9][0-9]-[0-9]-[0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YYYY-M-D').utc(true).unix();
        }

        if (/^[0-9][0-9]-[0-9][0-9]-[0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YY-MM-DD').utc(true).unix();
        }
        if (/^[0-9][0-9]-[0-9][0-9]-[0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YY-MM-D').utc(true).unix();
        }
        if (/^[0-9][0-9]-[0-9]-[0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YY-M-DD').utc(true).unix();
        }
        if (/^[0-9][0-9]-[0-9]-[0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YY-M-D').utc(true).unix();
        }

        if (/^[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YYYYMMDD').utc(true).unix();
        }
        if (/^[0-9][0-9][0-9][0-9][0-9][0-9]( +.*[0-9]+:[0-9]+(:[0-9]+)?.*)?$/.test(column_data_string)) {
            return moment(column_data_string, 'YYMMDD').utc(true).unix();
        }

        if (moment(column_data_string).utc(true).isValid()) {
            return moment(column_data_string).utc(true).unix();
        }

        return null;
    }

    public getStringfromColumnDataString(column_data_string: any): string {
        let res: string = null;

        if (!column_data_string) {
            return null;
        }

        if (column_data_string.h && column_data_string.h != "") {
            res = column_data_string.h;
        } else if (column_data_string.w && column_data_string.w != "") {
            res = column_data_string.w;
        } else if (column_data_string.v && column_data_string.v != "") {
            res = column_data_string.v;
        }

        if (res) {

            if (!res.replace) {
                /**
                 * Très probablement un nombre au lieu d'une string
                 */
                res = '' + res;
            }

            res = res.replace(/&apos;/ig, "'");
            res = res.replace(/&quot;/ig, '"');
            res = res.replace(/&lt;/ig, '<');
            res = res.replace(/&gt;/ig, '>');
            res = res.replace(/&amp;/ig, '&');

            // a priori "" ça veut dire escape de "
            res = res.replace(/""/ig, '"');

            res = res.replace(/&#x000d;<br\/>/ig, "\n");

        }

        return res;
    }

    public parseExcelDate(dateValue, wbProps): number {
        if (dateValue) {
            // it is a string, but it really represents a number and not a date
            if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
                dateValue = parseFloat(dateValue);
            }
            if (typeof dateValue === 'number') {
                var dt = XLSX.SSF.parse_date_code(dateValue, { date1904: (wbProps && wbProps.date1904 === '1') });
                // new Date(2015, 9, 18);  // 18th October(!) 2015 in @JavaScript
                var monthToJs = dt.m - 1;
                return moment(new Date(dt.y, monthToJs, dt.d)).utc(true).unix();
            }
            // else assume a string representing a date
            // we use few allowed formats, but explicitly parse not strictly
            var formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY'];
            return moment(dateValue, formats, false).utc(true).unix();
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

        let moduletable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[dataImportFormat.api_type_id];

        while (last_row_has_data) {
            last_row_has_data = false;

            let rowData: IImportedData = {
                _type: ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(dataImportFormat.api_type_id),
                importation_state: ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT,
                not_validated_msg: null,
                not_imported_msg: null,
                not_posttreated_msg: null,
                creation_date: Dates.now(),
                historic_id: historic.id,
                imported_line_number: row_index
            } as any;

            for (let i in dataImportColumns) {
                let dataImportColumn: DataImportColumnVO = dataImportColumns[i];

                if (dataImportColumn.column_index == null) {
                    continue;
                }

                let moduletable_field = moduletable.getFieldFromId(dataImportColumn.vo_field_name);

                if (!moduletable_field) {
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

                                switch (moduletable_field.field_type) {
                                    case ModuleTableField.FIELD_TYPE_tstz:
                                        rowData[dataImportColumn.vo_field_name] = this.parseExcelDate(column_data_string.v, (workbook.Workbook || {}).WBProps);
                                        break;
                                    default:
                                        rowData[dataImportColumn.vo_field_name] = DateHandler.getInstance().formatDayForIndex(this.parseExcelDate(column_data_string.v, (workbook.Workbook || {}).WBProps));
                                        break;
                                }
                                break;
                            case DataImportColumnVO.TYPE_NUMBER:
                                if (column_data_string.h && column_data_string.h != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.h.toString().replace(" ", "").replace(",", ".");
                                } else if (column_data_string.t == 'n' && column_data_string.v && column_data_string.v != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.v.toString().replace(" ", "").replace(",", ".");
                                } else if (column_data_string.v && column_data_string.v != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.v.toString().replace(" ", "").replace(",", ".");
                                } else if (column_data_string.w && column_data_string.w != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.w.toString().replace(" ", "").replace(",", ".");
                                }

                                if (rowData[dataImportColumn.vo_field_name] && rowData[dataImportColumn.vo_field_name] != '') {
                                    rowData[dataImportColumn.vo_field_name] = parseFloat(rowData[dataImportColumn.vo_field_name].replace(" ", "")).toString();
                                }
                                break;
                            case DataImportColumnVO.TYPE_NUMBER_COMA_DECIMAL_CSV:
                                if (column_data_string.h && column_data_string.h != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.h.toString().replace(" ", "").replace(",", ".");
                                } else if (column_data_string.w && column_data_string.w != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.w.toString().replace(" ", "").replace(",", ".");
                                } else if (column_data_string.v && column_data_string.v != "") {
                                    rowData[dataImportColumn.vo_field_name] = column_data_string.v.toString().replace(" ", "").replace(",", ".");
                                }

                                if (rowData[dataImportColumn.vo_field_name] && rowData[dataImportColumn.vo_field_name] != '') {
                                    rowData[dataImportColumn.vo_field_name] = parseFloat(rowData[dataImportColumn.vo_field_name].replace(" ", "")).toString();
                                }
                                break;
                            case DataImportColumnVO.TYPE_STRING:
                            default:
                                rowData[dataImportColumn.vo_field_name] = this.getStringfromColumnDataString(column_data_string);
                        }
                    }
                } catch (error) {
                    ConsoleHandler.error(error);
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

    private async loadWorkbook(importHistoric: DataImportHistoricVO, dataImportFormat: DataImportFormatVO, muted: boolean = true): Promise<WorkBook> {
        let workbook: WorkBook = null;
        let fileVO: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(importHistoric.file_id).select_vo<FileVO>();

        if ((!fileVO) || (!fileVO.path)) {
            if (!muted) {
                await ImportLogger.getInstance().log(importHistoric, dataImportFormat, "Aucun fichier à importer", DataImportLogVO.LOG_LEVEL_FATAL);
            }
            return null;
        }

        try {
            if ((dataImportFormat.encoding === null) || (typeof dataImportFormat.encoding == 'undefined') || (dataImportFormat.encoding == DataImportFormatVO.TYPE_WINDOWS1252)) {
                workbook = XLSX.readFile(fileVO.path);
            } else {
                // On tente d'ouvrir en UTF-8
                workbook = XLSX.readFile(fileVO.path, { codepage: 65001 });
            }
        } catch (error) {
            if (!muted) {
                ConsoleHandler.error(error);
                await ImportLogger.getInstance().log(importHistoric, dataImportFormat, error, DataImportLogVO.LOG_LEVEL_ERROR);
            }
            return null;
        }

        return workbook;
    }

    private async loadWorksheet_Index(historic: DataImportHistoricVO, dataImportFormat: DataImportFormatVO, workbook: WorkBook, index: number): Promise<WorkSheet> {

        let worksheet: WorkSheet = null;

        try {
            let sheet_name: string = workbook.SheetNames[index];
            worksheet = workbook.Sheets[sheet_name];
        } catch (error) {
            ConsoleHandler.error(error);
            await ImportLogger.getInstance().log(historic, dataImportFormat, error, DataImportLogVO.LOG_LEVEL_ERROR);
        }

        return worksheet;
    }

    private async loadWorksheet_Label(historic: DataImportHistoricVO, dataImportFormat: DataImportFormatVO, workbook: WorkBook): Promise<WorkSheet> {

        let worksheet: WorkSheet = null;

        try {
            let sheet_name: string = dataImportFormat.sheet_name;
            worksheet = workbook.Sheets[sheet_name];
        } catch (error) {
            ConsoleHandler.error(error);
            await ImportLogger.getInstance().log(historic, dataImportFormat, error, DataImportLogVO.LOG_LEVEL_ERROR);
        }

        return worksheet;
    }
}