/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200131DeleteVersioningVOAccessPolicies implements IGeneratorWorker {

    public static getInstance(): Patch20200131DeleteVersioningVOAccessPolicies {
        if (!Patch20200131DeleteVersioningVOAccessPolicies.instance) {
            Patch20200131DeleteVersioningVOAccessPolicies.instance = new Patch20200131DeleteVersioningVOAccessPolicies();
        }
        return Patch20200131DeleteVersioningVOAccessPolicies.instance;
    }

    private static instance: Patch20200131DeleteVersioningVOAccessPolicies = null;

    get uid(): string {
        return 'Patch20200131DeleteVersioningVOAccessPolicies';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            // Supprimer pour tous les vos qui servent à versionner d'autres VO les droits d'accès
            await db.query("delete from ref.module_access_policy_accpol where translatable_name like ' %.versioned__ % ' or translatable_name like ' %.__trashed__versioned__ % ' or translatable_name like ' %.__trashed__ %';");
        } catch (error) {
            console.error('Patch20200131DeleteVersioningVOAccessPolicies : ' + error);
        }
    }
}