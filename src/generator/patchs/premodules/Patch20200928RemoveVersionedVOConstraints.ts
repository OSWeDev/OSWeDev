/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200924RemoveVersionedVOConstraints implements IGeneratorWorker {

    public static getInstance(): Patch20200924RemoveVersionedVOConstraints {
        if (!Patch20200924RemoveVersionedVOConstraints.instance) {
            Patch20200924RemoveVersionedVOConstraints.instance = new Patch20200924RemoveVersionedVOConstraints();
        }
        return Patch20200924RemoveVersionedVOConstraints.instance;
    }

    private static instance: Patch20200924RemoveVersionedVOConstraints = null;

    get uid(): string {
        return 'Patch20200924RemoveVersionedVOConstraints';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        /**
         * Passage de number à tstz sur la date d'expiration
         */
        await db.none("update ref.user set recovery_expiration = recovery_expiration / 1000;");


    }
}