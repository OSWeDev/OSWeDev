/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20231117AddUniqCookieNamePopup implements IGeneratorWorker {

    public static getInstance(): Patch20231117AddUniqCookieNamePopup {
        if (!Patch20231117AddUniqCookieNamePopup.instance) {
            Patch20231117AddUniqCookieNamePopup.instance = new Patch20231117AddUniqCookieNamePopup();
        }
        return Patch20231117AddUniqCookieNamePopup.instance;
    }

    private static instance: Patch20231117AddUniqCookieNamePopup = null;

    get uid(): string {
        return 'Patch20231117AddUniqCookieNamePopup';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("update ref.module_popup_popup set cookie_name = null where id in (select a.id  from ref.module_popup_popup a join ref.module_popup_popup b on a.id < b.id where a.cookie_name = b.cookie_name);");
            await db.query('DELETE from ref.module_popup_popup a where a.cookie_name is null or title is null or message is null;');
            await db.query('DELETE from versioned.module_popup_popup a where a.cookie_name is null or title is null or message is null;');
            await db.query('DELETE from trashed__versioned.module_popup_popup a where a.cookie_name is null or title is null or message is null;');
            await db.query('DELETE from trashed.module_popup_popup a where a.cookie_name is null or title is null or message is null;');
            await db.query('ALTER TABLE ref.module_popup_popup ADD CONSTRAINT uniq_cookie_name UNIQUE (cookie_name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}