/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import VarsInitController from '../../../shared/modules/Var/VarsInitController';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210804Changebddvarsindexes implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20210804Changebddvarsindexes {
        if (!Patch20210804Changebddvarsindexes.instance) {
            Patch20210804Changebddvarsindexes.instance = new Patch20210804Changebddvarsindexes();
        }
        return Patch20210804Changebddvarsindexes.instance;
    }

    private static instance: Patch20210804Changebddvarsindexes = null;

    get uid(): string {
        return 'Patch20210804Changebddvarsindexes';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        /**
         * On commence par vider le cache des vars - pas des imports
         */
        // await ModuleVarServer.getInstance().delete_all_cache();

        /**
         * Pour tous les types de vars
         */
        for (const api_type_id of VarsInitController.registered_vars_datas_api_type_ids) {

            const table = ModuleTableController.module_tables_by_vo_type[api_type_id];

            if (!table) {
                continue;
            }

            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[api_type_id];

            /**
             * On doit lancer la requete autant de fois qu'on a de champs contenant des timestamps
             */
            let nb_runs = 0;
            for (const i in fields) {
                const field = fields[i];

                if (field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) {
                    nb_runs++;
                }
            }

            while (nb_runs > 0) {
                const query = " update " + table.full_name + " a set _bdd_only_index=(" +
                    " select (matches.parts[1] || to_char(to_number(matches.parts[2], '9999999999999')/1000, 'FM9999999999') || ',' || to_char(to_number(matches.parts[3], '9999999999999')/1000, 'FM9999999999') || matches.parts[4]) as new_index " +
                    " from (" +
                    "   select regexp_matches(_bdd_only_index, '^(?:(.*\\[\\[)(\\d{13}),(\\d{13})(\\)\\].*))+$', 'g') as parts " +
                    "   from " + table.full_name + " as b where a.id = b.id) " +
                    " as matches) " +
                    " where _bdd_only_index ~* '^(?:(.*\\[\\[)(\\d{13}),(\\d{13})(\\)\\].*))+$'";

                await ModuleDAOServer.getInstance().query(query);

                nb_runs--;
            }
        }
    }
}