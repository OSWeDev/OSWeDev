import ModuleAnimationImportTheme from "../../../../../shared/modules/Animation/import/Theme/ModuleAnimationImportTheme";
import AnimationImportThemeVO from "../../../../../shared/modules/Animation/import/Theme/vos/AnimationImportThemeVO";
import AnimationThemeVO from "../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../../shared/modules/DAO/ModuleDAO";
import ModuleDataImport from "../../../../../shared/modules/DataImport/ModuleDataImport";
import DataImportFormatVO from "../../../../../shared/modules/DataImport/vos/DataImportFormatVO";
import DataImportHistoricVO from "../../../../../shared/modules/DataImport/vos/DataImportHistoricVO";
import DataImportLogVO from "../../../../../shared/modules/DataImport/vos/DataImportLogVO";
import LangVO from "../../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../../shared/modules/Translation/vos/TranslatableTextVO";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import DataImportModuleBase from "../../../DataImport/DataImportModuleBase/DataImportModuleBase";
import ImportLogger from "../../../DataImport/logger/ImportLogger";
import ModuleAnimationImportThemeDefaultFormats from "./ModuleAnimationImportThemeDefaultFormat";



export default class ModuleAnimationImportThemeServer extends DataImportModuleBase<AnimationImportThemeVO> {

    public static getInstance(): ModuleAnimationImportThemeServer {
        if (!ModuleAnimationImportThemeServer.instance) {
            ModuleAnimationImportThemeServer.instance = new ModuleAnimationImportThemeServer();
        }
        return ModuleAnimationImportThemeServer.instance;
    }

    private static instance: ModuleAnimationImportThemeServer = null;

    private constructor() {
        super(ModuleAnimationImportTheme.getInstance().name);
    }

    // /**
    //  * On définit les droits d'accès du module
    //  */
    // public async registerAccessPolicies(): Promise<void> {
    //     let group: AccessPolicyGroupVO = AccessPolicyServerController.get_registered_policy_group(ModuleAnimation.POLICY_GROUP);


    //     //access sinon ca bug (C:\Sources\YR\appli\node_modules\oswedev\dist\server\modules\DAO\ModuleDAOServer.js:318:178) comprendre comment ca marche si ca resoud
    //     let access: AccessPolicyVO = new AccessPolicyVO();
    //     access.group_id = group.id;
    //     access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
    //     access.translatable_name = ModuleAnimationImportTheme.POLICY_BO_ACCESS;
    //     access = await ModuleAccessPolicyServer.getInstance().registerPolicy(access, new DefaultTranslation({
    //         'fr-fr': 'Importer les themes animation'
    //     }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

    //     let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
    //     access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
    //     access_dependency.src_pol_id = access.id;
    //     access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAnimation.POLICY_BO_OTHERS_ACCESS).id;
    //     access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    // }

    public get_merged_api_type_ids(): string[] {
        return [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, AnimationThemeVO.API_TYPE_ID];
    }

    public async validate_formatted_data(themes_data: AnimationImportThemeVO[]): Promise<AnimationImportThemeVO[]> {

        let themes_db: AnimationThemeVO[] = await query(AnimationThemeVO.API_TYPE_ID).select_vos<AnimationThemeVO>();

        for (let theme_data of themes_data) {

            if (this.alreadyPresent(theme_data, themes_db)) {
                theme_data.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                theme_data.not_validated_msg = `Already present in database`;
                continue;
            }
        }
        return themes_data;
    }

    public async hook_merge_imported_datas_in_database(themeDatas: AnimationImportThemeVO[], historic: DataImportHistoricVO, format: DataImportFormatVO): Promise<boolean> {

        let res: boolean = true;
        try {

            res = res && await this.merge_imported_datas(themeDatas, historic);

        } catch (error) {
            ConsoleHandler.error(error);
            await ImportLogger.getInstance().log(historic, format, "Erreur de posttraitement : " + error, DataImportLogVO.LOG_LEVEL_FATAL);
            res = false;
        }
        return res;
    }

    public async registerImport(): Promise<void> {
        await ModuleAnimationImportThemeDefaultFormats.getInstance().AnimationImportThemeDefaultFormatLabels();
    }

    private async merge_imported_datas(themeDatas: AnimationImportThemeVO[], historic: DataImportHistoricVO): Promise<boolean> {

        if (!themeDatas || !themeDatas.length) {
            return false;
        }

        let themesInDB: AnimationThemeVO[] = await query(AnimationThemeVO.API_TYPE_ID).select_vos<AnimationThemeVO>();

        let succeeded = true;
        for (let i in themeDatas) {
            let themeData: AnimationImportThemeVO = themeDatas[i];

            if (!this.alreadyPresent(themeData, themesInDB)) {
                let theme: AnimationThemeVO = this.createThemeBase(themeData);

                let queryRes = await ModuleDAO.getInstance().insertOrUpdateVO(theme);

                if (!queryRes) {
                    succeeded = false;
                    console.log("Import error for: ");
                    console.log(`${themeData.name} with ${themeData.id_import} as id_import`);
                }

            }
        }

        return succeeded;
    }

    private alreadyPresent(themeData: AnimationImportThemeVO, themes: AnimationThemeVO[]): boolean {
        let theme_data_id_import = this.restoreData(themeData.id_import);
        let alreadyPresentTheme = themes.find((theme: AnimationThemeVO) => theme.id_import == theme_data_id_import);
        if (alreadyPresentTheme) {
            return true;
        }
        return false;
    }

    /**
     * create a vo theme for base import from themedata
     * @param themeData
     * @returns
     */
    private createThemeBase(themeData: AnimationImportThemeVO): AnimationThemeVO {
        let theme: AnimationThemeVO = new AnimationThemeVO();

        theme.description = this.restoreData(themeData.description);
        theme.name = this.restoreData(themeData.name);
        theme.weight = this.restoreData(themeData.weight);
        theme.id_import = this.restoreData(themeData.id_import);

        return theme;
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

}