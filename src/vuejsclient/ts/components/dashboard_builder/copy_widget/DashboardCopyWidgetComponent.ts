import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardBuilderController from '../../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextAction } from '../../InlineTranslatableText/TranslatableTextStore';
import MenuOrganizerComponent from '../../menu/organizer/MenuOrganizerComponent';
import VueComponentBase from '../../VueComponentBase';
import './DashboardCopyWidgetComponent.scss';

@Component({
    template: require('./DashboardCopyWidgetComponent.pug'),
    components: {
        Menuorganizercomponent: MenuOrganizerComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class DashboardCopyWidgetComponent extends VueComponentBase {

    @ModuleTranslatableTextAction
    private set_flat_locale_translation: (translation: { code_text: string, value: string }) => void;

    private copy_to_page: DashboardPageVO = null; //Page vers laquel on souhaite copier/déplacer
    private page_widget: DashboardPageWidgetVO = null;
    private pages: DashboardPageVO[] = null;
    private page_id: number = null;
    private on_hidden_initialized: boolean = false;
    private show_modal: boolean = false;

    private onclose_callback: () => Promise<void> = null;

    public async open_copy_modal(page_widget: DashboardPageWidgetVO, pages: DashboardPageVO[], onclose_callback: () => Promise<void>) {

        this.show_modal = true;
        this.pages = pages;
        this.page_id = page_widget.page_id;
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

    private async delete_widget() {
        //Supprime le widget qui sera déplaçé.
        this.$emit('delete_widget', this.page_widget);
    }

    private find_page_by_id(find_page_id: number): DashboardPageVO {
        /* Retourne la page correspondant à l'identifiant indiqué */

        for (let i in this.pages) {
            let page = this.pages[i];
            if (page.id == find_page_id) {
                return page;
            }
        }
        console.log("Id de page introuvable !");
    }

    private async generate_i_and_weight(find_page_id: number, page_widget_to_copy: DashboardPageWidgetVO) {
        /*
        Retourne un i (identifient cellule pour griditem) existant parmis les widgets
        de la page indiquée
        */

        //Identification de la page vers laquelle copier
        let current_page: DashboardPageVO = this.find_page_by_id(find_page_id);
        let this_page_widgets = await query(DashboardPageWidgetVO.API_TYPE_ID).filter_by_num_eq('page_id', current_page.id).select_vos<DashboardPageWidgetVO>();

        //Eviter ces i afin d'avoir des cellules qui ont un identifiant griditem différent
        let i_to_avoid: number[] = [];
        let max_weight: number = 0;
        for (let i in this_page_widgets) {
            let widget = this_page_widgets[i];
            i_to_avoid.push(widget.i);
            if (widget.weight >= max_weight) {
                max_weight = widget.weight + 1;
            }
        }

        //Attribution d'un i et d'un weight cohérent au nouveau widget
        page_widget_to_copy.i = i_to_avoid.reduce((a, b) => Math.max(a, b), 0) + 1;
        page_widget_to_copy.weight = max_weight;
    }

    private async transfert_trad(page_widget_to_copy_id: number) {
        /* Permet de transférer ou copier les traductions d'un tableau (widget) vers un autre */

        let page_widget_trads: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_starting_with('code_text', [
            DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + this.page_widget.id + '.',
            DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + this.page_widget.id + '.'
        ]).select_vos<TranslatableTextVO>();

        let page_widget_to_copy_trads: TranslatableTextVO[] = cloneDeep(page_widget_trads); //Copie des traductions


        for (let j in page_widget_to_copy_trads) {
            let page_widget_trad: TranslatableTextVO = page_widget_to_copy_trads[j];
            //Changement des identifiants widget de ces trads.
            let code = page_widget_trad.code_text;
            // Text
            let translations: TranslationVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<TranslationVO>(
                TranslationVO.API_TYPE_ID, 'text_id', [page_widget_trad.id]);

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

            let insertOrDeleteQueryResulttt: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page_widget_trad); //Ajout en base.
            page_widget_trad.id = insertOrDeleteQueryResulttt.id;

            page_widget_to_copy_trads[j] = page_widget_trad;

            //Activation de la traduction
            let menu_translation: TranslationVO = await ModuleTranslation.getInstance().getTranslation(translations[0].lang_id, page_widget_trad.id);
            if (!menu_translation) {
                menu_translation = new TranslationVO();
                menu_translation.lang_id = translations[0].lang_id;
                menu_translation.text_id = page_widget_trad.id;
                menu_translation.translated = translations[0].translated;
                let resi = await ModuleDAO.getInstance().insertOrUpdateVO(menu_translation);
                if (resi && resi.id) {
                    this.set_flat_locale_translation({
                        code_text: page_widget_trad.code_text,
                        value: translations[0].translated
                    });
                }
            }

        }

    }

    private async do_transfert_widget(copy_it: boolean = false) {
        /*Déplace un widget d'un onglet vers un autre onglet*/


        let page_widget_to_copy: DashboardPageWidgetVO = new DashboardPageWidgetVO();
        page_widget_to_copy = cloneDeep(this.page_widget);


        //Attribution d'un i et d'un poids cohérent au nouveau widget
        await this.generate_i_and_weight(this.page_to_copy_in_id, page_widget_to_copy);

        //Déplacement
        delete page_widget_to_copy.id;
        let to_which_page_id: number = this.page_to_copy_in_id;
        page_widget_to_copy.page_id = to_which_page_id;

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page_widget_to_copy);

        let page_widget_to_copy_id: number = insertOrDeleteQueryResult['id'];

        // Transfert des traductions
        if (this.page_widget._type == 'dashboard_pwidget') {
            await this.transfert_trad(page_widget_to_copy_id);
        }

        // Suppression du widget (recharge la page par la même occasion)
        if (copy_it) {
            this.$emit('reload_widgets');
        } else {
            await this.delete_widget();
        }

        // Fermeture de la modale
        await this.cancel();
    }

    private async do_copy_widget() {
        /*Copie un widget d'un onglet vers un autre onglet*/

        await this.do_transfert_widget(true);
    }

    private select_page_to_copy_in(page: DashboardPageVO) {
        this.copy_to_page = page;
    }

    private async cancel() {
        $('#modal_copy_widget').modal('hide');
        this.$emit('cancel');
        this.show_modal = false;
    }

    /*Fonctions utiles à la copie d'un widget */
    get page_to_copy_in_id(): number {

        if (!this.page_id) {
            return null;
        }

        if (this.copy_to_page == null) {
            //Default case
            let pagei = 0;

            for (let i in this.pages) {
                let page = this.pages[i];
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

    get pages_name_code_text(): string[] {
        let res: string[] = [];

        if (!this.pages) {
            return res;
        }

        for (let i in this.pages) {
            let page = this.pages[i];

            res.push(page.translatable_name_code_text ? page.translatable_name_code_text : null);
        }

        return res;
    }
}