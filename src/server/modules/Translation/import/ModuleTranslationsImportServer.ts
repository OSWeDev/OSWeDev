import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import InsertOrDeleteQueryResult from '../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDataImport from '../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../shared/modules/DataImport/vos/DataImportLogVO';
import ModuleTranslationsImport from '../../../../shared/modules/Translation/import/ModuleTranslationsImport';
import ImportTranslationRaw from '../../../../shared/modules/Translation/import/vos/ImportTranslationTaw';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import AccessPolicyServerController from '../../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import DataImportModuleBase from '../../DataImport/DataImportModuleBase/DataImportModuleBase';
import ImportLogger from '../../DataImport/logger/ImportLogger';
import ModulesManagerServer from '../../ModulesManagerServer';
import ModuleTranslationsImportDefaultFormats from './ModuleTranslationsImportDefaultFormats';


export default class ModuleTranslationsImportServer extends DataImportModuleBase<ImportTranslationRaw> {

    private static instance: ModuleTranslationsImportServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleTranslationsImport.getInstance().name);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleTranslationsImportServer {
        if (!ModuleTranslationsImportServer.instance) {
            ModuleTranslationsImportServer.instance = new ModuleTranslationsImportServer();
        }
        return ModuleTranslationsImportServer.instance;
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        const group: AccessPolicyGroupVO = AccessPolicyServerController.get_registered_policy_group(ModuleTranslation.POLICY_GROUP);

        let access: AccessPolicyVO = new AccessPolicyVO();
        access.group_id = group.id;
        access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        access.translatable_name = ModuleTranslationsImport.POLICY_BO_ACCESS;
        access = await ModuleAccessPolicyServer.getInstance().registerPolicy(access, DefaultTranslationVO.create_new({
            'fr-fr': 'Importer les traductions'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = access.id;
        access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleTranslation.POLICY_BO_OTHERS_ACCESS).id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    }

    public async validate_formatted_data(datas: ImportTranslationRaw[], historic: DataImportHistoricVO): Promise<ImportTranslationRaw[]> {

        const langs_by_code: { [code_lang: string]: LangVO } = await this.get_langs_by_code();

        for (const i in datas) {
            const data: ImportTranslationRaw = datas[i];

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

    public async hook_merge_imported_datas_in_database(datas: ImportTranslationRaw[], historic: DataImportHistoricVO, format: DataImportFormatVO): Promise<boolean> {

        let res: boolean = true;
        try {

            res = res && await this.merge_imported_datas_in_translations(datas, historic);

        } catch (error) {
            ConsoleHandler.error(error);
            await ImportLogger.getInstance().log(historic, format, "Erreur de posttraitement : " + error, DataImportLogVO.LOG_LEVEL_FATAL);
            res = false;
        }
        return res;
    }

    public async registerImport(): Promise<void> {
        await ModuleTranslationsImportDefaultFormats.getInstance().TranslationsImportDefaultFormatLabels();
    }

    private async get_langs_by_code(): Promise<{ [code_lang: string]: LangVO }> {
        const langs: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
        const langs_by_code: { [code_lang: string]: LangVO } = {};

        for (const i in langs) {
            const lang = langs[i];

            langs_by_code[lang.code_lang] = lang;
        }

        return langs_by_code;
    }

    private async get_translatables_by_code(): Promise<{ [code_text: string]: TranslatableTextVO }> {
        const translatables: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID).select_vos<TranslatableTextVO>();
        const translatables_by_code: { [code_text: string]: TranslatableTextVO } = {};

        for (const i in translatables) {
            const lang = translatables[i];

            translatables_by_code[lang.code_text] = lang;
        }

        return translatables_by_code;
    }

    private async merge_imported_datas_in_translations(datas: ImportTranslationRaw[], historic: DataImportHistoricVO): Promise<boolean> {

        const options = JSON.parse(historic.params);
        const overwrite: boolean = options.overwrite;
        const langs_by_code: { [code_lang: string]: LangVO } = await this.get_langs_by_code();
        const translatables_by_code: { [code_text: string]: TranslatableTextVO } = await this.get_translatables_by_code();

        const promises: Array<Promise<any>> = [];
        const clientMarker: string[] = [];
        for (const i in datas) {
            const data: ImportTranslationRaw = datas[i];

            const lang: LangVO = langs_by_code[data.code_lang];
            let translatable: TranslatableTextVO = translatables_by_code[data.code_text];

            if (lang && translatable) {
                const translation: TranslationVO = await ModuleTranslation.getInstance().getTranslation(lang.id, translatable.id);

                if ((!overwrite) && (!!translation)) {
                    continue;
                }

                if (overwrite && translation) {
                    translation.translated = data.translated;
                    promises.push((async () => {
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(translation);
                    })());
                    continue;
                }
            }

            if (!translatable) {
                translatable = new TranslatableTextVO();

                translatable.code_text = data.code_text;
                const insertRes: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(translatable);

                if ((!insertRes) || (!insertRes.id)) {
                    ConsoleHandler.error('Erreur d\'insertion d\'un nouveau translatable en base :' + data.code_lang + ':' + data.code_text + ':' + data.translated + ':');
                    continue;
                }

                translatable = await query(TranslatableTextVO.API_TYPE_ID).filter_by_id(insertRes.id).select_vo<TranslatableTextVO>();
            }


            const new_translation: TranslationVO = new TranslationVO();

            new_translation.lang_id = lang.id;
            new_translation.text_id = translatable.id;
            new_translation.translated = data.translated;
            promises.push((async () => {
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_translation);
            })());
        }

        await all_promises(promises);
        return true;
    }
}