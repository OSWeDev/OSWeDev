/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConfigurationService from '../../../server/env/ConfigurationService';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import TemplateHandlerClient from '../../../shared/tools/TemplateHandlerClient';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20240305MigrationCodesTradsMinusculesENV implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240305MigrationCodesTradsMinusculesENV {
        if (!Patch20240305MigrationCodesTradsMinusculesENV.instance) {
            Patch20240305MigrationCodesTradsMinusculesENV.instance = new Patch20240305MigrationCodesTradsMinusculesENV();
        }
        return Patch20240305MigrationCodesTradsMinusculesENV.instance;
    }

    private static instance: Patch20240305MigrationCodesTradsMinusculesENV = null;

    get uid(): string {
        return 'Patch20240305MigrationCodesTradsMinusculesENV';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        // On doit passer de %%ENV%%APP_TITLE%% à %%ENV%%app_title%% par exemple
        let translations = query(TranslationVO.API_TYPE_ID)
            .filter_by_text_including(field_names<TranslationVO>().translated, '%%ENV%%')
            .exec_as_server()
            .select_vos<TranslationVO>();

        let env: { [name: string]: any } = {};

        for (let env_param_name in ConfigurationService.node_configuration) {
            env[env_param_name] = '%%ENV%%' + env_param_name + '%%';
        }

        for (let i in translations) {
            let translation = translations[i];

            ConsoleHandler.log('replaceEnvParams_to_lower:AVANT: ' + translation.translated);
            this.replaceEnvParams_to_lower(translation.translated, env);
            ConsoleHandler.log('replaceEnvParams_to_lower:APRES: ' + translation.translated);

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(translation);
        }

        // On refait la même chose pour les §§IFENV_ENVPARAMNAME§§then§§else§§
        translations = query(TranslationVO.API_TYPE_ID)
            .filter_by_text_including(field_names<TranslationVO>().translated, '%%IFENV_')
            .exec_as_server()
            .select_vos<TranslationVO>();

        for (let env_param_name in ConfigurationService.node_configuration) {
            env[env_param_name] = '%%IFENV_' + env_param_name + '%%';
        }

        for (let i in translations) {
            let translation = translations[i];

            ConsoleHandler.log('replaceIFEnvParams_to_lower:AVANT: ' + translation.translated);
            this.replaceIFEnvParams_to_lower(translation.translated, env);
            ConsoleHandler.log('replaceIFEnvParams_to_lower:APRES: ' + translation.translated);

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(translation);
        }
    }

    public replaceEnvParams_to_lower(template: string, env: { [name: string]: any }): string {

        const regExp = new RegExp('%%ENV%%([A-Z0-9_-]+)%%', 'i');
        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            let varname: string = regexpres[1];
            varname = varname ? varname.toLowerCase() : varname;

            if (varname && env[varname]) {
                template = template.replace(regExp, env[varname]);
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }

    public replaceIFEnvParams_to_lower(template: string, env: { [name: string]: any }): string {

        const regExp = new RegExp('%%IFENV_([A-Z0-9_-]+)%%', 'i');
        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            let varname: string = regexpres[1];
            varname = varname ? varname.toLowerCase() : varname;

            if (varname && env[varname]) {
                template = template.replace(regExp, env[varname]);
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }
}