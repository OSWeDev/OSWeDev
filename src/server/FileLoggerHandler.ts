/* istanbul ignore file: not a usefull test to write */

import fs from 'fs';
import Dates from '../shared/modules/FormatDatesNombres/Dates/Dates';
import ILoggerHandler from '../shared/tools/interfaces/ILoggerHandler';
import ConfigurationService from './env/ConfigurationService';
import FileServerController from './modules/File/FileServerController';
import ThrottleHelper from '../shared/tools/ThrottleHelper';

export default class FileLoggerHandler implements ILoggerHandler {

    public static SEPARATOR: string = ' - ';

    // istanbul ignore next: nothing to test
    public static getInstance(): FileLoggerHandler {
        if (!FileLoggerHandler.instance) {
            FileLoggerHandler.instance = new FileLoggerHandler();
        }
        return FileLoggerHandler.instance;
    }

    private static instance: FileLoggerHandler = null;

    private log_file: fs.WriteStream = null;
    private is_prepared: boolean = false;

    private log_to_file_cache: string[] = [];
    private log_to_file_throttler = ThrottleHelper.declare_throttle_without_args(this.log_to_file.bind(this), 1000);

    private constructor() { }

    public async prepare() {

        if (ConfigurationService.node_configuration.console_log_to_file) {
            await FileServerController.getInstance().makeSureThisFolderExists('./nodes_logs');
            this.is_prepared = true;
            this.set_log_file();
        }
    }

    public force_flush() {
        this.log_to_file();
    }

    public log(msg: string, ...params) {

        for (const i in params) {
            msg = msg.replace(/$[Oo]/, params[i]);
        }

        this.log_to_file_cache.push(msg);
        this.log_to_file_throttler();
    }

    private set_log_file() {
        if (ConfigurationService.node_configuration.console_log_to_file && this.is_prepared) {
            this.log_file = FileServerController.getInstance().getWriteStream('./nodes_logs/node_log_' + process.pid + '_' + Dates.now() + '.txt', 'a');
        }
    }

    private log_to_file() {
        const log = this.log_to_file_cache.join('\n');
        this.log_to_file_cache = [];

        // On essaye de recréer le fichier s'il est perdu
        // Si le log est > à 10Mo, on va créé un autre pour éviter que ce soit trop lourd de l'ouvrir et d'écrire dedans
        if (!this.log_file) {
            this.set_log_file();
        }

        fs.stat(this.log_file.path, (err, stats) => {
            if (err || (stats.size >= 10000000)) {
                this.set_log_file();
            }
            this.log_file.write(log + '\n');
        });
    }
}