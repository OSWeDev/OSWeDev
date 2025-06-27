/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250627TruncateTableColumnDescVO implements IGeneratorWorker {
    private static instance: Patch20250627TruncateTableColumnDescVO = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250627TruncateTableColumnDescVO';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250627TruncateTableColumnDescVO {
        if (!Patch20250627TruncateTableColumnDescVO.instance) {
            Patch20250627TruncateTableColumnDescVO.instance = new Patch20250627TruncateTableColumnDescVO();
        }
        return Patch20250627TruncateTableColumnDescVO.instance;
    }

    /**
     * WARN : Si il y a un pb avec ce patch (des datas supprimées qui auraient pas du) il faut remonter l'info ASAP mais a priori il n'y a aucune raison d'avoir des datas dans cette table à date...
     * @param db
     * @returns
     */
    public async work(db: IDatabase<any>) {

        await db.query("TRUNCATE TABLE ref.module_dashboardbuilder_table_column_desc;");
    }
}