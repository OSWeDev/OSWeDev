import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSBlocTextWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSBlocTextWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSBlocTextWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSBlocTextWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSBlocTextWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private titre: string = null;
    private sous_titre: string = null;
    private contenu: string = null;
    private use_for_template: boolean = false;
    private titre_field_ref_for_template: VOFieldRefVO = null;
    private sous_titre_field_ref_for_template: VOFieldRefVO = null;
    private contenu_field_ref_for_template: VOFieldRefVO = null;

    private optionsEditeur = {
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],      // Boutons pour le gras, italique, souligné, barré
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'color': [] }, { 'background': [] }],        // dropdown with defaults from theme
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],  // Boutons pour les listes
                [{ 'script': 'sub' }, { 'script': 'super' }],   // indice et exposant
                [{ 'indent': '-1' }, { 'indent': '+1' }],       // outdent/indent
                [{ 'align': [] }],                              // Bouton pour l'alignement (gauche, centre, droite, justifié)
                ['clean']                                       // Bouton pour effacer la mise en forme
            ]
        }
    };

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

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.titre = null;
            this.sous_titre = null;
            this.contenu = null;
            this.use_for_template = false;
            this.titre_field_ref_for_template = null;
            this.sous_titre_field_ref_for_template = null;
            this.contenu_field_ref_for_template = null;

            return;
        }
        this.titre = this.widget_options.titre;
        this.sous_titre = this.widget_options.sous_titre;
        this.contenu = this.widget_options.contenu;
        this.use_for_template = this.widget_options.use_for_template;
        this.titre_field_ref_for_template = this.widget_options.titre_field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.titre_field_ref_for_template) : null;
        this.sous_titre_field_ref_for_template = this.widget_options.sous_titre_field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.sous_titre_field_ref_for_template) : null;
        this.contenu_field_ref_for_template = this.widget_options.contenu_field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.contenu_field_ref_for_template) : null;
    }

    @Watch('titre')
    @Watch('sous_titre')
    @Watch('contenu')
    @Watch('use_for_template')
    @Watch('titre_field_ref_for_template')
    @Watch('sous_titre_field_ref_for_template')
    @Watch('contenu_field_ref_for_template')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.titre != this.titre ||
            this.widget_options.sous_titre != this.sous_titre ||
            this.widget_options.contenu != this.contenu ||
            this.widget_options.use_for_template != this.use_for_template ||
            !isEqual(this.widget_options.titre_field_ref_for_template, this.titre_field_ref_for_template) ||
            !isEqual(this.widget_options.sous_titre_field_ref_for_template, this.sous_titre_field_ref_for_template) ||
            !isEqual(this.widget_options.contenu_field_ref_for_template, this.contenu_field_ref_for_template)
        ) {
            this.next_update_options.titre = this.titre;
            this.next_update_options.sous_titre = this.sous_titre;
            this.next_update_options.contenu = this.contenu;
            this.next_update_options.use_for_template = this.use_for_template;
            this.next_update_options.titre_field_ref_for_template = this.titre_field_ref_for_template;
            this.next_update_options.sous_titre_field_ref_for_template = this.sous_titre_field_ref_for_template;
            this.next_update_options.contenu_field_ref_for_template = this.contenu_field_ref_for_template;

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        await this.throttled_update_options();
    }

    private get_default_options(): CMSBlocTextWidgetOptionsVO {
        return CMSBlocTextWidgetOptionsVO.createNew(
            "",
            "",
            "",
            false,
            null,
            null,
            null,
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

    private async switch_use_for_template() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.use_for_template = !this.next_update_options.use_for_template;

        await this.throttled_update_options();
    }

    private async add_titre_field_ref_for_template(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'titre_field_ref_for_template');
    }

    private async add_sous_titre_field_ref_for_template(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'sous_titre_field_ref_for_template');
    }

    private async add_contenu_field_ref_for_template(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'contenu_field_ref_for_template');
    }

    private async add_vo_field_ref(api_type_id: string, field_id: string, field_name: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options[field_name] = vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_titre_field_ref_for_template() {
        await this.remove_vo_field_ref('titre_field_ref_for_template');
    }

    private async remove_sous_titre_field_ref_for_template() {
        await this.remove_vo_field_ref('sous_titre_field_ref_for_template');
    }

    private async remove_contenu_field_ref_for_template() {
        await this.remove_vo_field_ref('contenu_field_ref_for_template');
    }

    private async remove_vo_field_ref(field_name: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options[field_name]) {
            return null;
        }

        this.next_update_options[field_name] = null;

        await this.throttled_update_options();
    }
}