/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240329AddManyuniqsconstraints implements IGeneratorWorker {

    private static instance: Patch20240329AddManyuniqsconstraints = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240329AddManyuniqsconstraints';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240329AddManyuniqsconstraints {
        if (!Patch20240329AddManyuniqsconstraints.instance) {
            Patch20240329AddManyuniqsconstraints.instance = new Patch20240329AddManyuniqsconstraints();
        }
        return Patch20240329AddManyuniqsconstraints.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            await db.query('ALTER TABLE admin.modules ADD CONSTRAINT uniq_modules_name UNIQUE (name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }

        try {
            await db.query('ALTER TABLE ref.module_var_var_conf ADD CONSTRAINT uniq_module_var_var_conf_name UNIQUE (name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }

        try {
            await db.query('ALTER TABLE ref.module_supervision_supervision_cat ADD CONSTRAINT uniq_module_supervision_supervision_cat_name UNIQUE (name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }

        try {
            await db.query('ALTER TABLE ref.module_mailer_mail_category ADD CONSTRAINT uniq_module_mailer_mail_category_name UNIQUE (name);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }

        try {
            await db.query('ALTER TABLE ref.module_mailer_mail ADD CONSTRAINT uniq_module_mailer_mail_message_id UNIQUE (message_id);');
        } catch (error) {
            ConsoleHandler.log('Ignore this error if constraint exists: ' + error);
        }
    }
}