

import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../shared/tools/DateHandler';
import TextHandler from '../../../../shared/tools/TextHandler';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import ImportLogger from '../logger/ImportLogger';
import moment = require('moment');

const Fs = require('fs');
const CsvReadableStream = require('csv-reader');
const AutoDetectDecoderStream = require('autodetect-decoder-stream');

export default class ImportTypeCSVHandler {
    public static getInstance() {
        if (!ImportTypeCSVHandler.instance) {
            ImportTypeCSVHandler.instance = new ImportTypeCSVHandler();
        }
        return ImportTypeCSVHandler.instance;
    }

    protected static instance: ImportTypeCSVHandler = null;

    protected constructor() { }

    /**
     *
     * @param dataImportFormat
     * @param dataImportColumns
     * @param historic
     * @param muted Par défaut on mute cette fonction pour éviter de spammer des logs quand on test les différents formats....
     */
    public async importFile(dataImportFormat: DataImportFormatVO, dataImportColumns: DataImportColumnVO[], historic: DataImportHistoricVO, muted: boolean = true): Promise<IImportedData[]> {

        return new Promise(async (resolve, reject) => {
            let inputStream = await ImportTypeCSVHandler.getInstance().loadFile(historic, dataImportFormat, muted);

            if (!inputStream) {
                if (!muted) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger le document.', DataImportLogVO.LOG_LEVEL_ERROR);
                }
                resolve(null);
            }

            let raw_rows: any[] = [];
            inputStream
                .pipe(new CsvReadableStream({ parseNumbers: false, parseBooleans: false, trim: false, delimiter: ';' }))
                .on('data', function (row) {
                    /**
                     * On pourrait importer ligne par ligne et pas mettre tout le fichier en mémoire du coup ....
                     */
                    raw_rows.push(row);
                }).on('end', async function () {

                    let worsheet_datas: IImportedData[] = null;

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

                                let column_data_string: any = (raw_rows && raw_rows[row_index]) ? raw_rows[row_index][column_index] : null;

                                if (!!column_data_string) {
                                    let titre: string = ImportTypeCSVHandler.getInstance().getStringfromColumnDataString(column_data_string);

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
                                worsheet_datas = ImportTypeCSVHandler.getInstance().importRawsData(dataImportFormat, dataImportColumns, historic, raw_rows);
                            }
                            break;
                        case DataImportFormatVO.TYPE_COLUMN_POSITION_INDEX:
                        default:
                            worsheet_datas = ImportTypeCSVHandler.getInstance().importRawsData(dataImportFormat, dataImportColumns, historic, raw_rows);
                    }

                    resolve(worsheet_datas);
                });
        });
    }

    public async loadFile(importHistoric: DataImportHistoricVO, dataImportFormat: DataImportFormatVO, muted: boolean = true): Promise<any> {
        let fileVO: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, importHistoric.file_id);

        if ((!fileVO) || (!fileVO.path)) {
            if (!muted) {
                await ImportLogger.getInstance().log(importHistoric, dataImportFormat, "Aucun fichier à importer", DataImportLogVO.LOG_LEVEL_FATAL);
            }
            return null;
        }

        let inputStream = null;

        try {
            inputStream = Fs.createReadStream(fileVO.path)
                .pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' })); // If failed to guess encoding, default to 1255
            // if ((dataImportFormat.encoding === null) || (typeof dataImportFormat.encoding == 'undefined') || (dataImportFormat.encoding == DataImportFormatVO.TYPE_WINDOWS1252)) {
            //     inputStream = Fs.createReadStream(fileVO.path)
            //         .pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' })); // If failed to guess encoding, default to 1255
            // } else {
            //     // On tente d'ouvrir en UTF-8
            // ???inputStream = Fs.createReadStream(fileVO.path, { encoding: 'utf8' });
            // }
        } catch (error) {
            if (!muted) {
                ConsoleHandler.getInstance().error(error);
                await ImportLogger.getInstance().log(importHistoric, dataImportFormat, error, DataImportLogVO.LOG_LEVEL_ERROR);
            }
            return null;
        }

        return inputStream;
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

    public getStringfromColumnDataString(column_data_string: string): string {
        let res: string = null;

        if (!column_data_string) {
            return null;
        }

        res = column_data_string;

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

    public parseExcelDate(dateValue: string): number {
        let res: number = null;
        if (dateValue) {
            // it is a string, but it really represents a number and not a date
            if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
                return moment.unix(parseFloat(dateValue)).utc(true).unix();
            }
            // else assume a string representing a date
            // we use few allowed formats, but explicitly parse not strictly
            var formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY'];
            return moment(dateValue, formats, false).utc(true).unix();
        }
        return res;
    }

    private importRawsData(
        dataImportFormat: DataImportFormatVO,
        dataImportColumns: DataImportColumnVO[],
        historic: DataImportHistoricVO,
        raw_rows: any[]): IImportedData[] {
        let row_index: number = dataImportFormat.first_row_index;
        let last_row_has_data: boolean = true;
        let datas: IImportedData[] = [];

        let moduletable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[dataImportFormat.api_type_id];

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

                let column_data_string: string = (raw_rows && raw_rows[row_index]) ? raw_rows[row_index][column_index] : null;

                try {

                    if (column_data_string) {
                        last_row_has_data = true;

                        switch (dataImportColumn.type) {
                            case DataImportColumnVO.TYPE_DATE:
                                // let epoch: Moment = moment('1900-01-01');
                                // if (!!(((workbook.Workbook || {}).WBProps || {}).date1904)) {
                                //     epoch = moment('1904-01-01');
                                // }
                                // epoch.add(column_data_string.v, 'days');
                                // rowData[dataImportColumn.vo_field_name] = DateHandler.getInstance().formatDayForIndex(epoch);

                                switch (moduletable_field.field_type) {
                                    case ModuleTableField.FIELD_TYPE_tstz:
                                        rowData[dataImportColumn.vo_field_name] = ImportTypeCSVHandler.getInstance().parseExcelDate(column_data_string);
                                        break;
                                    default:
                                        rowData[dataImportColumn.vo_field_name] = DateHandler.getInstance().formatDayForIndex(ImportTypeCSVHandler.getInstance().parseExcelDate(column_data_string));
                                        break;
                                }
                                break;
                            case DataImportColumnVO.TYPE_NUMBER:
                            case DataImportColumnVO.TYPE_NUMBER_COMA_DECIMAL_CSV:
                                rowData[dataImportColumn.vo_field_name] = column_data_string.toString().replace(" ", "").replace(",", ".");

                                if (rowData[dataImportColumn.vo_field_name] && (rowData[dataImportColumn.vo_field_name] != '')) {
                                    rowData[dataImportColumn.vo_field_name] = parseFloat(rowData[dataImportColumn.vo_field_name].replace(" ", "")).toString();
                                }
                                break;
                            case DataImportColumnVO.TYPE_STRING:
                            default:
                                rowData[dataImportColumn.vo_field_name] = ImportTypeCSVHandler.getInstance().getStringfromColumnDataString(column_data_string);
                        }
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
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
}