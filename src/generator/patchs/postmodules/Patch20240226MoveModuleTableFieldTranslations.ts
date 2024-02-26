/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from "pg-promise";
import IGeneratorWorker from "../../IGeneratorWorker";

export default class Patch20240226MoveModuleTableFieldTranslations implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240226MoveModuleTableFieldTranslations {
        if (!Patch20240226MoveModuleTableFieldTranslations.instance) {
            Patch20240226MoveModuleTableFieldTranslations.instance = new Patch20240226MoveModuleTableFieldTranslations();
        }
        return Patch20240226MoveModuleTableFieldTranslations.instance;
    }

    private static instance: Patch20240226MoveModuleTableFieldTranslations = null;

    get uid(): string {
        return 'Patch20240226MoveModuleTableFieldTranslations';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        /**
         * modifier le code de trad des moduletablefield pour passer du name du moduletable à son id pour des questions de perf
         *         "fields.labels." + this.module_table.full_name + "." + this.field_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
         *         "fields.labels." + this.module_table_id + "." + this.field_name + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
         */
        TODO ?
    }
}