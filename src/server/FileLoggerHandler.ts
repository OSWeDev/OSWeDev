/* istanbul ignore file: not a usefull test to write */

import fs from 'fs';
import { cloneDeep } from 'lodash';
import Dates from '../shared/modules/FormatDatesNombres/Dates/Dates';
import ModulesManager from '../shared/modules/ModulesManager';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import ILoggerHandler from '../shared/tools/interfaces/ILoggerHandler';
import ThrottleHelper from '../shared/tools/ThrottleHelper';
import ConfigurationService from './env/ConfigurationService';
import ModuleDAOServer from './modules/DAO/ModuleDAOServer';
import FileServerController from './modules/File/FileServerController';
import LogVO from '../shared/modules/Logger/vos/LogVO';
import ParamsManager from '../shared/modules/Params/ParamsManager';
import ModuleLogger from '../shared/modules/Logger/ModuleLogger';
import StackContext from './StackContext';
import { reflect } from '../shared/tools/ObjectHandler';
import { IRequestStackContext } from './ServerExpressController';

export default class FileLoggerHandler implements ILoggerHandler {

    public static SEPARATOR: string = ' - ';

    private static instance: FileLoggerHandler = null;

    private log_file: fs.WriteStream = null;
    private is_prepared: boolean = false;

    private log_to_file_cache: LogVO[] = [];
    private log_to_file_throttler = ThrottleHelper.declare_throttle_without_args(this.log_to_file.bind(this), 1000);

    private constructor() { }

    // istanbul ignore next: nothing to test
    public static getInstance(): FileLoggerHandler {
        if (!FileLoggerHandler.instance) {
            FileLoggerHandler.instance = new FileLoggerHandler();
        }
        return FileLoggerHandler.instance;
    }

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

    public log(log_type: number, date: number, msg: string, ...params) {
        for (const i in params) {
            msg = msg.replace(/$[Oo]/, params[i]);
        }

        if (!msg) {
            return;
        }

        const can_use_context = !StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE);
        this.log_to_file_cache.push(LogVO.createNew(
            (((typeof process !== "undefined") && process.pid) ? process.pid : null),
            log_type ?? ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_LOG),
            date,
            msg,
            can_use_context ? StackContext.get('UID') : null,
            null,
            null,
        ));
        this.log_to_file_throttler();
    }

    private set_log_file() {
        if (ConfigurationService.node_configuration.console_log_to_file && this.is_prepared) {
            this.log_file = FileServerController.getInstance().getWriteStream('./nodes_logs/node_log_' + process.pid + '_' + Dates.now() + '.txt', 'a');
        }
    }

    private log_to_file() {
        const logs_by_log_type_id: { [log_type_id: number]: LogVO[] } = {};
        const logs: LogVO[] = this.log_to_file_cache;
        this.log_to_file_cache = [];

        for (const i in logs) {
            if (!logs_by_log_type_id[logs[i].log_type_id]) {
                logs_by_log_type_id[logs[i].log_type_id] = [];
            }
            logs_by_log_type_id[logs[i].log_type_id].push(logs[i]);
        }

        const log_msgs: string[] = [];

        for (const log_type_idx in logs_by_log_type_id) {
            const logs_to_save: LogVO[] = [];

            for (const i in logs_by_log_type_id[log_type_idx]) {
                const log: LogVO = logs_by_log_type_id[log_type_idx][i];
                let msg: string = '';

                switch (log.log_type_id) {
                    case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_ERROR):
                        msg = 'ERROR -- ';
                        break;
                    case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_WARN):
                        msg = 'WARN  -- ';
                        break;
                    case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_LOG):
                        msg = 'LOG -- ';
                        break;
                    case ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_DEBUG):
                        msg = 'DEBUG -- ';
                        break;
                }

                msg += log.process_pid + ':' + ConsoleHandler.get_formatted_timestamp(log.date) + FileLoggerHandler.SEPARATOR + log.msg;

                log_msgs.push(msg);

                // On va vérifier quel niveau min on doit log
                if (log.log_type_id <= ParamsManager.getParamValue(ModuleLogger.PARAM_LOGGER_LOG_TYPE_SERVER_MAX)) {
                    logs_to_save.push(log);
                }
            }

            // On ne log pas les logs du generator en BDD, sinon ça plante car tout n'est pas initialisé
            if (!ModulesManager.isGenerator && logs_to_save?.length) {
                // On fait exprès de ne pas attendre la fin de l'écriture pour ne pas bloquer le serveur
                ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(logs_to_save, parseInt(log_type_idx), true);
            }
        }

        // On essaye de recréer le fichier s'il est perdu
        // Si le log est > à 10Mo, on va créé un autre pour éviter que ce soit trop lourd de l'ouvrir et d'écrire dedans
        if (!this.log_file) {
            this.set_log_file();
        }

        if (log_msgs?.length) {
            fs.stat(this.log_file.path, (err, stats) => {
                if (err || (stats.size >= 10000000)) {
                    this.set_log_file();
                }
                this.log_file.write(log_msgs.join('\n') + '\n');
            });
        }
    }
}