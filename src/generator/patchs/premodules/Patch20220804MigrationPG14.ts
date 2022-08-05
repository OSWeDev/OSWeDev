/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleTableDBService from '../../../server/modules/ModuleTableDBService';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220804MigrationPG14 implements IGeneratorWorker {

    public static getInstance(): Patch20220804MigrationPG14 {
        if (!Patch20220804MigrationPG14.instance) {
            Patch20220804MigrationPG14.instance = new Patch20220804MigrationPG14();
        }
        return Patch20220804MigrationPG14.instance;
    }

    private static instance: Patch20220804MigrationPG14 = null;

    get uid(): string {
        return 'Patch20220804MigrationPG14';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await this.migrateAnimation(db);
        await this.migrateContextFilter(db);
    }

    private async migrateAnimation(db: IDatabase<any>) {
        try {
            await ModuleTableDBService.getInstance(db).migrate_column_to_multirange(
                "animation",
                "ref.module_animation_anim_parameters",
                ['document_id_ranges'],
                'nummultirange',
            );
            await ModuleTableDBService.getInstance(db).migrate_column_to_multirange(
                "animation",
                "ref.module_animation_anim_module",
                ['role_id_ranges'],
                'nummultirange',
            );
            await ModuleTableDBService.getInstance(db).migrate_column_to_multirange(
                "animation",
                "ref.module_animation_theme_module_data_ranges",
                ['theme_id_ranges', 'module_id_ranges', 'user_id_ranges'],
                'nummultirange',
            );
        } catch (error) {
            ConsoleHandler.getInstance().log('Erreur migration migrateAnimation: ' + error);
        }
    }

    private async migrateContextFilter(db: IDatabase<any>) {

        try {
            await ModuleTableDBService.getInstance(db).migrate_column_to_multirange(
                "contextfilter",
                "ref.module_contextfilter_context_filter",
                ['param_numranges'],
                'nummultirange',
            );
            await ModuleTableDBService.getInstance(db).migrate_column_to_multirange(
                "contextfilter",
                "ref.module_contextfilter_context_filter",
                ['param_hourranges'],
                'int8multirange',
            );
        } catch (error) {
            ConsoleHandler.getInstance().log('Erreur migration migrateContextFilter: ' + error);
        }
    }
}