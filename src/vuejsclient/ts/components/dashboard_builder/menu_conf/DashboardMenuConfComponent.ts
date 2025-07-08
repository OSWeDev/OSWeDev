import Component from 'vue-class-component';
import { Inject, Vue, Watch } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import MenuController from '../../menu/MenuController';
import MenuOrganizerComponent from '../../menu/organizer/MenuOrganizerComponent';
import VueComponentBase from '../../VueComponentBase';
import './DashboardMenuConfComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../page/DashboardPageStore';

@Component({
    template: require('./DashboardMenuConfComponent.pug'),
    components: {
        Menuorganizercomponent: MenuOrganizerComponent
    }
})
export default class DashboardMenuConfComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    private menu_app: { [app_name: string]: number } = {};
    private app_names: string[] = [];

    private is_loading: boolean = true;

    get get_dashboard(): DashboardVO {
        return this.vuexGet(reflect<this>().get_dashboard);
    }

    @Watch(reflect<DashboardMenuConfComponent>().get_dashboard, { immediate: true })
    private async onchange_dashboard() {
        this.is_loading = true;

        if (!this.get_dashboard) {
            this.menu_app = {};
            this.is_loading = false;

            return;
        }

        if (!MenuController.getInstance().has_loaded_menus) {
            await MenuController.getInstance().reload_from_db();
        } else {
            await MenuController.getInstance().loading_menus_promise;
        }

        this.menu_app = {};
        this.app_names = Object.keys(MenuController.getInstance().menus_by_app_names);
        for (const i in this.app_names) {
            const app_name = this.app_names[i];

            const db_menu: MenuElementVO = await ModuleDAO.instance.getNamedVoByName<MenuElementVO>(
                MenuElementVO.API_TYPE_ID, 'dashboard__menu__' + app_name + '__' + this.get_dashboard.id);
            if (db_menu) {
                this.menu_app[db_menu.app_name] = db_menu.id;
            }
        }
        this.is_loading = false;
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    private get_menu(app_name: string): MenuElementVO {
        if (!this.get_dashboard) {
            return null;
        }

        const res: MenuElementVO = new MenuElementVO();

        res.access_policy_name = ModuleDashboardBuilder.POLICY_FO_ACCESS;
        res.app_name = app_name;
        res.fa_class = "fa-area-chart";
        res.hidden = true;
        res.menu_parent_id = null;
        res.name = 'dashboard__menu__' + app_name + '__' + this.get_dashboard.id;
        res.target = 'Dashboard View';
        res.target_is_routename = true;
        res.target_route_params = '{ "dashboard_id": ' + this.get_dashboard.id + ' }';
        res.weight = -1;

        return res;
    }

    private async switch_menu_app(app_name: string) {
        this.is_loading = true;

        if (this.get_dashboard) {

            let db_menu: MenuElementVO = await ModuleDAO.instance.getNamedVoByName<MenuElementVO>(
                MenuElementVO.API_TYPE_ID, 'dashboard__menu__' + app_name + '__' + this.get_dashboard.id);

            if (this.menu_app[app_name]) {

                if (db_menu) {
                    await ModuleDAO.instance.deleteVOs([db_menu]);
                    await MenuController.getInstance().reload_from_db();
                    this.app_names = Object.keys(MenuController.getInstance().menus_by_app_names);
                }

                Vue.set(this.menu_app, app_name, null);

            } else {

                if (db_menu) {
                    Vue.set(this.menu_app, app_name, db_menu.id);
                    this.is_loading = false;
                    return;
                }

                db_menu = this.get_menu(app_name);

                let translatable_text_menu = await ModuleTranslation.getInstance().getTranslatableText(db_menu.translatable_title);
                if (!translatable_text_menu) {
                    translatable_text_menu = new TranslatableTextVO();
                    translatable_text_menu.code_text = db_menu.translatable_title;
                    const insertOrDeleteQueryResulttt: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(translatable_text_menu);
                    if ((!insertOrDeleteQueryResulttt) || (!insertOrDeleteQueryResulttt.id)) {
                        ConsoleHandler.error('Failed switch_menu_app create translatable text');
                        this.is_loading = false;
                        return;
                    }
                    translatable_text_menu.id = insertOrDeleteQueryResulttt.id;
                }

                /**
                 * On se base sur la trad actuelle du dashboard
                 */
                const db_translatable_text = await ModuleTranslation.getInstance().getTranslatableText(this.get_dashboard.title);
                if (db_translatable_text) {

                    const translations: TranslationVO[] = await query(TranslationVO.API_TYPE_ID).filter_by_num_eq(field_names<TranslationVO>().text_id, db_translatable_text.id).select_vos<TranslationVO>();

                    for (const i in translations) {
                        const translation = translations[i];

                        let menu_translation: TranslationVO = await ModuleTranslation.getInstance().getTranslation(translation.lang_id, translatable_text_menu.id);
                        if (!menu_translation) {
                            menu_translation = new TranslationVO();
                            menu_translation.lang_id = translation.lang_id;
                            menu_translation.text_id = translatable_text_menu.id;
                            menu_translation.translated = translation.translated;
                            const resi = await ModuleDAO.instance.insertOrUpdateVO(menu_translation);
                            if (resi && resi.id) {
                                LocaleManager.set_translation(translatable_text_menu.code_text, translation.translated);
                            }
                        }
                    }
                }

                const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(this.get_menu(app_name));
                if ((!insertOrDeleteQueryResult) || !insertOrDeleteQueryResult.id) {
                    ConsoleHandler.error('Failed switch_menu_app create');
                    this.is_loading = false;
                    return;
                }
                Vue.set(this.menu_app, app_name, insertOrDeleteQueryResult.id);
                await MenuController.getInstance().reload_from_db();
                this.app_names = Object.keys(MenuController.getInstance().menus_by_app_names);
            }
        }
        this.is_loading = false;
    }
}