/// #if false
import FileHandler from '../FileHandler';
import { WriteStream } from 'fs';
import * as moment from 'moment';

export default class FileLogger {

    public static LOG_LEVEL_0_DEBUG: string = "DEBUG";
    public static LOG_LEVEL_10_INFO: string = "INFO-";
    public static LOG_LEVEL_25_WARN: string = "WARN-";
    public static LOG_LEVEL_50_ERROR: string = "ERROR";
    public static LOG_LEVEL_100_FATAL: string = "FATAL";

    public static getInstance(
        log_path: string,
        log_filename_template: string
    ) {
        let logKeyID: string = FileLogger.getLogKeyID(log_path, log_filename_template);

        if (!FileLogger.instances[logKeyID]) {
            FileLogger.instances[logKeyID] = new FileLogger(log_path, log_filename_template);
        }
        return FileLogger.instances[logKeyID];
    }

    private static instances: { [logKeyID: string]: FileLogger } = {};

    private static getLogKeyID(
        log_path: string,
        log_filename_template: string
    ): string {
        return log_path + log_filename_template;
    }

    private has_been_initialized: boolean = false;
    private writeStream: WriteStream = null;
    private compiled_file_name: string = null;

    /**
     * Génère un fichier de log (si inexistant) et le prépare pour pouvoir ensuite logger chaque ligne à la volée
     * @param log_path Chemin du répertoire où sont stockés ces logs
     * @param log_filename_template Template du nom de log, dans lequel on peut utiliser {{YYYY-MM-DD}} pour substituer la date de la création du log.
     * Par exemple, si le template est "log_{{Y-MM}}.txt" on aura pour le 01/03/2018 un log "log_2018-03.txt". On utilise la fonction format de moment.
     */
    private constructor(
        public log_path: string,
        public log_filename_template: string
    ) {

        // Pour optimiser tout le log on utilise un stream, qui n'a pas besoin d'être explicitement fermé pour fonctionner.
        // En revanche on veut s'assurer qu'on utilise toujours le même stream pour un nom de fichier, d'où l'usage du getInstance.
    }


    /**
     * Logger une ligne à la suite du fichier de log
     * @param text La ligne à ajouter au fichier de log (sans retour à la ligne, et la date et le log_level sont insérés automatiquement en début de ligne)
     * @param log_level à choisir dans FileLogger.LOG_LEVEL_XXXX
     */
    public async log(text: string, log_level: string) {

        // On vérifie d'abord qu'on doit pas initialiser, ou réinitialiser à cause d'un changement de fichier
        if ((!this.has_been_initialized) || (this.compiled_file_name != this.compileFileName())) {
            await this.initialize();
        }

        this.writeStream.write(moment().format('YYYY-MM-DD HH:mm:ss SSS ') + log_level + ' ' + text + "\n");
    }


    private async initialize() {
        this.has_been_initialized = false;

        if (!await FileHandler.getInstance().dirExists(this.log_path)) {
            await FileHandler.getInstance().dirCreate(this.log_path);
        }

        this.compiled_file_name = this.compileFileName();

        this.writeStream = FileHandler.getInstance().getWriteStream(this.log_path + '/' + this.compiled_file_name, 'a');

        this.has_been_initialized = true;
    }

    private compileFileName() {
        let res = this.log_filename_template;

        let regexp: RegExp = /^(.*)[{][{]([^{}]+)[}][}](.*)$/;
        if (regexp.test(res)) {

            try {
                let matches: RegExpExecArray = regexp.exec(res);

                res = matches[0] + moment().format(matches[1]) + matches[2];
            } catch (error) {
                console.error(error);
            }
        }

        return res;
    }
}
/// #endif
