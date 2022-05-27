/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleVarServer from '../../../server/modules/Var/ModuleVarServer';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210804Changebddvarsindexes implements IGeneratorWorker {

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
        await ModuleVarServer.getInstance().delete_all_cache();

        /**
         * Pour tous les types de vars
         */
        for (let api_type_id in VarsServerController.getInstance().varcacheconf_by_api_type_ids) {

            let table = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

            if (!table) {
                continue;
            }

            let fields = table.get_fields();

            /**
             * On doit lancer la requete autant de fois qu'on a de champs contenant des timestamps
             */
            let nb_runs = 0;
            for (let i in fields) {
                let field = fields[i];

                if (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) {
                    nb_runs++;
                }
            }

            while (nb_runs > 0) {
                let query = " update " + table.full_name + " a set _bdd_only_index=(" +
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