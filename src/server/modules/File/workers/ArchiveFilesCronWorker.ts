import fs from 'fs';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import ArchiveFilesConfVO from '../../../../shared/modules/File/vos/ArchiveFilesConfVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ICronWorker from "../../Cron/interfaces/ICronWorker";
import FileServerController from "../FileServerController";
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';


export default class ArchiveFilesCronWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ArchiveFilesCronWorker.instance) {
            ArchiveFilesCronWorker.instance = new ArchiveFilesCronWorker();
        }
        return ArchiveFilesCronWorker.instance;
    }

    private static instance: ArchiveFilesCronWorker = null;


    private constructor() { }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "ArchiveFilesCronWorker";
    }

    // istanbul ignore next: nothing to test : work
    public async work() {

        const filterFileVOS: ArchiveFilesConfVO[] = await query(ArchiveFilesConfVO.API_TYPE_ID).select_vos<ArchiveFilesConfVO>();
        for (const i in filterFileVOS) {
            const filterFileVO = filterFileVOS[i];
            // on parcourt le dossier
            fs.readdir(filterFileVO.path_to_check, async (err, files) => {
                if (err) {
                    ConsoleHandler.log(err);
                    return;
                }
                //on boucle sur le resultat du readdir
                for (const j in files) {
                    const file = files[j];
                    const file_vos: FileVO[] = await query(FileVO.API_TYPE_ID)
                        .filter_by_text_eq('path', filterFileVO.path_to_check + "/" + file)
                        .select_vos<FileVO>();

                    var file_vo: FileVO = file_vos[0] || null;
                    // on recuper les stat du fichier
                    fs.stat(filterFileVO.path_to_check + "/" + file, async (err2, stats) => {
                        if (err2) {
                            ConsoleHandler.log(err2);
                            return;
                        }
                        //on verifie si c'est un fichier
                        if (stats.isFile()) {

                            let decide_archive_date = null;

                            switch (filterFileVO.use_date_type) {
                                default:
                                case ArchiveFilesConfVO.USE_DATE_TYPE_CREATION:
                                    decide_archive_date = stats.ctime;
                                    break;
                                case ArchiveFilesConfVO.USE_DATE_TYPE_UPDATE:
                                    decide_archive_date = stats.mtime;
                                    break;
                            }

                            //on verifie si le fichier est plus vieux que la date de reference
                            if ((Dates.now() - decide_archive_date) < filterFileVO.archive_delay_sec) {
                                return;
                            }

                            let month: number = null;
                            let year: number = null;
                            let day: number = null;

                            switch (filterFileVO.use_date_type) {
                                default:
                                case ArchiveFilesConfVO.USE_DATE_TYPE_CREATION:
                                    month = stats.ctime.getMonth() + 1;
                                    year = stats.ctime.getFullYear();
                                    day = stats.ctime.getDate();
                                    break;
                                case ArchiveFilesConfVO.USE_DATE_TYPE_UPDATE:
                                    month = stats.mtime.getMonth() + 1;
                                    year = stats.mtime.getFullYear();
                                    day = stats.mtime.getDate();
                                    break;
                            }

                            let target_folder: string = null;

                            switch (filterFileVO.filter_type) {
                                case ArchiveFilesConfVO.FILTER_TYPE_YEAR:
                                    target_folder = filterFileVO.target_achive_folder + "/" + year + "/";
                                    break;
                                case ArchiveFilesConfVO.FILTER_TYPE_MONTH:
                                    target_folder = filterFileVO.target_achive_folder + "/" + year + "/" + month + "/";
                                    break;
                                case ArchiveFilesConfVO.FILTER_TYPE_DAY:
                                    target_folder = filterFileVO.target_achive_folder + "/" + year + "/" + month + "/" + day + "/";
                                    break;
                                default:
                                    throw new Error('NOT IMPLEMENTED');
                            }
                            //non met a jour le chemin du fichier en bdd si il existe deja
                            if (target_folder) {
                                const file_vo_updated: string = await FileServerController.getInstance().moveFile(filterFileVO.path_to_check + "/" + file, target_folder);
                                if (file_vo != null) {
                                    file_vo.path = file_vo_updated;
                                }
                            }
                            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file_vo);
                        }
                    });
                }
            });
        }
    }
}