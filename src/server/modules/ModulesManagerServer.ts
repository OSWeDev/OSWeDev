import { query } from '../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleVO from '../../shared/modules/ModuleVO';

export default class ModulesManagerServer {

    public static getInstance(): ModulesManagerServer {
        if (!ModulesManagerServer.instance) {
            ModulesManagerServer.instance = new ModulesManagerServer();
        }
        return ModulesManagerServer.instance;
    }

    private static instance: ModulesManagerServer = null;

    /**
     * Local thread cache -----
     */

    private modulesVoByName: { [module_name: string]: ModuleVO } = {};
    private modulesVoById: { [id: number]: ModuleVO } = {};
    private preloaded: boolean = false;
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    public async preload_modules() {

        if (this.preloaded) {
            return;
        }
        this.preloaded = true;

        let modules = await query(ModuleVO.API_TYPE_ID).select_vos<ModuleVO>();

        for (let i in modules) {
            let module_ = modules[i];
            this.modulesVoByName[module_.name] = module_;
            this.modulesVoById[module_.id] = module_;
        }
    }

    public async getModuleVOByName(module_name: string): Promise<ModuleVO> {
        if (!module_name) {
            return null;
        }

        if (!this.modulesVoByName[module_name]) {
            this.modulesVoByName[module_name] = await query(ModuleVO.API_TYPE_ID).filter_by_text_eq('name', module_name).select_vo<ModuleVO>();
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
            this.modulesVoById[module_id] = await query(ModuleVO.API_TYPE_ID).filter_by_id(module_id).select_vo<ModuleVO>();
            if (this.modulesVoById[module_id]) {
                this.modulesVoByName[this.modulesVoById[module_id].name] = this.modulesVoById[module_id];
            }
        }

        return this.modulesVoById[module_id];
    }
}
