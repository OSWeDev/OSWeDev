import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200331DeleteOrphanTranslations implements IGeneratorWorker {

    public static getInstance(): Patch20200331DeleteOrphanTranslations {
        if (!Patch20200331DeleteOrphanTranslations.instance) {
            Patch20200331DeleteOrphanTranslations.instance = new Patch20200331DeleteOrphanTranslations();
        }
        return Patch20200331DeleteOrphanTranslations.instance;
    }

    private static instance: Patch20200331DeleteOrphanTranslations = null;

    get uid(): string {
        return 'Patch20200331DeleteOrphanTranslations';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("delete from ref.module_translation_translation where lang_id is null or text_id is null");
        } catch (error) { }
    }
}