/* istanbul ignore file: not a usefull test to write */

import { WriteStream } from 'fs';
import ILoggerHandler from '../shared/tools/interfaces/ILoggerHandler';
import ConfigurationService from './env/ConfigurationService';
import FileServerController from './modules/File/FileServerController';
const moment = require('moment');

export default class FileLoggerHandler implements ILoggerHandler {

    public static SEPARATOR: string = ' - ';

    public static getInstance(): FileLoggerHandler {
        if (!FileLoggerHandler.instance) {
            FileLoggerHandler.instance = new FileLoggerHandler();
        }
        return FileLoggerHandler.instance;
    }

    private static instance: FileLoggerHandler = null;

    private log_file: WriteStream = null;

    private constructor() { }

    public async prepare() {

        if (ConfigurationService.getInstance().getNodeConfiguration().CONSOLE_LOG_TO_FILE) {
            await FileServerController.getInstance().makeSureThisFolderExists('./nodes_logs');
            this.log_file = FileServerController.getInstance().getWriteStream('./nodes_logs/node_log_' + process.pid + '_' + moment().unix() + '.txt', 'a');
        }
    }

    public log(msg: string, ...params) {

        if (!this.log_file) {
            return;
        }

        for (let i in params) {
            msg = msg.replace(/$[Oo]/, params[i]);
        }

        this.log_file.write(msg + '\n');
    }
}