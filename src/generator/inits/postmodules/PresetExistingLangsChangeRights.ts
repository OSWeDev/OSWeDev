/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModulesManagerServer from '../../../server/modules/ModulesManagerServer';
import ModuleTranslationServer from '../../../server/modules/Translation/ModuleTranslationServer';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class PresetExistingLangsChangeRights implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): PresetExistingLangsChangeRights {
        if (!PresetExistingLangsChangeRights.instance) {
            PresetExistingLangsChangeRights.instance = new PresetExistingLangsChangeRights();
        }
        return PresetExistingLangsChangeRights.instance;
    }

    private static instance: PresetExistingLangsChangeRights = null;

    get uid(): string {
        return 'PresetExistingLangsChangeRights';
    }

    private constructor() { }

    /**
     * On check tous les foreign keys et on compare le param cascade en bdd au param issu du code
     */
    public async work(db: IDatabase<any>) {

        try {
            const langs: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos();

            for (const i in langs) {
                const lang = langs[i];

                let LANG_SELECTOR_PER_LANG_ACCESS: AccessPolicyVO = new AccessPolicyVO();
                LANG_SELECTOR_PER_LANG_ACCESS.group_id = ModuleTranslationServer.getInstance().policy_group.id;
                LANG_SELECTOR_PER_LANG_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
                LANG_SELECTOR_PER_LANG_ACCESS.translatable_name = ModuleTranslation.getInstance().get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang.id);
                LANG_SELECTOR_PER_LANG_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(LANG_SELECTOR_PER_LANG_ACCESS, DefaultTranslationVO.create_new({
                    'fr-fr': 'Outil - Peut choisir la langue : ' + lang.code_lang
                }), await ModulesManagerServer.getInstance().getModuleVOByName(ModuleTranslationServer.getInstance().name));
            }
        } catch (error) {
        }
    }
}