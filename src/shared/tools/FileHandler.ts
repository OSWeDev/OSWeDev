/* istanbul ignore file: only one method, and not willing to test it right now*/

import { Stats, statSync } from 'fs';
import FileVO from '../modules/File/vos/FileVO';
import ConsoleHandler from './ConsoleHandler';
import ThreadHandler from './ThreadHandler';

export default class FileHandler {

    public static getInstance(): FileHandler {
        if (!FileHandler.instance) {
            FileHandler.instance = new FileHandler();
        }
        return FileHandler.instance;
    }

    private static instance: FileHandler = null;

    private constructor() {
    }

    /**
     * Le but de la fonction est d'attendre la fin du transfert d'un fichier par FTP par exemple pour un import d'un gros fichier
     *  Pour se faire on utilise la taille et la date de modification, en se disant que si on garde les 2 infos fixent pendant plus de x
     *  millisecondes, on doit pouvoir considérer que le transfert est terminé
     */
    /* istanbul ignore next: really difficult test : depends on files and timeouts, would need to divide the function and test separate things */
    public async wait_for_file_end_creation(filename: string, timeout_ms: number) {

        let has_changes: boolean = true;

        let old_mtimeMs: number = null;
        let old_size: number = null;

        while (has_changes) {

            await ThreadHandler.getInstance().sleep(timeout_ms);
            has_changes = false;

            let stats: Stats = statSync(filename);

            ConsoleHandler.getInstance().log(JSON.stringify(stats));

            if ((!old_mtimeMs) || (stats.mtimeMs != old_mtimeMs)) {
                old_mtimeMs = stats.mtimeMs;
                old_size = stats.size;
                has_changes = true;
                continue;
            }

            if ((old_size == null) || (stats.size != old_size)) {
                old_mtimeMs = stats.mtimeMs;
                old_size = stats.size;
                has_changes = true;
                continue;
            }
        }
    }

    public get_file_size(filePath: string): number {

        let stats = statSync(filePath);
        return stats ? stats.size : null;
    }

    public get_full_url(BASE_URL: string, file_path: string): string {

        let url = null;
        if (BASE_URL.endsWith('/') && file_path.startsWith('/')) {
            url = BASE_URL + file_path.substr(1, file_path.length - 1);
        } else if (BASE_URL.endsWith('/') && file_path.startsWith('./')) {
            url = BASE_URL + file_path.substr(2, file_path.length - 2);
        } else if ((!BASE_URL.endsWith('/')) && file_path.startsWith('./')) {
            url = BASE_URL + file_path.substr(1, file_path.length - 1);
        } else {
            url = BASE_URL + file_path;
        }

        return url;
    }

    public get_file_name(vo: FileVO): string {

        if ((!vo) || (!vo.path)) {
            return null;
        }

        let path_parts = vo.path.split('/');
        return path_parts[path_parts.length - 1];
    }

    public get_folder(vo: FileVO): string {

        if ((!vo) || (!vo.path)) {
            return null;
        }

        let path_parts = vo.path.split('/');
        path_parts.pop();
        return path_parts.join('/');
    }
}