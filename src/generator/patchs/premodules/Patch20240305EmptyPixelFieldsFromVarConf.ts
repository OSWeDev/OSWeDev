/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240305EmptyPixelFieldsFromVarConf implements IGeneratorWorker {

    private static instance: Patch20240305EmptyPixelFieldsFromVarConf = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240305EmptyPixelFieldsFromVarConf';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240305EmptyPixelFieldsFromVarConf {
        if (!Patch20240305EmptyPixelFieldsFromVarConf.instance) {
            Patch20240305EmptyPixelFieldsFromVarConf.instance = new Patch20240305EmptyPixelFieldsFromVarConf();
        }
        return Patch20240305EmptyPixelFieldsFromVarConf.instance;
    }

    public async work(db: IDatabase<unknown>) {
        try {
            /**
             * On vide les pixel_fields de la table ref.module_var_var_conf pour forcer à les recharger depuis le code
             */

            await db.query("UPDATE ref.module_var_var_conf SET pixel_fields = null;");
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}