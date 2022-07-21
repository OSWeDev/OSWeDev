import * as fs from 'fs';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import FilterFilesVO from '../../../../shared/modules/File/vos/FilterFilesVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ICronWorker from "../../Cron/interfaces/ICronWorker";
import FileServerController from "../FileServerController";


export default class FilterFilesCronWorker implements ICronWorker {

    public static getInstance() {
        if (!FilterFilesCronWorker.instance) {
            FilterFilesCronWorker.instance = new FilterFilesCronWorker();
        }
        return FilterFilesCronWorker.instance;
    }

    private static instance: FilterFilesCronWorker = null;


    private constructor() { }

    get worker_uid(): string {
        return "FilterFilesCronWorker";
    }

    public async work() {

        var filterFileVOS: FilterFilesVO[] = await query(FilterFilesVO.API_TYPE_ID).select_vos<FilterFilesVO>();
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
                    // if (this.is_working_on_file[filterFileVO.path_to_check + "/" + file]) {
                    //     return;
                    // }
                    // this.is_working_on_file[filterFileVO.path_to_check + "/" + file] = true;

                    fs.stat(filterFileVO.path_to_check + "/" + file, async (err2, stats) => {
                        if (err2) {
                            ConsoleHandler.getInstance().log(err2);
                            return;
                        }
                        if (stats.isFile()) {
                            var month: number = stats.ctime.getMonth() + 1;
                            var year: number = stats.ctime.getFullYear();

                            let target_folder: string = null;

                            switch (filterFileVO.filter_type) {
                                case FilterFilesVO.FILTER_TYPE_YEAR:
                                    target_folder = filterFileVO.new_path_saved + "/" + year + "/";
                                    break;
                                case FilterFilesVO.FILTER_TYPE_MONTH:
                                    target_folder = filterFileVO.new_path_saved + "/" + year + "/" + month + "/";
                                    break;
                                default:
                                    throw new Error('NOT IMPLEMENTED');
                            }

                            if (!!target_folder) {
                                var file_vo_updated: string = await FileServerController.getInstance().moveFile(filterFileVO.path_to_check + "/" + file, target_folder);
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