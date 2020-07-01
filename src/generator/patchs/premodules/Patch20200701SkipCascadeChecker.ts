/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200701SkipCascadeChecker implements IGeneratorWorker {

    public static getInstance(): Patch20200701SkipCascadeChecker {
        if (!Patch20200701SkipCascadeChecker.instance) {
            Patch20200701SkipCascadeChecker.instance = new Patch20200701SkipCascadeChecker();
        }
        return Patch20200701SkipCascadeChecker.instance;
    }

    private static instance: Patch20200701SkipCascadeChecker = null;

    get uid(): string {
        return 'Patch20200701SkipCascadeChecker';
    }

    private constructor() { }

    /**
     * On considère que le gap est assez grand maintenant en version pour considérer que ce patch est déjà passé
     */
    public async work(db: IDatabase<any>) {

        try {
            await db.none("select * from generator.workers where uid='Patch20200305CascadeChecker';");
            await db.none("insert into generator.workers (uid) values ('Patch20200305CascadeChecker');");
        } catch (e) {

        }
    }
}