/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class ChangeCronDateHeurePlanifiee implements IGeneratorWorker {

    public static getInstance(): ChangeCronDateHeurePlanifiee {
        if (!ChangeCronDateHeurePlanifiee.instance) {
            ChangeCronDateHeurePlanifiee.instance = new ChangeCronDateHeurePlanifiee();
        }
        return ChangeCronDateHeurePlanifiee.instance;
    }

    private static instance: ChangeCronDateHeurePlanifiee = null;

    get uid(): string {
        return 'ChangeCronDateHeurePlanifiee';
    }

    private constructor() { }

    /**
     * Objectif : Passer la colonne Date heure planifiee en NOT NULL
     */
    public async work(db: IDatabase<any>) {
        try {
            // On drop la table des notifications pour forcer sa création propre. Les anciennes notifications sont de toutes façons inutilisées pour le moment.
            await db.none("ALTER TABLE ref.module_cron_cronworkplan ALTER COLUMN date_heure_planifiee DROP NOT NULL;");
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }
}