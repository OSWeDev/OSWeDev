import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardBuilderController from '../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import MenuOrganizerComponent from '../../menu/organizer/MenuOrganizerComponent';
import DashboardPageWidgetController from '../DashboardPageWidgetController';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../page/DashboardPageStore';
import './DashboardCopyWidgetComponent.scss';

// TODO FIXME la copie de widget n'a plus aucun sens si on peut l'activer sur plusieurs pages
@Component({
    template: require('./DashboardCopyWidgetComponent.pug'),
    components: {
        Menuorganizercomponent: MenuOrganizerComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class DashboardCopyWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {

    @Inject('storeNamespace') readonly storeNamespace!: string;

    public copy_to_page: DashboardPageVO = null; //Page vers laquel on souhaite copier/déplacer
    public page_widget: DashboardPageWidgetVO = null;
    public pages: DashboardPageVO[] = null;
    public page_id: number = null;
    public on_hidden_initialized: boolean = false;
    public show_modal: boolean = false;

    public onclose_callback: () => Promise<void> = null;



    /*Fonctions utiles à la copie d'un widget */
    get page_to_copy_in_id(): number {

        if (!this.page_id) {
            return null;
        }

        if (this.copy_to_page == null) {
            //Default case
            let pagei = 0;

            for (const i in this.pages) {
                const page = this.pages[i];
                if (page.id == this.page_id) {
                    pagei = parseInt(i);
                }
            }
            if (pagei == (this.pages.length - 1)) {
                return this.pages[0].id;
            }
            return this.pages[pagei + 1].id;
        } else {
            return this.copy_to_page.id;
        }
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

    public set_selected_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_selected_widget, page_widget);
    }

    public async open_copy_modal(page_widget: DashboardPageWidgetVO, pages: DashboardPageVO[], onclose_callback: () => Promise<void>) {

        this.show_modal = true;
        this.pages = pages;
        this.page_id = page_widget.page_id; // TODO FIXME la copie de widget n'a plus aucun sens si on peut l'activer sur plusieurs pages
        this.page_widget = page_widget;
        this.copy_to_page = null;
        this.onclose_callback = onclose_callback;
        $('#modal_copy_widget').modal('show');

        if (!this.on_hidden_initialized) {
            this.on_hidden_initialized = true;
            $("#modal_copy_widget").on("hidden.bs.modal", async () => {
                if (this.onclose_callback) {
                    this.show_modal = false;
                    await this.onclose_callback();
                }
            });
        }
    }

    public delete_widget() {
        DashboardPageWidgetController.delete_widget(
            this.page_widget,
            this.set_selected_widget.bind(this),
            this.snotify,
        );
    }

    public find_page_by_id(find_page_id: number): DashboardPageVO {
        /* Retourne la page correspondant à l'identifiant indiqué */

        for (const i in this.pages) {
            const page = this.pages[i];
            if (page.id == find_page_id) {
                return page;
            }
        }
        console.log("Id de page introuvable !");
    }

    public async transfert_trad(page_widget_to_copy_id: number) {
        /* Permet de transférer ou copier les traductions d'un tableau (widget) vers un autre */

        const page_widget_trads: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_starting_with('code_text', [
            DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + this.page_widget.id + '.',
            DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + this.page_widget.id + '.'
        ]).select_vos<TranslatableTextVO>();

        const page_widget_to_copy_trads: TranslatableTextVO[] = cloneDeep(page_widget_trads); //Copie des traductions


        for (const j in page_widget_to_copy_trads) {
            const page_widget_trad: TranslatableTextVO = page_widget_to_copy_trads[j];
            //Changement des identifiants widget de ces trads.
            const code = page_widget_trad.code_text;
            // Text
            const translations: TranslationVO[] = await query(TranslationVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<TranslationVO>().text_id, page_widget_trad.id)
                .select_vos<TranslationVO>();

            delete page_widget_trad.id; //On supprime l'identifiant pour éviter les confusions

            if (code.indexOf(DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + this.page_widget.id) == 0) {
                page_widget_trad.code_text =
                    DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX +
                    + page_widget_to_copy_id +
                    code.substring((DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget_to_copy_id).length, code.length);
            } else if (code.indexOf(DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + this.page_widget.id) == 0) {
                page_widget_trad.code_text =
                    DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX +
                    + page_widget_to_copy_id +
                    code.substring((DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + page_widget_to_copy_id).length, code.length);
            }

            const insertOrDeleteQueryResulttt: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(page_widget_trad); //Ajout en base.
            page_widget_trad.id = insertOrDeleteQueryResulttt.id;

            page_widget_to_copy_trads[j] = page_widget_trad;

            //Activation de la traduction
            let menu_translation: TranslationVO = await ModuleTranslation.getInstance().getTranslation(translations[0].lang_id, page_widget_trad.id);
            if (!menu_translation) {
                menu_translation = new TranslationVO();
                menu_translation.lang_id = translations[0].lang_id;
                menu_translation.text_id = page_widget_trad.id;
                menu_translation.translated = translations[0].translated;
                const resi = await ModuleDAO.instance.insertOrUpdateVO(menu_translation);
                if (resi && resi.id) {
                    LocaleManager.set_translation(page_widget_trad.code_text, translations[0].translated);
                }
            }

        }

    }

    public async do_transfert_widget(copy_it: boolean = false) {
        /*Déplace un widget d'un onglet vers un autre onglet*/


        let page_widget_to_copy: DashboardPageWidgetVO = new DashboardPageWidgetVO();
        page_widget_to_copy = cloneDeep(this.page_widget);

        //On supprime l'identifiant pour en générer un nouveau
        delete page_widget_to_copy.id;

        const to_which_page_id: number = this.page_to_copy_in_id;
        page_widget_to_copy.page_id = to_which_page_id; // TODO FIXME la copie de widget n'a plus aucun sens si on peut l'activer sur plusieurs pages

        await ModuleDAO.instance.insertOrUpdateVO(page_widget_to_copy);

        // Transfert des traductions
        // TODO FIXME : si on copie (ce qui est le cas ici) et qu'on a supprimé aucun code de trad (les champs label, titre, ...) ce qui est le cas, on a des codes identiques
        //  donc traduits autant qu'avant, mais aussi identique ad vitam vs le widget source. probablement pas vraiment le but
        // A voir dans le temps ce copier / coller comment on l'adapte
        // TODO FIXME : j'en profite pour le placer là : il faut faire du copier coller avec ctrl+c, ctr+v, et ctrl+x, ctrl+v

        // Suppression du widget (recharge la page par la même occasion)
        if (!copy_it) {
            await this.delete_widget();
        }

        // Fermeture de la modale
        await this.cancel();
    }

    public async do_copy_widget() {
        /*Copie un widget d'un onglet vers un autre onglet*/

        await this.do_transfert_widget(true);
    }

    public select_page_to_copy_in(page: DashboardPageVO) {
        this.copy_to_page = page;
    }

    public cancel() {
        $('#modal_copy_widget').modal('hide');
        this.$emit('cancel');
        this.show_modal = false;
    }
}