import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableCompositeUniqueKeyController from '../DAO/ModuleTableCompositeUniqueKeyController';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import URLAliasCRUDConfVO from './vos/URLAliasCRUDConfVO';
import URLAliasVO from './vos/URLAliasVO';


export default class ModuleURL extends Module {

    public static MODULE_NAME: string = 'Url';

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleURL.MODULE_NAME;

    private static instance: ModuleURL = null;

    private constructor() {

        super("url", ModuleURL.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleURL {
        if (!ModuleURL.instance) {
            ModuleURL.instance = new ModuleURL();
        }
        return ModuleURL.instance;
    }

    public initialize() {

        this.initialize_URLAliasVO();
        this.initialize_URLAliasCRUDConfVO();
    }

    private initialize_URLAliasVO() {
        const label = ModuleTableFieldController.create_new(URLAliasVO.API_TYPE_ID, field_names<URLAliasVO>().alias_url, ModuleTableFieldVO.FIELD_TYPE_string, 'Alias d\'URL', true).unique();
        ModuleTableFieldController.create_new(URLAliasVO.API_TYPE_ID, field_names<URLAliasVO>().initial_url, ModuleTableFieldVO.FIELD_TYPE_string, 'URL initiale', true);
        ModuleTableFieldController.create_new(URLAliasVO.API_TYPE_ID, field_names<URLAliasVO>().url_alias_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Conf qui génère l\'alias', false)
            .set_many_to_one_target_moduletable_name(URLAliasCRUDConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(URLAliasVO.API_TYPE_ID, field_names<URLAliasVO>().vo_id, ModuleTableFieldVO.FIELD_TYPE_int, 'Id du VO auquel est liée cet alias', false);

        ModuleTableController.create_new(this.name, URLAliasVO, label, 'Alias d\'URL');
    }

    private initialize_URLAliasCRUDConfVO() {
        const lang_id = ModuleTableFieldController.create_new(URLAliasCRUDConfVO.API_TYPE_ID, field_names<URLAliasCRUDConfVO>().lang_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Langue', true)
            .set_many_to_one_target_moduletable_name('Lang');
        const moduletable_ref_id = ModuleTableFieldController.create_new(URLAliasCRUDConfVO.API_TYPE_ID, field_names<URLAliasCRUDConfVO>().moduletable_ref_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'ModuleTable', true)
            .set_many_to_one_target_moduletable_name('ModuleTable');
        ModuleTableFieldController.create_new(URLAliasCRUDConfVO.API_TYPE_ID, field_names<URLAliasCRUDConfVO>().url_alias_create, ModuleTableFieldVO.FIELD_TYPE_string, 'URL de création', false);
        ModuleTableFieldController.create_new(URLAliasCRUDConfVO.API_TYPE_ID, field_names<URLAliasCRUDConfVO>().url_alias_template_read, ModuleTableFieldVO.FIELD_TYPE_string, 'Template d\'URL de lecture', false);
        ModuleTableFieldController.create_new(URLAliasCRUDConfVO.API_TYPE_ID, field_names<URLAliasCRUDConfVO>().url_alias_template_update, ModuleTableFieldVO.FIELD_TYPE_string, 'Template d\'URL de modification', false);

        ModuleTableController.create_new(this.name, URLAliasCRUDConfVO, null, 'Configuration des alias d\'URL pour les CRUD');
        ModuleTableCompositeUniqueKeyController.add_composite_unique_key_to_vo_type(
            URLAliasCRUDConfVO.API_TYPE_ID,
            [
                lang_id,
                moduletable_ref_id,
            ]);
    }
}