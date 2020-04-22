/* istanbul ignore next: no unit tests on patchs */
import { IDatabase } from 'pg-promise';
import ModuleAccessPolicyServer from '../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModulesManagerServer from '../../../server/modules/ModulesManagerServer';
import ModuleTranslationServer from '../../../server/modules/Translation/ModuleTranslationServer';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200325PresetExistingLangsChangeRights implements IGeneratorWorker {

    public static getInstance(): Patch20200325PresetExistingLangsChangeRights {
        if (!Patch20200325PresetExistingLangsChangeRights.instance) {
            Patch20200325PresetExistingLangsChangeRights.instance = new Patch20200325PresetExistingLangsChangeRights();
        }
        return Patch20200325PresetExistingLangsChangeRights.instance;
    }

    private static instance: Patch20200325PresetExistingLangsChangeRights = null;

    get uid(): string {
        return 'Patch20200325PresetExistingLangsChangeRights';
    }

    private constructor() { }

    /**
     * On check tous les foreign keys et on compare le param cascade en bdd au param issu du code
     */
    public async work(db: IDatabase<any>) {

        try {
            let langs: LangVO[] = await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);

            for (let i in langs) {
                let lang = langs[i];

                let LANG_SELECTOR_PER_LANG_ACCESS: AccessPolicyVO = new AccessPolicyVO();
                LANG_SELECTOR_PER_LANG_ACCESS.group_id = ModuleTranslationServer.getInstance().policy_group.id;
                LANG_SELECTOR_PER_LANG_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
                LANG_SELECTOR_PER_LANG_ACCESS.translatable_name = ModuleTranslation.getInstance().get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang.id);
                LANG_SELECTOR_PER_LANG_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(LANG_SELECTOR_PER_LANG_ACCESS, new DefaultTranslation({
                    fr: 'Outil - Peut choisir la langue : ' + lang.code_lang
                }), await ModulesManagerServer.getInstance().getModuleVOByName(ModuleTranslationServer.getInstance().name));
            }
        } catch (error) {
        }
    }
}