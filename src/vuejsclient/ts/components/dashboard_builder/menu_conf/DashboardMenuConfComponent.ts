import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
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
import { ModuleTranslatableTextAction } from '../../InlineTranslatableText/TranslatableTextStore';
import MenuController from '../../menu/MenuController';
import MenuOrganizerComponent from '../../menu/organizer/MenuOrganizerComponent';
import VueComponentBase from '../../VueComponentBase';
import './DashboardMenuConfComponent.scss';

@Component({
    template: require('./DashboardMenuConfComponent.pug'),
    components: {
        Menuorganizercomponent: MenuOrganizerComponent
    }
})
export default class DashboardMenuConfComponent extends VueComponentBase {

    @Prop()
    private dashboard: DashboardVO;

    @ModuleTranslatableTextAction
    private set_flat_locale_translation: (translation: { code_text: string, value: string }) => void;

    private menu_app: { [app_name: string]: number } = {};
    private app_names: string[] = [];

    private is_loading: boolean = true;

    @Watch('dashboard', { immediate: true })
    private async onchange_dashboard() {
        this.is_loading = true;

        if (!this.dashboard) {
            this.menu_app = {};
            this.is_loading = false;

            return;
        }

        this.menu_app = {};
        this.app_names = Object.keys(MenuController.getInstance().menus_by_app_names);
        for (let i in this.app_names) {
            let app_name = this.app_names[i];

            let db_menu: MenuElementVO = await ModuleDAO.getInstance().getNamedVoByName<MenuElementVO>(
                MenuElementVO.API_TYPE_ID, 'dashboard__menu__' + app_name + '__' + this.dashboard.id);
            if (db_menu) {
                this.menu_app[db_menu.app_name] = db_menu.id;
            }
        }
        this.is_loading = false;
    }

    private get_menu(app_name: string): MenuElementVO {
        if (!this.dashboard) {
            return null;
        }

        let res: MenuElementVO = new MenuElementVO();

        res.access_policy_name = ModuleDashboardBuilder.POLICY_FO_ACCESS;
        res.app_name = app_name;
        res.fa_class = "fa-area-chart";
        res.hidden = true;
        res.menu_parent_id = null;
        res.name = 'dashboard__menu__' + app_name + '__' + this.dashboard.id;
        res.target = 'Dashboard View';
        res.target_is_routename = true;
        res.target_route_params = '{ "dashboard_id": ' + this.dashboard.id + ' }';
        res.weight = -1;

        return res;
    }

    private async switch_menu_app(app_name: string) {
        this.is_loading = true;

        if (this.dashboard) {

            let db_menu: MenuElementVO = await ModuleDAO.getInstance().getNamedVoByName<MenuElementVO>(
                MenuElementVO.API_TYPE_ID, 'dashboard__menu__' + app_name + '__' + this.dashboard.id);

            if (!!this.menu_app[app_name]) {

                if (!!db_menu) {
                    await ModuleDAO.getInstance().deleteVOs([db_menu]);
                    await MenuController.getInstance().reload_from_db();
                    this.app_names = Object.keys(MenuController.getInstance().menus_by_app_names);
                }

                Vue.set(this.menu_app, app_name, null);

            } else {

                if (!!db_menu) {
                    Vue.set(this.menu_app, app_name, db_menu.id);
                    this.is_loading = false;
                    return;
                }

                db_menu = this.get_menu(app_name);

                let translatable_text_menu = await ModuleTranslation.getInstance().getTranslatableText(db_menu.translatable_title);
                if (!translatable_text_menu) {
                    translatable_text_menu = new TranslatableTextVO();
                    translatable_text_menu.code_text = db_menu.translatable_title;
                    let insertOrDeleteQueryResulttt: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(translatable_text_menu);
                    if ((!insertOrDeleteQueryResulttt) || (!insertOrDeleteQueryResulttt.id)) {
                        ConsoleHandler.getInstance().error('Failed switch_menu_app create translatable text');
                        this.is_loading = false;
                        return;
                    }
                    translatable_text_menu.id = insertOrDeleteQueryResulttt.id;
                }

                /**
                 * On se base sur la trad actuelle du dashboard
                 */
                let db_translatable_text = await ModuleTranslation.getInstance().getTranslatableText(this.dashboard.translatable_name_code_text);
                if (db_translatable_text) {

                    let translations: TranslationVO[] = await query(TranslationVO.API_TYPE_ID).filter_by_num_eq('text_id', db_translatable_text.id).select_vos<TranslationVO>();

                    for (let i in translations) {
                        let translation = translations[i];

                        let menu_translation: TranslationVO = await ModuleTranslation.getInstance().getTranslation(translation.lang_id, translatable_text_menu.id);
                        if (!menu_translation) {
                            menu_translation = new TranslationVO();
                            menu_translation.lang_id = translation.lang_id;
                            menu_translation.text_id = translatable_text_menu.id;
                            menu_translation.translated = translation.translated;
                            let resi = await ModuleDAO.getInstance().insertOrUpdateVO(menu_translation);
                            if (resi && resi.id) {
                                this.set_flat_locale_translation({
                                    code_text: translatable_text_menu.code_text,
                                    value: translation.translated
                                });
                            }
                        }
                    }
                }

                let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.get_menu(app_name));
                if ((!insertOrDeleteQueryResult) || !insertOrDeleteQueryResult.id) {
                    ConsoleHandler.getInstance().error('Failed switch_menu_app create');
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