import * as fs from 'fs';
import * as admz from 'adm-zip';
import ICronWorker from "../../Cron/interfaces/ICronWorker";
import FileServerController from "../FileServerController";
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import * as express from 'express';
import FilterFilesVO from '../../../../shared/modules/File/vos/FilterFilesVO';


export default class FilterFilesCronWorker implements ICronWorker {


    public static getInstance() {
        if (!FilterFilesCronWorker.instance) {
            FilterFilesCronWorker.instance = new FilterFilesCronWorker();
        }
        return FilterFilesCronWorker.instance;
    }

    private static instance: FilterFilesCronWorker = null;
    // public base_path: string = "./files/upload/user";
    // public base_path1: string = "./files/upload";
    // public base_path: string = "./files/upload/user";

    private constructor() {

    }

    get worker_uid(): string {
        return "FilterFilesCronWorker";
    }

    public async work() {

        enum FilterEnum {
            YEAR = 'year',
            MONTH = 'month'
        }
        let filtre: FilterEnum = FilterEnum.MONTH;
        var filterFileVOS: FilterFilesVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString(FilterFilesVO.API_TYPE_ID, null, null, "filter", [filtre]);

        for (let i in filterFileVOS) {
            const filterFileVO = filterFileVOS[i];
            // on parcourt le dossier
            fs.readdir(filterFileVO.path_to_check, async (err, files) => {
                if (err) {
                    ConsoleHandler.getInstance().log(err);
                    return;
                }
                //on boucle sur le resultat du readdir
                for (let j in files) {
                    const file = files[j];
                    var file_vos: FileVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString(FileVO.API_TYPE_ID, null, null, "path", [filterFileVO.path_to_check + "/" + file]);
                    var file_vo: FileVO = file_vos[0] || null;

                    fs.stat(filterFileVO.path_to_check + "/" + file, async (err2, stats) => {
                        if (err2) {
                            ConsoleHandler.getInstance().log(err2);
                            return;
                        }
                        if (stats.isFile()) {
                            var month: number = stats.ctime.getMonth() + 1;
                            var year: number = stats.ctime.getFullYear();

                            if (filterFileVO.filter == FilterEnum.YEAR) {
                                var file_vo_updated: string = await FileServerController.getInstance().moveFile(filterFileVO.path_to_check + "/" + file, filterFileVO.new_path_saved + "/" + year + "/");
                                if (file_vo != null) {
                                    file_vo.path = file_vo_updated;
                                }
                            } else {
                                var file_vo_updated: string = await FileServerController.getInstance().moveFile(filterFileVO.path_to_check + "/" + file, filterFileVO.new_path_saved + "/" + year + "/" + month + "/");
                                if (file_vo != null) {
                                    file_vo.path = file_vo_updated;
                                }
                            }
                            ModuleDAO.getInstance().insertOrUpdateVO(file_vo);
                        }
                    });
                }
            });
        }
    }
}