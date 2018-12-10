import ModuleVO from '../../shared/modules/ModuleVO';
import ModuleDAOServer from './DAO/ModuleDAOServer';
import ModuleDAO from '../../shared/modules/DAO/ModuleDAO';

export default class ModulesManagerServer {

    public static getInstance(): ModulesManagerServer {
        if (!ModulesManagerServer.instance) {
            ModulesManagerServer.instance = new ModulesManagerServer();
        }
        return ModulesManagerServer.instance;
    }

    private static instance: ModulesManagerServer = null;

    private modulesVoByName: { [module_name: string]: ModuleVO } = {};
    private modulesVoById: { [id: number]: ModuleVO } = {};

    private constructor() { }

    public async getModuleVOByName(module_name: string): Promise<ModuleVO> {
        if (!module_name) {
            return null;
        }

        if (!this.modulesVoByName[module_name]) {
            this.modulesVoByName[module_name] = await ModuleDAOServer.getInstance().selectOne<ModuleVO>(ModuleVO.API_TYPE_ID, "where name = $1", [module_name]);
            if (this.modulesVoByName[module_name]) {
                this.modulesVoById[this.modulesVoByName[module_name].id] = this.modulesVoByName[module_name];
            }
        }

        return this.modulesVoByName[module_name];
    }

    public async getModuleVOById(module_id: number): Promise<ModuleVO> {
        if (!module_id) {
            return null;
        }

        if (!this.modulesVoById[module_id]) {
            this.modulesVoById[module_id] = await ModuleDAO.getInstance().getVoById<ModuleVO>(ModuleVO.API_TYPE_ID, module_id);
            if (this.modulesVoById[module_id]) {
                this.modulesVoByName[this.modulesVoById[module_id].name] = this.modulesVoById[module_id];
            }
        }

        return this.modulesVoById[module_id];
    }
}
