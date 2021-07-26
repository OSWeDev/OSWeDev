import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../../generator/IGeneratorWorker';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';


export default class Patch20201125InitVarsBDDIndexes implements IGeneratorWorker {

    public static getInstance(): Patch20201125InitVarsBDDIndexes {
        if (!Patch20201125InitVarsBDDIndexes.instance) {
            Patch20201125InitVarsBDDIndexes.instance = new Patch20201125InitVarsBDDIndexes();
        }
        return Patch20201125InitVarsBDDIndexes.instance;
    }

    private static instance: Patch20201125InitVarsBDDIndexes = null;

    get uid(): string {
        return 'Patch20201125InitVarsBDDIndexes';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        for (let api_type_id in VarsServerController.getInstance().varcacheconf_by_api_type_ids) {

            let vos: VarDataBaseVO[] = await ModuleDAO.getInstance().getVos<VarDataBaseVO>(api_type_id);
            vos = vos.filter((vo) => !vo['_bdd_only_index']);

            for (let i in vos) {
                let vo = vos[i];

                vo['_bdd_only_index'] = vo.index;
            }
            await ModuleDAO.getInstance().insertOrUpdateVOs(vos);
        }
    }
}