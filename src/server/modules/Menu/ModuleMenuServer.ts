import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleMenu from '../../../shared/modules/Menu/ModuleMenu';
import MenuElementVO from '../../../shared/modules/Menu/vos/MenuElementVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleMenuServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleMenuServer.instance) {
            ModuleMenuServer.instance = new ModuleMenuServer();
        }
        return ModuleMenuServer.instance;
    }

    private static instance: ModuleMenuServer = null;

    private constructor() {
        super(ModuleMenu.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Titre' },
            'menu_organizer.selected_item.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Caché' },
            'menu_organizer.hidden.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Mode avancé' },
            'menu_organizer.advanced_selected_item_mode.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Classe FontAwesome' },
            'menu_organizer.fa_class.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Cible' },
            'menu_organizer.target.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'La cible est une route' },
            'menu_organizer.target_is_routename.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Paramètres de la route' },
            'menu_organizer.target_route_params.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Droit d\'accès' },
            'menu_organizer.access_policy_name.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Les modifications seront visibles en rechargeant la page' },
            'menu_organizer.selected_item.explaination.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Enregistrer' },
            'menu_organizer.save_selected.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Annuler' },
            'menu_organizer.cancel_selected.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Menus' },
            'menu.menuelements.admin.menu_elt.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Menu de l\'application : {app_name}' },
            'menu_organizer.app_name_title.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Application :' },
            'menu_organizer.select_app_name.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Menus' },
            'menu.menuelements.admin.MenuAdminVueModule.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Organiser' },
            'menu.menuelements.admin.menu_organizer.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Enregistrer' },
            'menu_organizer.save.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Annuler' },
            'menu_organizer.cancel.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': 'Ajouter' },
            'menu_organizer.add.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            { 'fr-fr': '-- Nouveau menu --' },
            'menu_organizer.new.___LABEL___'));
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleMenu.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            'fr-fr': 'Menus'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleMenu.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            'fr-fr': 'Administration des menus'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleMenu.APINAME_get_menu, this.get_menu.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleMenu.APINAME_add_menu, this.add_menu.bind(this));
    }

    private async add_menu(app_name: string): Promise<void> {
        let new_menu = new MenuElementVO();
        new_menu.access_policy_name = null;
        new_menu.app_name = app_name;
        new_menu.fa_class = null;
        new_menu.hidden = true;
        new_menu.menu_parent_id = null;
        new_menu.name = 'NEWMENU_' + Dates.now().toString();
        new_menu.target = 'home';
        new_menu.target_is_routename = true;
        new_menu.target_route_params = null;
        new_menu.weight = 0;
        let res = await ModuleDAO.getInstance().insertOrUpdateVO(new_menu);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('add_menu:Failed insert new menu:' + JSON.stringify(new_menu));
            return;
        }
        new_menu.id = res.id;

        let code = new TranslatableTextVO();
        code.code_text = new_menu.translatable_title;
        res = await ModuleDAO.getInstance().insertOrUpdateVO(code);
        if ((!res) || (!res.id)) {
            ConsoleHandler.error('add_menu:Failed insert new code:' + JSON.stringify(code));
            return;
        }
        code.id = res.id;

        let user = await ModuleAccessPolicyServer.getInstance().getSelfUser();
        let lang = (user && user.lang_id) ?
            await query(LangVO.API_TYPE_ID).filter_by_id(user.lang_id).select_vo<LangVO>() :
            await ModuleTranslation.getInstance().getLang(ConfigurationService.node_configuration.DEFAULT_LOCALE);
        if (!lang) {
            ConsoleHandler.error('add_menu:Failed get lang');
            return;
        }

        let translation = new TranslationVO();
        translation.lang_id = lang.id;
        translation.text_id = code.id;
        let default_translatable = await ModuleTranslation.getInstance().getTranslatableText('menu_organizer.new' + DefaultTranslation.DEFAULT_LABEL_EXTENSION);
        if (!default_translatable) {
            ConsoleHandler.error('add_menu:Failed get default_translatable');
            return;
        }
        let default_translation = await ModuleTranslation.getInstance().getTranslation(lang.id, default_translatable.id);
        if (!default_translation) {
            ConsoleHandler.error('add_menu:Failed get default_translation');
            return;
        }
        translation.translated = default_translation ? default_translation.translated : null;
        await ModuleDAO.getInstance().insertOrUpdateVO(translation);
    }

    private async get_menu(app_name: string): Promise<MenuElementVO[]> {

        let res: MenuElementVO[] = [];

        let all = await query(MenuElementVO.API_TYPE_ID)
            .filter_by_text_eq('app_name', app_name)
            .select_vos<MenuElementVO>();
        for (let i in all) {
            let elt = all[i];

            if (!elt.access_policy_name) {
                res.push(elt);
                continue;
            }

            if (ModuleAccessPolicy.getInstance().testAccess(elt.access_policy_name)) {
                res.push(elt);
            }
        }

        return res;
    }
}