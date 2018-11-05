import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import GetTranslationParamVO from '../../../shared/modules/Translation/apis/GetTranslationParamVO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';

export default class ModuleTranslationServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleTranslationServer.instance) {
            ModuleTranslationServer.instance = new ModuleTranslationServer();
        }
        return ModuleTranslationServer.instance;
    }

    private static instance: ModuleTranslationServer = null;

    private constructor() {
        super(ModuleTranslation.getInstance().name);
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleTranslation.POLICY_GROUP;
        await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group);

        let bo_translations_access: AccessPolicyVO = new AccessPolicyVO();
        bo_translations_access.group_id = group.id;
        bo_translations_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_translations_access.translatable_name = ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS;
        await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_translations_access);
        // let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        // admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        // admin_access_dependency.src_pol_id = bo_translations_access.id;
        // admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().registered_policies[ModuleAccessPolicy.POLICY_BO_ACCESS].id;
        // await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let bo_others_access: AccessPolicyVO = new AccessPolicyVO();
        bo_others_access.group_id = group.id;
        bo_others_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_others_access.translatable_name = ModuleTranslation.POLICY_BO_OTHERS_ACCESS;
        await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_others_access);
        // admin_access_dependency = new PolicyDependencyVO();
        // admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        // admin_access_dependency.src_pol_id = bo_others_access.id;
        // admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().registered_policies[ModuleAccessPolicy.POLICY_BO_ACCESS].id;
        // await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
        let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = bo_others_access.id;
        access_dependency.depends_on_pol_id = bo_translations_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);

        let on_page_translation_module_access: AccessPolicyVO = new AccessPolicyVO();
        on_page_translation_module_access.group_id = group.id;
        on_page_translation_module_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        on_page_translation_module_access.translatable_name = ModuleTranslation.POLICY_ON_PAGE_TRANSLATION_MODULE_ACCESS;
        await ModuleAccessPolicyServer.getInstance().registerPolicy(on_page_translation_module_access);
        access_dependency = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = on_page_translation_module_access.id;
        access_dependency.depends_on_pol_id = bo_translations_access.id;
        await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_ALL_TRANSLATIONS, this.getAllTranslations.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_LANGS, this.getLangs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXT, this.getTranslatableText.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATABLE_TEXTS, this.getTranslatableTexts.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATION, this.getTranslation.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_GET_TRANSLATIONS, this.getTranslations.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleTranslation.APINAME_getALL_LOCALES, this.getALL_LOCALES.bind(this));
    }

    public async getTranslatableTexts(): Promise<TranslatableTextVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID);
    }

    public async getTranslatableText(param: StringParamVO): Promise<TranslatableTextVO> {
        return await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, 'where code_text = $1', [param.text]);
    }

    public async getLangs(): Promise<LangVO[]> {
        return await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);
    }

    public async getAllTranslations(): Promise<TranslationVO[]> {
        return await ModuleDAO.getInstance().getVos<TranslationVO>(TranslationVO.API_TYPE_ID);
    }

    public async getTranslations(param: NumberParamVO): Promise<TranslationVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1', [param.num]);
    }

    public async getTranslation(params: GetTranslationParamVO): Promise<TranslationVO> {
        return await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, 'WHERE t.lang_id = $1 and t.text_id = $2', [params.lang_id, params.text_id]);
    }

    public addCodeToLocales(ALL_LOCALES: { [code_lang: string]: any }, code_lang: string, code_text: string, translated: string): { [code_lang: string]: any } {

        if (!ALL_LOCALES) {
            ALL_LOCALES = {};
        }

        if ((!code_lang) || (!code_text)) {
            return ALL_LOCALES;
        }

        if (!translated) {
            translated = "";
        }

        let tmp_code_text_segs: string[] = code_text.split('.');
        let code_text_segs: string[] = [];

        for (let i in tmp_code_text_segs) {
            if (tmp_code_text_segs[i] && (tmp_code_text_segs[i] != "")) {
                code_text_segs.push(tmp_code_text_segs[i]);
            }
        }

        if (!ALL_LOCALES[code_lang]) {
            ALL_LOCALES[code_lang] = {};
        }

        let locale_pointer = ALL_LOCALES[code_lang];
        for (let i in code_text_segs) {
            let code_text_seg = code_text_segs[i];

            if (parseInt(i.toString()) == (code_text_segs.length - 1)) {

                locale_pointer[code_text_seg] = translated;
                break;
            }

            if (!locale_pointer[code_text_seg]) {
                locale_pointer[code_text_seg] = {};
            }

            locale_pointer = locale_pointer[code_text_seg];
        }

        return ALL_LOCALES;
    }

    private async getALL_LOCALES(): Promise<{ [code_lang: string]: any }> {
        let langs: LangVO[] = await this.getLangs();
        let translatableTexts: TranslatableTextVO[] = await this.getTranslatableTexts();
        let translatableTexts_by_id: { [id: number]: TranslatableTextVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(translatableTexts);
        let res: { [code_lang: string]: any } = {};

        for (let i in langs) {
            let lang: LangVO = langs[i];
            let translations: TranslationVO[] = await ModuleTranslation.getInstance().getTranslations(lang.id);

            for (let j in translations) {
                let translation: TranslationVO = translations[j];

                if (!translation.text_id) {
                    continue;
                }

                res = this.addCodeToLocales(res, lang.code_lang.toLowerCase(), translatableTexts_by_id[translation.text_id].code_text, translation.translated);
            }
        }
        return res;
    }
}