/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class Patch20220111LocalizeCRONDate implements IGeneratorWorker {

    public static getInstance(): Patch20220111LocalizeCRONDate {
        if (!Patch20220111LocalizeCRONDate.instance) {
            Patch20220111LocalizeCRONDate.instance = new Patch20220111LocalizeCRONDate();
        }
        return Patch20220111LocalizeCRONDate.instance;
    }

    private static instance: Patch20220111LocalizeCRONDate = null;

    get uid(): string {
        return 'Patch20220111LocalizeCRONDate';
    }

    private constructor() { }

    /**
     * Objectif : Passer les dates de module_cron_cronworkplan en tstz localisee :
     * date_heure_planifiee
     */
    public async work(db: IDatabase<any>) {
        try {
            await this.localize_tstz(db, 'ref.module_cron_cronworkplan', 'date_heure_planifiee');
        } catch (error) {
            ConsoleHandler.log('Patch20220111LocalizeCRONDate error ' + error);
        }
    }

    private async localize_tstz(db: IDatabase<any>, table_full_name: string, column_name: string) {
        var offset = new Date().getTimezoneOffset();
        // if offset equals -60 then the time zone offset is UTC+01 && 1h en timestamp = 60*60
        let nb_to_add = (offset * 60);
        console.log(nb_to_add + " = (" + offset + " * 60) add to " + column_name + " (not null) FROM " + table_full_name);

        await db.none("update " + table_full_name
            + " set " + column_name + " = " + column_name + " + " + nb_to_add
            + " where " + column_name + " is not null;");
    }
}