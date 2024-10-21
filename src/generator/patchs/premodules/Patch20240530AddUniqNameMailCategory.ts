/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240530AddUniqNameMailCategory implements IGeneratorWorker {

    private static instance: Patch20240530AddUniqNameMailCategory = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240530AddUniqNameMailCategory';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240530AddUniqNameMailCategory {
        if (!Patch20240530AddUniqNameMailCategory.instance) {
            Patch20240530AddUniqNameMailCategory.instance = new Patch20240530AddUniqNameMailCategory();
        }
        return Patch20240530AddUniqNameMailCategory.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE ref.module_mailer_mail_category ADD CONSTRAINT module_mailer_mail_category__uniq__name UNIQUE (name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}