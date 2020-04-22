import ThreadHandler from './ThreadHandler';
import { statSync, Stats } from 'fs';

/* istanbul ignore next: only one method, and not willing to test it right now */
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

            has_changes = false;

            let stats: Stats = statSync(filename);

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

            await ThreadHandler.getInstance().sleep(timeout_ms);
        }
    }
}