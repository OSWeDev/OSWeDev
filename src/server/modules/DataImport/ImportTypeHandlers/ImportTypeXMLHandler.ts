

import { readFileSync } from 'fs';
import ModuleDAOServer from '../../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IImportedData from '../../../../shared/modules/DataImport/interfaces/IImportedData';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportColumnVO from '../../../../shared/modules/DataImport/vos/DataImportColumnVO';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import XmlNode from '../../../../shared/modules/DataImport/vos/XmlNode';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleTable from '../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../shared/tools/DateHandler';
import FileHandler from '../../../../shared/tools/FileHandler';
import ImportLogger from '../logger/ImportLogger';
import moment = require('moment');
const XmlReader = require('xml-reader');
const he = require('he');

export default class ImportTypeXMLHandler {
    public static getInstance() {
        if (!ImportTypeXMLHandler.instance) {
            ImportTypeXMLHandler.instance = new ImportTypeXMLHandler();
        }
        return ImportTypeXMLHandler.instance;
    }

    protected static instance: ImportTypeXMLHandler = null;

    protected constructor() { }

    /**
     * @param dataImportFormat
     * @param dataImportColumns
     * @param historic
     * @param muted Par défaut on mute cette fonction pour éviter de spammer des logs quand on test les différents formats....
     */
    public async importFile(dataImportFormat: DataImportFormatVO, dataImportColumns: DataImportColumnVO[], historic: DataImportHistoricVO, muted: boolean = true): Promise<IImportedData[]> {

        return new Promise(async (resolve, reject) => {
            let xml_string: string = await ImportTypeXMLHandler.getInstance().loadFile(historic, dataImportFormat, async (err) => {
                if ((!muted) && !historic.use_fast_track) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger le document.', DataImportLogVO.LOG_LEVEL_ERROR);
                }
                resolve(null);
                return;
            }, muted);

            if (!xml_string) {
                if ((!muted) && !historic.use_fast_track) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger le document.', DataImportLogVO.LOG_LEVEL_ERROR);
                }
                resolve(null);
                return;
            }

            let res: XmlNode = XmlReader.parseSync(xml_string);

            resolve(ImportTypeXMLHandler.getInstance().importRawsData(dataImportFormat, dataImportColumns, historic, res));
        });
    }

    /**
     * @param dataImportFormat
     * @param dataImportColumns
     * @param historic
     * @param muted Par défaut on mute cette fonction pour éviter de spammer des logs quand on test les différents formats....
     */
    public async importFileBatchMode(dataImportFormat: DataImportFormatVO, dataImportColumns: DataImportColumnVO[], historic: DataImportHistoricVO, muted: boolean = true): Promise<boolean> {

        return new Promise(async (resolve, reject) => {
            let xml_string: string = await ImportTypeXMLHandler.getInstance().loadFile(historic, dataImportFormat, async (err) => {
                if (!muted) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger le document.', DataImportLogVO.LOG_LEVEL_ERROR);
                }
                resolve(null);
                return;
            }, muted);

            if (!xml_string) {
                if (!muted) {
                    await ImportLogger.getInstance().log(historic, dataImportFormat, 'Impossible de charger le document.', DataImportLogVO.LOG_LEVEL_ERROR);
                }
                resolve(null);
                return;
            }

            let res: XmlNode = XmlReader.parseSync(xml_string);

            let datas: IImportedData[] = ImportTypeXMLHandler.getInstance().importRawsData(dataImportFormat, dataImportColumns, historic, res);

            if (dataImportFormat.use_multiple_connections) {
                await ModuleDAOServer.getInstance().insertOrUpdateVOsMulticonnections(
                    datas
                );
            } else {
                await ModuleDAO.getInstance().insertOrUpdateVOs(datas);
            }

            resolve(true);
        });
    }

    public async loadFile(importHistoric: DataImportHistoricVO, dataImportFormat: DataImportFormatVO, error_handler: (err) => void, muted: boolean = true): Promise<string> {

        return new Promise(async (resolve, reject) => {

            let fileVO: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(importHistoric.file_id).select_vo<FileVO>();

            if ((!fileVO) || (!fileVO.path)) {
                if (!muted) {
                    await ImportLogger.getInstance().log(importHistoric, dataImportFormat, "Aucun fichier à importer", DataImportLogVO.LOG_LEVEL_FATAL);
                }
                resolve(null);
                return;
            }

            /**
             * On test le cas fichier vide :
             */
            let file_size = fileVO ? FileHandler.getInstance().get_file_size(fileVO.path) : null;
            if (!file_size) {
                if ((!!importHistoric) && (!!importHistoric.id)) {
                    resolve(null);
                    return;
                }
            }

            try {
                resolve(readFileSync(fileVO.path, "utf8"));
                return;
            } catch (error) {
                if (!muted) {
                    ConsoleHandler.error(error);
                    await ImportLogger.getInstance().log(importHistoric, dataImportFormat, error, DataImportLogVO.LOG_LEVEL_ERROR);
                }
                resolve(null);
                return;
            }
        });
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

            res = he.decode(res);
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
        xml_datas: XmlNode
    ): IImportedData[] {
        let datas: IImportedData[] = [];
        let row_index: number = 1;

        let moduletable: ModuleTable<any> = VOsTypesManager.moduleTables_by_voType[dataImportFormat.api_type_id];

        if (!xml_datas || !xml_datas.children || !xml_datas.children.length) {
            return null;
        }

        for (let i in xml_datas.children) {
            let child: XmlNode = xml_datas.children[i];

            if (child.name == "rs:data") {
                for (let j in child.children) {
                    let data: XmlNode = child.children[j];

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

                    let has_data: boolean = ImportTypeXMLHandler.getInstance().populate_row_data(data.attributes, rowData, dataImportColumns, moduletable);

                    if (has_data) {
                        datas.push(rowData);
                    }

                    row_index++;
                }
            }
        }

        return datas;
    }

    private populate_row_data(raw_row_data: { [name: string]: string }, rowData: IImportedData, dataImportColumns: DataImportColumnVO[], moduletable: ModuleTable<any>): boolean {

        let last_row_has_data = false;

        let raw_data: { [name: string]: string } = {};

        for (let row_name in raw_row_data) {
            raw_data[row_name.toLowerCase()] = raw_row_data[row_name];
        }

        for (let i in dataImportColumns) {
            let dataImportColumn: DataImportColumnVO = dataImportColumns[i];

            let moduletable_field = moduletable.getFieldFromId(dataImportColumn.vo_field_name);

            if (!moduletable_field) {
                continue;
            }

            let column_data_string: string = raw_data ? raw_data[dataImportColumn.vo_field_name.toLowerCase()] : null;

            try {

                if (column_data_string) {
                    last_row_has_data = true;

                    switch (dataImportColumn.type) {
                        case DataImportColumnVO.TYPE_DATE:

                            switch (moduletable_field.field_type) {
                                case ModuleTableField.FIELD_TYPE_tstz:
                                    rowData[dataImportColumn.vo_field_name] = ImportTypeXMLHandler.getInstance().parseExcelDate(column_data_string);
                                    break;
                                default:
                                    rowData[dataImportColumn.vo_field_name] = DateHandler.getInstance().formatDayForIndex(ImportTypeXMLHandler.getInstance().parseExcelDate(column_data_string));
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
                            rowData[dataImportColumn.vo_field_name] = ImportTypeXMLHandler.getInstance().getStringfromColumnDataString(column_data_string);
                    }
                } else if (dataImportColumn.mandatory) {
                    // Si la colonne est obligatoire et qu'on a pas la donnée
                    last_row_has_data = true;
                    rowData.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                    rowData.not_validated_msg = "Champ obligatoire manquant : Column error:" + dataImportColumn.title;
                }
            } catch (error) {
                ConsoleHandler.error(error);
                rowData.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                rowData.not_validated_msg = (rowData.not_validated_msg ? rowData.not_validated_msg + ', ' : '') + "Column error:" + dataImportColumn.title;
            }
        }

        return last_row_has_data;
    }
}