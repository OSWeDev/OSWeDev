/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200924UpgradeUserVO implements IGeneratorWorker {

    public static getInstance(): Patch20200924UpgradeUserVO {
        if (!Patch20200924UpgradeUserVO.instance) {
            Patch20200924UpgradeUserVO.instance = new Patch20200924UpgradeUserVO();
        }
        return Patch20200924UpgradeUserVO.instance;
    }

    private static instance: Patch20200924UpgradeUserVO = null;

    get uid(): string {
        return 'Patch20200924UpgradeUserVO';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            /**
             * Passage de number à tstz sur la date d'expiration
             */
            await db.none("update ref.user set recovery_expiration = recovery_expiration / 1000;");
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }
}