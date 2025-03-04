import Archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleFile from '../../../../shared/modules/File/ModuleFile';
import ArchiveFilesConfVO from '../../../../shared/modules/File/vos/ArchiveFilesConfVO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ThreadHandler from '../../../../shared/tools/ThreadHandler';
import ICronWorker from "../../Cron/interfaces/ICronWorker";
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import TeamsAPIServerController from '../../TeamsAPI/TeamsAPIServerController';


export default class ArchiveFilesCronWorker implements ICronWorker {

    private static instance: ArchiveFilesCronWorker = null;

    private constructor() { }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "ArchiveFilesCronWorker";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ArchiveFilesCronWorker.instance) {
            ArchiveFilesCronWorker.instance = new ArchiveFilesCronWorker();
        }
        return ArchiveFilesCronWorker.instance;
    }

    // istanbul ignore next: nothing to test : work
    public async work() {
        const confs = await query(ArchiveFilesConfVO.API_TYPE_ID)
            .filter_is_true(field_names<ArchiveFilesConfVO>().activated)
            .exec_as_server()
            .select_vos<ArchiveFilesConfVO>();

        for (const conf of confs) {
            await this.apply_archive_conf(conf);
            await ThreadHandler.sleep(1000, 'ArchiveFilesCronWorker'); // On laisse de la place aux autres processus, même si techniquement on bloque rien a priori dans ce traitement
        }
    }

    private async apply_archive_conf(conf: ArchiveFilesConfVO) {

        if (!conf || !conf.paths_to_check || !conf.paths_to_check.length) {
            return;
        }

        ConsoleHandler.log('ArchiveFilesCronWorker - Début du traitement pour la configuration : ' + conf.name);

        const threshold = this.get_archive_threshold(conf);
        let archivedCount = 0;

        for (const dir of conf.paths_to_check) {
            if (!fs.existsSync(dir)) {
                continue;
            }

            const files = await fs.promises.readdir(dir);
            for (const file of files) {
                if (archivedCount >= conf.max_files_per_treatement) {
                    return;
                }

                const file_path = path.join(dir, file);
                const stat = fs.statSync(file_path);
                let date_to_use: number = null;
                switch (conf.date_fichier_pour_delai) {
                    case ArchiveFilesConfVO.USE_DATE_TYPE_CREATION:
                        date_to_use = Dates.from_date(stat.birthtime);
                        break;
                    case ArchiveFilesConfVO.USE_DATE_TYPE_UPDATE:
                        date_to_use = Dates.from_date(stat.mtime);
                        break;
                    case ArchiveFilesConfVO.USE_DATE_TYPE_LAST_ACCESS:
                        date_to_use = Dates.from_date(stat.atime);
                        break;
                    default:
                        throw new Error('NOT IMPLEMENTED');
                }

                if (
                    (!stat.isFile()) ||
                    (!this.file_matches_any_regexp(file, conf.regexps_of_files_to_archive)) ||
                    (date_to_use > threshold)
                ) {
                    continue;
                }

                if (this.is_file_in_use(file_path)) {
                    continue;
                }

                let fileVO = await query(FileVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<FileVO>().path, file_path)
                    .exec_as_server()
                    .select_vo<FileVO>();

                try {


                    // Si le fichier est déjà marqué archivé, on doit reprendre le traitement si le nombre de tentative est < au max_tentatives, sinon on indique que l'archivage est en erreur
                    // pour ce fichier et on remonte une alerte dans Teams
                    if (fileVO && fileVO.is_archived && (fileVO.archive_error_count >= conf.max_tentatives)) {
                        continue;
                    }

                    if (!fileVO) {
                        // cas de fichiers qui sont dans le répertoire et qui sont pas indexés par un FileVO => on le crée
                        // et si on est sur du sfiles, on le sécurise pour les admins

                        fileVO = new FileVO();
                        fileVO.path = file_path;
                        fileVO.is_secured = (file_path.indexOf(ModuleFile.SECURED_FILES_ROOT) >= 0);
                        if (fileVO.is_secured) {
                            fileVO.file_access_policy_name = ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS;
                        }
                    }

                    const archiveDir = await this.build_archive_path(file_path, conf, stat);
                    if (!archiveDir) {
                        throw new Error('Erreur lors de la construction du chemin d\'archivage : ' + file_path + ' - ' + JSON.stringify(conf));
                    }

                    if (!fs.existsSync(archiveDir)) {
                        fs.mkdirSync(archiveDir, { recursive: true });
                    }

                    const zipPath = path.join(archiveDir, `${file}.zip`);

                    const output = fs.createWriteStream(zipPath);
                    const archive = Archiver('zip', { zlib: { level: 9 } });
                    archive.pipe(output);
                    archive.file(file_path, { name: file });
                    await archive.finalize();

                    fs.unlinkSync(file_path);

                    fileVO.archive_date = Dates.now();
                    fileVO.is_archived = true;
                    fileVO.archive_path = zipPath;
                    fileVO.archive_error_count = 0;
                    fileVO.archive_last_error = null;
                    fileVO.archive_last_error_date = null;

                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(fileVO);

                    archivedCount++;
                } catch (error) {
                    if (fileVO) {
                        fileVO.archive_error_count++;

                        if (fileVO.archive_error_count >= conf.max_tentatives) {
                            await TeamsAPIServerController.send_teams_error(
                                'ArchiveFilesCronWorker - Abandon',
                                'Erreur lors de l\'archivage du fichier : ' + file_path + ' - ' + error.message + '. Nombre de tentatives dépassé. Archivage abandonné.'
                            );
                        }

                        fileVO.archive_last_error_date = Dates.now();
                        fileVO.archive_last_error = error.message;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(fileVO);
                    }
                    ConsoleHandler.error('Erreur lors de l\'archivage du fichier : ' + file_path + ' - ' + error.message);
                }
            }

            if (archivedCount >= conf.max_files_per_treatement) {
                return;
            }
        }

        ConsoleHandler.log('ArchiveFilesCronWorker - ' + archivedCount + ' fichiers archivés pour la configuration : ' + conf.name);
    }

    private get_archive_threshold(conf: ArchiveFilesConfVO): number {
        return Dates.add(Dates.now(), -conf.nb_segment_delai_archivage, conf.type_segment_delai_archivage);
    }

    /**
     * Pour vérifier autant que possible que le fichier n'est pas en cours d'utilisation par un autre processus avant de se lancer dans le zip, ...
     * @param filePath
     * @returns boolean
     */
    private is_file_in_use(filePath: string): boolean {
        try {
            const fd = fs.openSync(filePath, 'r+');
            fs.closeSync(fd);
            return false; // fichier libre
        } catch (e) {
            return true; // fichier en cours d'utilisation
        }
    }

    private file_matches_any_regexp(fileName: string, regexList: string[]): boolean {
        return regexList.some((pattern) => new RegExp(pattern, 'i').test(fileName));
    }

    private async build_archive_path(
        unarchived_file_path: string,
        conf: ArchiveFilesConfVO,
        file_stats: fs.Stats,
    ): Promise<string> {

        if (!conf) {
            return null;
        }

        /**
         * Le format est le suivant :
         * ArchiveFilesConfVO.ARCHIVE_FOLDER + unarchived_file_folder + (conf.add_name_trans_in_archive_path ? conf.name_trans + '/' : '') + répertoires issus de la date
         * Le choix de la date à utiliser est dépendant de date_fichier_pour_nommage
         * Et la segementation à utiliser est configuré par type_segment_nommage_archives (soit YYYY, soit YYYY/MM, soit YYYY/MM/DD, au delà on throw not implemented)
         */
        let base = ArchiveFilesConfVO.ARCHIVE_FOLDER;
        let unarchived_file_folder = path.dirname(unarchived_file_path);
        let date_to_use: number = null;
        switch (conf.date_fichier_pour_nommage) {
            case ArchiveFilesConfVO.USE_DATE_TYPE_CREATION:
                date_to_use = Dates.from_date(file_stats.birthtime);
                break;
            case ArchiveFilesConfVO.USE_DATE_TYPE_UPDATE:
                date_to_use = Dates.from_date(file_stats.mtime);
                break;
            case ArchiveFilesConfVO.USE_DATE_TYPE_LAST_ACCESS:
                date_to_use = Dates.from_date(file_stats.atime);
                break;
            default:
                throw new Error('NOT IMPLEMENTED');
        }

        let year = Dates.format(date_to_use, 'YYYY');
        let month = Dates.format(date_to_use, 'MM');
        let day = Dates.format(date_to_use, 'DD');

        let archive_path = path.join(base, unarchived_file_folder);

        if (conf.add_name_trans_in_archive_path) {
            archive_path = path.join(archive_path, conf.name_trans);
        }

        switch (conf.type_segment_nommage_archives) {
            case TimeSegment.TYPE_YEAR:
                archive_path = path.join(archive_path, year);
                break;
            case TimeSegment.TYPE_MONTH:
                archive_path = path.join(archive_path, year, month);
                break;
            case TimeSegment.TYPE_DAY:
                archive_path = path.join(archive_path, year, month, day);
                break;
            default:
                throw new Error('NOT IMPLEMENTED');
        }

        // Si on a activé le max_files_per_archive_folder, on classe immédiatement dans des répertoires de 100000 fichiers, /X/XXXX.zip ou X est un nombre de 0 à +inf
        // On regarde les répertoires présents et on prend le plus grand, et +1 si on a déjà atteint le max_files_per_archive_folder dans le dernier répertoire
        // On peut (et on devrait probablement) faire un cache de ce max_folder pour éviter de le recalculer à chaque fois => en base par exemple ou en fichier dans le repertoire d'archivage
        if (conf.max_files_per_archive_folder) {
            let max_folder = 0;
            if (fs.existsSync(archive_path)) {
                const files = await fs.promises.readdir(archive_path);
                for (const file of files) {
                    if (fs.statSync(path.join(archive_path, file)).isDirectory()) {

                        try {
                            const folder = parseInt(file);
                            if (folder > max_folder) {
                                max_folder = folder;
                            }
                        } catch (error) {
                            ConsoleHandler.warn('ArchiveFilesCronWorker - Répertoire d\'archivage non numérique : ' + file);
                            continue;
                        }
                    }
                }
            }

            let folder = max_folder;
            if (fs.existsSync(archive_path) && (await fs.promises.readdir(archive_path)).length >= conf.max_files_per_archive_folder) {
                folder++;
            }

            archive_path = path.join(archive_path, folder.toString());
        }

        return archive_path;
    }
}