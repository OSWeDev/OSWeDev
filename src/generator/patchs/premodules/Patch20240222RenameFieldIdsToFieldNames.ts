/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240222RenameFieldIdsToFieldNames implements IGeneratorWorker {

    private static instance: Patch20240222RenameFieldIdsToFieldNames = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240222RenameFieldIdsToFieldNames';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240222RenameFieldIdsToFieldNames {
        if (!Patch20240222RenameFieldIdsToFieldNames.instance) {
            Patch20240222RenameFieldIdsToFieldNames.instance = new Patch20240222RenameFieldIdsToFieldNames();
        }
        return Patch20240222RenameFieldIdsToFieldNames.instance;
    }

    public async work(db: IDatabase<any>) {
        try {
            /**
             * On rename tous les champs de type field_id en field_name pour éviter la confusion avec field.id...
             */

            // Table AnonymizationFieldConfVO (anonym_field_conf) Module "anonymization" field_id => field_name
            await db.query("ALTER TABLE ref.module_anonymization_anonym_field_conf RENAME COLUMN field_id TO field_name;");

            // Table AnonymizationUserConfVO (anonym_user_conf) Module "anonymization" anon_field_id => anon_field_name
            await db.query("ALTER TABLE ref.module_anonymization_anonym_user_conf RENAME COLUMN anon_field_id TO anon_field_name;");

            // Table VarPixelFieldConfVO (var_pixel_field_conf) Module "var" pixel_vo_field_id => pixel_vo_field_name
            await db.query("ALTER TABLE ref.module_var_var_pixel_field_conf RENAME COLUMN pixel_vo_field_id TO pixel_vo_field_name;");

            // Table ContextFilterVO (context_filter) Module "contextfilter" field_id => field_name
            await db.query("ALTER TABLE ref.module_contextfilter_context_filter RENAME COLUMN field_id TO field_name;");

            // Table ContextQueryFieldVO (context_query_field) Module "contextfilter" field_id => field_name
            await db.query("ALTER TABLE ref.module_contextfilter_context_query_field RENAME COLUMN field_id TO field_name;");

            // Table SortByVO (sort_by) Module "contextfilter" field_id => field_name
            await db.query("ALTER TABLE ref.module_contextfilter_sort_by RENAME COLUMN field_id TO field_name;");

            // Table VarConfAutoParamFieldVO (var_conf_auto_param_field) Module "var" field_id => field_name
            // await db.query("ALTER TABLE ref.module_var_var_conf_auto_param_field RENAME COLUMN field_id TO field_name;");

            // Table ContextQueryJoinOnFieldVO (context_query_join_on_field) Module "contextfilter" initial_context_query_field_id_or_alias => initial_context_query_field_name_or_alias
            await db.query("ALTER TABLE ref.module_contextfilter_context_query_join_on_field RENAME COLUMN initial_context_query_field_id_or_alias TO initial_context_query_field_name_or_alias;");

        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}