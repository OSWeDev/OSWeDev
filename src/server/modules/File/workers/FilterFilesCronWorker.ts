import * as fs from 'fs';
import ICronWorker from "../../Cron/interfaces/ICronWorker";
import FileServerController from "../FileServerController";
import FileFilterVO from "../../../../shared/modules/File/vos/FileFilterVO";
import FileLoggerHandler from '../../../FileLoggerHandler';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import { Module } from 'module';
import { Query } from 'pg';
import ContextQueryVO, { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleContextFilterServer from '../../ContextFilter/ModuleContextFilterServer';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { join } from 'path';


export default class FilterFilesCronWorker implements ICronWorker {


    public static getInstance() {
        if (!FilterFilesCronWorker.instance) {
            FilterFilesCronWorker.instance = new FilterFilesCronWorker();
        }
        return FilterFilesCronWorker.instance;
    }

    private static instance: FilterFilesCronWorker = null;

    private constructor() {

    }

    get worker_uid(): string {
        return "FilterFilesCronWorker"
    }

    // exec_in_dedicated_thread?: boolean;



    public base_path: string = "./files/upload/user";
    public base_path1: string = "./files/upload";

    public async work() {

        // on crée le dossier user  si il n'existe pas
        if (!await FileServerController.getInstance().dirExists(this.base_path)) {
            FileServerController.getInstance().dirCreate(this.base_path)
        }
        // on crée le dossier year  si il n'existe pas
        if (!await FileServerController.getInstance().dirExists(this.base_path + "/year")) {
            FileServerController.getInstance().dirCreate(this.base_path + "/year");
        }
        // on parcourt le dossier
        fs.readdir(this.base_path1, async (err, files) => {
            if (err) {
                ConsoleHandler.getInstance().log(err)
                return;
            }
            //on boucle sur le resultat du readdir
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                var file_vos: FileVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString(FileVO.API_TYPE_ID, null, null, "path", [this.base_path1 + "/" + file]);
                var file_vo: FileVO = file_vos[0];

                fs.stat(this.base_path1 + "/" + file, async (err, stats) => {
                    if (err) {
                        ConsoleHandler.getInstance().log(err);
                    }

                    if (stats.isFile()) {
                        var month: number = stats.ctime.getMonth() + 1;
                        var year: number = stats.ctime.getFullYear();

                        //si il n'existe pas on crée un dossier de l'année du fichier
                        if (!await FileServerController.getInstance().dirExists(this.base_path + "/year/" + year)) {
                            await FileServerController.getInstance().dirCreate(this.base_path + "/year/" + year);
                        }
                        //si il n'existe pas on crée un dossier de mois pour l'année du fichier
                        if (!await FileServerController.getInstance().dirExists(this.base_path + "/year/" + year + "/" + month)) {
                            await FileServerController.getInstance().dirCreate(this.base_path + "/year/" + year + "/" + month);
                        }

                        var file_vo_updated: string = await FileServerController.getInstance().moveFile(file_vo.path, this.base_path + "/year/" + year + "/" + month + "/");
                        file_vo.path = file_vo_updated;

                        ModuleDAO.getInstance().insertOrUpdateVO(file_vo);
                    }

                })
            }

        })
    }

}