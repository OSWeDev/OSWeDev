import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSBlocTextWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSBlocTextWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSBlocTextWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSBlocTextWidgetOptionsComponent.pug')
})
export default class CMSBlocTextWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private titre: string = null;
    private alignement_titre: string = null;
    private alignement_titre_selected: string = null;
    private sous_titre: string = null;
    private alignement_sous_titre: string = null;
    private alignement_sous_titre_selected: string = null;
    private contenu: string = null;
    private alignement_contenu_selected: string = null;

    private alignement_options: string[] = [
        this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE),
        this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_CENTRE),
        this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_DROITE),
        this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_JUSTIFIE),
    ];

    private optionsEditeur = {
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],      // Boutons pour le gras, italique, souligné, barré
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],  // Boutons pour les listes
                [{ 'script': 'sub' }, { 'script': 'super' }],   // indice et exposant
                [{ 'indent': '-1' }, { 'indent': '+1' }],       // outdent/indent
                [{ 'color': [] }, { 'background': [] }],        // dropdown with defaults from theme
                [{ 'align': [] }],                              // Bouton pour l'alignement (gauche, centre, droite, justifié)
                ['clean']                                       // Bouton pour effacer la mise en forme
            ]
        }
    }

    private next_update_options: CMSBlocTextWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });


    get widget_options(): CMSBlocTextWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSBlocTextWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSBlocTextWidgetOptionsVO;
                options = options ? new CMSBlocTextWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('alignement_titre_selected')
    private async onchange_alignement_titre_selected() {
        this.alignement_titre = this.alignement_titre_selected;
    }

    @Watch('alignement_sous_titre_selected')
    private async onchange_alignement_sous_titre_selected() {
        this.alignement_sous_titre = this.alignement_sous_titre_selected;
    }


    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.titre = null;
            this.sous_titre = null;
            this.contenu = null;
            this.alignement_titre = this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE);
            this.alignement_sous_titre = this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE);

            return;
        }
        this.titre = this.widget_options.titre;
        this.sous_titre = this.widget_options.sous_titre;
        this.contenu = this.widget_options.contenu;
        this.alignement_titre = this.widget_options.alignement_titre;
        this.alignement_sous_titre = this.widget_options.alignement_sous_titre;
    }

    @Watch('titre')
    @Watch('sous_titre')
    @Watch('contenu')
    @Watch('alignement_titre')
    @Watch('alignement_sous_titre')
    @Watch('alignement_contenu')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.titre != this.titre
            || this.widget_options.sous_titre != this.sous_titre
            || this.widget_options.contenu != this.contenu
            || this.widget_options.alignement_titre != this.alignement_titre
            || this.widget_options.alignement_sous_titre != this.alignement_sous_titre
        ) {
            this.next_update_options.titre = this.titre;
            this.next_update_options.sous_titre = this.sous_titre;
            this.next_update_options.contenu = this.contenu;
            this.next_update_options.alignement_titre = this.alignement_titre;
            this.next_update_options.alignement_sous_titre = this.alignement_sous_titre;

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        this.alignement_titre_selected = this.next_update_options.alignement_titre;
        this.alignement_sous_titre_selected = this.next_update_options.alignement_sous_titre;

        await this.throttled_update_options();
    }

    private get_default_options(): CMSBlocTextWidgetOptionsVO {
        return CMSBlocTextWidgetOptionsVO.createNew(
            "",
            this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE),
            "",
            this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE),
            "",
        );
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

}