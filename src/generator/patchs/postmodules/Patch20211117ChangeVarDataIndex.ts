/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleVarServer from '../../../server/modules/Var/ModuleVarServer';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20211117ChangeVarDataIndex implements IGeneratorWorker {

    public static getInstance(): Patch20211117ChangeVarDataIndex {
        if (!Patch20211117ChangeVarDataIndex.instance) {
            Patch20211117ChangeVarDataIndex.instance = new Patch20211117ChangeVarDataIndex();
        }
        return Patch20211117ChangeVarDataIndex.instance;
    }

    private static instance: Patch20211117ChangeVarDataIndex = null;

    get uid(): string {
        return 'Patch20211117ChangeVarDataIndex';
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
            ConsoleHandler.getInstance().log('Patch20211117ChangeVarDataIndex api à traiter:' + api_type_id);

            // TODO FIXME specifique PSP
            // supprimer apres migration complete
            if (api_type_id == 'store_day_data_ranges') {
                let vos: VarDataBaseVO[] = await ModuleDAO.getInstance().getVos(api_type_id);
                for (let vo of vos) {
                    try {
                        let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(vo);

                        if (!res) {
                            let inbdds: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids(api_type_id, [vo]);
                            if (inbdds && inbdds.length) {
                                ConsoleHandler.getInstance().error(JSON.stringify(vo) + ':::' + JSON.stringify(inbdds[0]));
                            } else {
                                ConsoleHandler.getInstance().error(JSON.stringify(vo) + '---');
                            }
                        }
                    } catch (e) {
                        ConsoleHandler.getInstance().error('Patch20211117ChangeVarDataIndex ERROR:' + api_type_id);
                        ConsoleHandler.getInstance().log(vo._bdd_only_index);
                        ConsoleHandler.getInstance().error(e);
                    }
                }

            } else {
                try {
                    let vos = await ModuleDAO.getInstance().getVos(api_type_id);
                    await ModuleDAO.getInstance().insertOrUpdateVOs(vos);
                } catch (e) {
                    ConsoleHandler.getInstance().error('Patch20211117ChangeVarDataIndex ERROR:' + api_type_id);
                    ConsoleHandler.getInstance().error(e);
                }
            }
        }
    }
}