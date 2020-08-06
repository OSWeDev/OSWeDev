import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import ModuleTranslationsImport from '../../../../shared/modules/Translation/import/ModuleTranslationsImport';
import ImportTranslationRaw from '../../../../shared/modules/Translation/import/vos/ImportTranslationTaw';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import AccessPolicyServerController from '../../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../../AccessPolicy/ModuleAccessPolicyServer';
import DataImportModuleBase from '../../DataImport/DataImportModuleBase/DataImportModuleBase';
import ImportLogger from '../../DataImport/logger/ImportLogger';
import ModulesManagerServer from '../../ModulesManagerServer';
import ModuleTranslationsImportDefaultFormats from './ModuleTranslationsImportDefaultFormats';


export default class ModuleTranslationsImportServer extends DataImportModuleBase<ImportTranslationRaw> {

    public static getInstance(): ModuleTranslationsImportServer {
        if (!ModuleTranslationsImportServer.instance) {
            ModuleTranslationsImportServer.instance = new ModuleTranslationsImportServer();
        }
        return ModuleTranslationsImportServer.instance;
    }

    private static instance: ModuleTranslationsImportServer = null;

    private constructor() {
        super(ModuleTranslationsImport.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = AccessPolicyServerController.getInstance().get_registered_policy_group(ModuleTranslation.POLICY_GROUP);

        let access: AccessPolicyVO = new AccessPolicyVO();
        access.group_id = group.id;
        access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        access.translatable_name = ModuleTranslationsImport.POLICY_BO_ACCESS;
        access = await ModuleAccessPolicyServer.getInstance().registerPolicy(access, new DefaultTranslation({
            fr: 'Importer les traductions'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = access.id;
        access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleTranslation.POLICY_BO_OTHERS_ACCESS).id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    }

    public get_merged_api_type_ids(): string[] {
        return [TranslatableTextVO.API_TYPE_ID, LangVO.API_TYPE_ID, TranslationVO.API_TYPE_ID];
    }

    public async validate_formatted_data(datas: ImportTranslationRaw[], historic: DataImportHistoricVO): Promise<ImportTranslationRaw[]> {

        let langs_by_code: { [code_lang: string]: LangVO } = await this.get_langs_by_code();

        for (let i in datas) {
            let data: ImportTranslationRaw = datas[i];

            if (!langs_by_code[data.code_lang]) {
                data.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
                data.not_validated_msg = 'Langue inconnue';
                continue;
            }

            // // TODO FIXME l'import gère très mal les ' et " qui deviennent &apos; et &quot; on filtre en attendant de corriger
            // if (data.translated && ((data.translated.indexOf('"') >= 0) || (data.translated.indexOf("'") >= 0) ||
            //     (data.translated.indexOf('&apos;') >= 0) || (data.translated.indexOf('&quot;') >= 0))) {
            //     data.importation_state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
            //     data.not_validated_msg = 'Apostrophe ou guillemets non gérés pour le moment dans l\'importation';
            //     continue;
            // }
        }

        return datas;
    }

    public async hook_merge_imported_datas_in_database(datas: ImportTranslationRaw[], historic: DataImportHistoricVO): Promise<boolean> {

        let format: DataImportFormatVO = await ModuleDAO.getInstance().getVoById<DataImportFormatVO>(DataImportFormatVO.API_TYPE_ID, historic.data_import_format_id);

        let res: boolean = true;
        try {

            res = res && await this.merge_imported_datas_in_translations(datas, historic);

        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            await ImportLogger.getInstance().log(historic, format, "Erreur de posttraitement : " + error, DataImportLogVO.LOG_LEVEL_FATAL);
            res = false;
        }
        return res;
    }

    public async registerImport(): Promise<void> {
        await ModuleTranslationsImportDefaultFormats.getInstance().TranslationsImportDefaultFormatLabels();
    }

    private async get_langs_by_code(): Promise<{ [code_lang: string]: LangVO }> {
        let langs: LangVO[] = await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);
        let langs_by_code: { [code_lang: string]: LangVO } = {};

        for (let i in langs) {
            let lang = langs[i];

            langs_by_code[lang.code_lang] = lang;
        }

        return langs_by_code;
    }

    private async get_translatables_by_code(): Promise<{ [code_text: string]: TranslatableTextVO }> {
        let translatables: TranslatableTextVO[] = await ModuleDAO.getInstance().getVos<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID);
        let translatables_by_code: { [code_text: string]: TranslatableTextVO } = {};

        for (let i in translatables) {
            let lang = translatables[i];

            translatables_by_code[lang.code_text] = lang;
        }

        return translatables_by_code;
    }

    private async merge_imported_datas_in_translations(datas: ImportTranslationRaw[], historic: DataImportHistoricVO): Promise<boolean> {

        let options = JSON.parse(historic.params);
        let overwrite: boolean = options.overwrite;
        let langs_by_code: { [code_lang: string]: LangVO } = await this.get_langs_by_code();
        let translatables_by_code: { [code_text: string]: TranslatableTextVO } = await this.get_translatables_by_code();

        let promises: Array<Promise<any>> = [];
        let clientMarker: string[] = [];
        for (let i in datas) {
            let data: ImportTranslationRaw = datas[i];

            let lang: LangVO = langs_by_code[data.code_lang];
            let translatable: TranslatableTextVO = translatables_by_code[data.code_text];

            if (lang && translatable) {
                let translation: TranslationVO = await ModuleTranslation.getInstance().getTranslation(lang.id, translatable.id);

                if ((!overwrite) && (!!translation)) {
                    continue;
                }

                if (overwrite && translation) {
                    translation.translated = data.translated;
                    promises.push((async () => {
                        await ModuleDAO.getInstance().insertOrUpdateVO(translation);
                    })());
                    continue;
                }
            }

            if (!translatable) {
                translatable = new TranslatableTextVO();

                translatable.code_text = data.code_text;
                let insertRes: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(translatable);

                if ((!insertRes) || (!insertRes.id)) {
                    ConsoleHandler.getInstance().error('Erreur d\'insertion d\'un nouveau translatable en base :' + data.code_lang + ':' + data.code_text + ':' + data.translated + ':');
                    continue;
                }

                translatable = await ModuleDAO.getInstance().getVoById<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, parseInt(insertRes.id.toString()));
            }


            let new_translation: TranslationVO = new TranslationVO();

            new_translation.lang_id = lang.id;
            new_translation.text_id = translatable.id;
            new_translation.translated = data.translated;
            promises.push((async () => {
                await ModuleDAO.getInstance().insertOrUpdateVO(new_translation);
            })());
        }

        await Promise.all(promises);
        return true;
    }
}