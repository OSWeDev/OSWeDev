/* istanbul ignore file: not a usefull test to write */

import * as fs from 'fs';
import Dates from '../shared/modules/FormatDatesNombres/Dates/Dates';
import ILoggerHandler from '../shared/tools/interfaces/ILoggerHandler';
import ConfigurationService from './env/ConfigurationService';
import FileServerController from './modules/File/FileServerController';

export default class FileLoggerHandler implements ILoggerHandler {

    public static SEPARATOR: string = ' - ';

    public static getInstance(): FileLoggerHandler {
        if (!FileLoggerHandler.instance) {
            FileLoggerHandler.instance = new FileLoggerHandler();
        }
        return FileLoggerHandler.instance;
    }

    private static instance: FileLoggerHandler = null;

    private log_file: fs.WriteStream = null;
    private is_prepared: boolean = false;

    private constructor() { }

    public async prepare() {

        if (ConfigurationService.node_configuration.CONSOLE_LOG_TO_FILE) {
            await FileServerController.getInstance().makeSureThisFolderExists('./nodes_logs');
            this.is_prepared = true;
            this.set_log_file();
        }
    }

    public log(msg: string, ...params) {

        if (!this.log_file) {
            // On essaye de recréer le fichier s'il est perdu
            this.set_log_file();
            return;
        }

        // Si le log est > à 10Mo, on va créé un autre pour éviter que ce soit trop lourd de l'ouvrir et d'écrire dedans
        if (fs.existsSync(this.log_file.path) && fs.statSync(this.log_file.path).size >= 10000000) {
            this.set_log_file();
        }

        for (let i in params) {
            msg = msg.replace(/$[Oo]/, params[i]);
        }

        this.log_file.write(msg + '\n');
    }

    private set_log_file() {
        if (ConfigurationService.node_configuration.CONSOLE_LOG_TO_FILE && this.is_prepared) {
            this.log_file = FileServerController.getInstance().getWriteStream('./nodes_logs/node_log_' + process.pid + '_' + Dates.now() + '.txt', 'a');
        }
    }
}