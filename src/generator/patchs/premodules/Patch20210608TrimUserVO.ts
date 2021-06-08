/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210608TrimUserVO implements IGeneratorWorker {

    public static getInstance(): Patch20210608TrimUserVO {
        if (!Patch20210608TrimUserVO.instance) {
            Patch20210608TrimUserVO.instance = new Patch20210608TrimUserVO();
        }
        return Patch20210608TrimUserVO.instance;
    }

    private static instance: Patch20210608TrimUserVO = null;

    get uid(): string {
        return 'Patch20210608TrimUserVO';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.none("update ref.user set name = TRIM(name), email = TRIM(email), phone = TRIM(phone);");
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }
}