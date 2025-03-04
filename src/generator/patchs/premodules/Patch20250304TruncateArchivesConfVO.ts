import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250304TruncateArchivesConfVO implements IGeneratorWorker {

    private static instance: Patch20250304TruncateArchivesConfVO = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250304TruncateArchivesConfVO';
    }

    public static getInstance(): Patch20250304TruncateArchivesConfVO {
        if (!Patch20250304TruncateArchivesConfVO.instance) {
            Patch20250304TruncateArchivesConfVO.instance = new Patch20250304TruncateArchivesConfVO();
        }
        return Patch20250304TruncateArchivesConfVO.instance;
    }

    public async work(db: IDatabase<unknown>) {

        await db.query("TRUNCATE ref.module_file_archive_files_conf;");
    }
}