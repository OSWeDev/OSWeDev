import ModuleVO from '../../shared/modules/ModuleVO';
import ModuleDAOServer from './DAO/ModuleDAOServer';

export default class ModulesManagerServer {

    public static getInstance(): ModulesManagerServer {
        if (!ModulesManagerServer.instance) {
            ModulesManagerServer.instance = new ModulesManagerServer();
        }
        return ModulesManagerServer.instance;
    }

    private static instance: ModulesManagerServer = null;

    private constructor() { }

    public async getModuleVOByName(module_name: string): Promise<ModuleVO> {
        if (!module_name) {
            return;
        }

        return await ModuleDAOServer.getInstance().selectOne<ModuleVO>(ModuleVO.API_TYPE_ID, "where name = $1", [module_name]);
    }
}
