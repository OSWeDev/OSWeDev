import RoleVO from "../../../../../shared/modules/AccessPolicy/vos/RoleVO";
import ModuleAnimationImportModule from "../../../../../shared/modules/Animation/import/Module/ModuleAnimationImportModule";
import AnimationImportModuleVO from "../../../../../shared/modules/Animation/import/Module/vos/AnimationImportModuleVO";
import AnimationModuleVO from "../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import ModuleDAO from "../../../../../shared/modules/DAO/ModuleDAO";
import InsertOrDeleteQueryResult from "../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult";
import DataImportFormatVO from "../../../../../shared/modules/DataImport/vos/DataImportFormatVO";
import DataImportHistoricVO from "../../../../../shared/modules/DataImport/vos/DataImportHistoricVO";
import DataImportLogVO from "../../../../../shared/modules/DataImport/vos/DataImportLogVO";
import NumRange from "../../../../../shared/modules/DataRender/vos/NumRange";
import NumSegment from "../../../../../shared/modules/DataRender/vos/NumSegment";
import LangVO from "../../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../../shared/modules/Translation/vos/TranslatableTextVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import DataImportModuleBase from "../../../DataImport/DataImportModuleBase/DataImportModuleBase";
import ImportLogger from "../../../DataImport/logger/ImportLogger";
import ModuleAnimationImportModuleDefaultFormats from "./ModuleAnimationImportModuleDefaultFormat";



export default class ModuleAnimationImportModuleServer extends DataImportModuleBase<AnimationImportModuleVO> {

    public static getInstance(): ModuleAnimationImportModuleServer {
        if (!ModuleAnimationImportModuleServer.instance) {
            ModuleAnimationImportModuleServer.instance = new ModuleAnimationImportModuleServer();
        }
        return ModuleAnimationImportModuleServer.instance;
    }

    private static instance: ModuleAnimationImportModuleServer = null;

    private constructor() {
        super(ModuleAnimationImportModule.getInstance().name);
    }

    // /**
    //  * On définit les droits d'accès du module
    //  */
    // public async registerAccessPolicies(): Promise<void> {
    //     let group: AccessPolicyGroupVO = AccessPolicyServerController.getInstance().get_registered_policy_group(ModuleAnimation.POLICY_GROUP);

    //     let access: AccessPolicyVO = new AccessPolicyVO();
    //     access.group_id = group.id;
    //     access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    //     access.translatable_name = ModuleAnimationImportModule.POLICY_BO_ACCESS;
    //     access = await ModuleAccessPolicyServer.getInstance().registerPolicy(access, new DefaultTranslation({
    //         fr: 'Importer les modules animation'
    //     }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    //     let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
    //     access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    //     console.log(":", access, ":");
    //     access_dependency.src_pol_id = access.id;
    //     access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAnimation.POLICY_BO_OTHERS_ACCESS).id;
    //     access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    // }

    public get_merged_api_type_ids(): string[] {
        return [AnimationModuleVO.API_TYPE_ID];
    }

    public async hook_merge_imported_datas_in_database(moduleDatas: AnimationImportModuleVO[], historic: DataImportHistoricVO): Promise<boolean> {

        let format: DataImportFormatVO = await ModuleDAO.getInstance().getVoById<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID, historic.data_import_format_id);

        let res: boolean = true;
        try {

            res = res && await this.merge_imported_datas(moduleDatas);

        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            await ImportLogger.getInstance().log(historic, format, "Erreur de posttraitement : " + error, DataImportLogVO.LOG_LEVEL_FATAL);
            res = false;
        }
        return res;
    }

    public async registerImport(): Promise<void> {
        await ModuleAnimationImportModuleDefaultFormats.getInstance().AnimationImportModuleDefaultFormatLabels();
    }

    private async merge_imported_datas(moduleDatas: AnimationImportModuleVO[]): Promise<boolean> {

        if (!moduleDatas || !moduleDatas.length) {
            return false;
        }

        let themes: AnimationThemeVO[] = await ModuleDAO.getInstance().getVos(AnimationThemeVO.API_TYPE_ID);

        let modulesInDB: AnimationModuleVO[] = await ModuleDAO.getInstance().getVos(AnimationModuleVO.API_TYPE_ID);
        let roles: RoleVO[] = await ModuleDAO.getInstance().getVos(RoleVO.API_TYPE_ID);

        let succeeded = true;
        for (let i in moduleDatas) {
            let moduleData: AnimationImportModuleVO = moduleDatas[i];
            if (!this.alreadyPresent(moduleData, modulesInDB)) {

                let module: AnimationModuleVO = this.createModuleBase(moduleData, themes, roles);
                let queryRes: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(module);

                if (!queryRes) {
                    succeeded = false;
                    console.log("Import error for: ");
                    console.log(`${moduleData.name} with ${moduleData.id_import} as id_import`);
                }
            }
        }

        return succeeded;
    }

    /**
     * looks if the data module is in db already by checking on id_import
     * @param moduleData imported datas
     * @param modules modules in db
     * @returns true if already in db
     */
    private alreadyPresent(moduleData: AnimationImportModuleVO, modules: AnimationModuleVO[]): boolean {
        let module_data_id_import = this.restoreData(moduleData.id_import);
        let alreadyPresentModule = modules.find((module: AnimationModuleVO) => module.id_import == module_data_id_import);
        if (alreadyPresentModule) {
            return true;
        }
        return false;
    }

    private createModuleBase(moduleData: AnimationImportModuleVO, themes: AnimationThemeVO[], roles: RoleVO[]): AnimationModuleVO {

        let module: AnimationModuleVO = new AnimationModuleVO();

        module.name = this.restoreData(moduleData.name);
        module.description = this.restoreData(moduleData.description);
        module.messages = this.restoreData(moduleData.messages);
        module.computed_name = this.restoreData(moduleData.computed_name);
        module.weight = this.restoreData(moduleData.weight);
        module.document_id = this.restoreData(moduleData.document_id);
        module.role_id_ranges = this.restoreRoleIdRanges(moduleData.role_id_ranges, roles);
        module.id_import = this.restoreData(moduleData.id_import);

        let module_theme = this.restoreData(moduleData.theme_id_import);
        let associated_theme = themes.find((theme) => theme.id_import == module_theme);

        if (associated_theme) {
            module.theme_id = associated_theme.id;
        }



        return module;
    }

    private restoreData(QRDtataValue: string): any {
        let value: any;
        try {
            value = JSON.parse(QRDtataValue);
        } catch (error) {
            value = QRDtataValue;
        }
        return value;
    }

    private restoreRoleIdRanges(stringified_role_names: string, roles: RoleVO[]): NumRange[] {
        let role_names = this.restoreData(stringified_role_names);
        let role_ids = [];
        for (let role_name of role_names) {
            let referenced_role = roles.find((role) => role.translatable_name == role_name);
            role_ids.push(referenced_role.id);
        }

        role_ids = role_ids.sort();
        let role_numranges: NumRange[] = [];

        for (let id of role_ids) {

            if (role_ids.includes(id - 1)) {
                let role_numrange = role_numranges[role_numranges.length - 1];
                role_numrange.max += 1;
            } else {
                let numRange = NumRange.createNew(id, id + 1, true, false, NumSegment.TYPE_INT);
                role_numranges.push(numRange);
            }
        }

        return role_numranges;
    }

}