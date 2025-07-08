import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSBlocTextWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSBlocTextWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import './CMSBlocTextWidgetOptionsComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';

@Component({
    template: require('./CMSBlocTextWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSBlocTextWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    public titre: string = null;
    public sous_titre: string = null;
    public sur_titre: string = null;
    public contenu: string = null;
    public use_for_template: boolean = false;
    public titre_field_ref_for_template: VOFieldRefVO = null;
    public sous_titre_field_ref_for_template: VOFieldRefVO = null;
    public sur_titre_field_ref_for_template: VOFieldRefVO = null;
    public contenu_field_ref_for_template: VOFieldRefVO = null;
    public titre_template_is_date: boolean = false;
    public sous_titre_template_is_date: boolean = false;
    public sur_titre_template_is_date: boolean = false;
    public contenu_template_is_date: boolean = false;
    public sous_titre_symbole: string = null;
    public titre_class: string = null;
    public sous_titre_class: string = null;
    public sur_titre_class: string = null;
    public contenu_class: string = null;

    public optionsEditeur = {
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

    public next_update_options: CMSBlocTextWidgetOptionsVO = null;
    public throttled_update_options = ThrottleHelper.declare_throttle_without_args('CMSBlocTextWidgetOptionsComponent.update_options', this.update_options.bind(this), 50, false);


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

    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().widget_options, { immediate: true, deep: true })
    public async onchange_widget_options() {
        if (!this.widget_options) {
            this.titre = null;
            this.sous_titre = null;
            this.sur_titre = null;
            this.contenu = null;
            this.use_for_template = false;
            this.titre_template_is_date = false;
            this.sous_titre_template_is_date = false;
            this.sur_titre_template_is_date = false;
            this.contenu_template_is_date = false;
            this.titre_field_ref_for_template = null;
            this.sous_titre_field_ref_for_template = null;
            this.sur_titre_field_ref_for_template = null;
            this.contenu_field_ref_for_template = null;
            this.sous_titre_symbole = null;
            this.titre_class = null;
            this.sous_titre_class = null;
            this.sur_titre_class = null;
            this.contenu_class = null;

            return;
        }
        this.titre = this.widget_options.titre;
        this.sous_titre = this.widget_options.sous_titre;
        this.sur_titre = this.widget_options.sur_titre;
        this.contenu = this.widget_options.contenu;
        this.use_for_template = this.widget_options.use_for_template;
        this.titre_template_is_date = this.widget_options.titre_template_is_date;
        this.sous_titre_template_is_date = this.widget_options.sous_titre_template_is_date;
        this.sur_titre_template_is_date = this.widget_options.sur_titre_template_is_date;
        this.contenu_template_is_date = this.widget_options.contenu_template_is_date;
        this.sous_titre_symbole = this.widget_options.sous_titre_symbole;
        this.titre_class = this.widget_options.titre_class;
        this.sous_titre_class = this.widget_options.sous_titre_class;
        this.sur_titre_class = this.widget_options.sur_titre_class;
        this.contenu_class = this.widget_options.contenu_class;
        this.titre_field_ref_for_template = this.widget_options.titre_field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.titre_field_ref_for_template) : null;
        this.sous_titre_field_ref_for_template = this.widget_options.sous_titre_field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.sous_titre_field_ref_for_template) : null;
        this.sur_titre_field_ref_for_template = this.widget_options.sur_titre_field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.sur_titre_field_ref_for_template) : null;
        this.contenu_field_ref_for_template = this.widget_options.contenu_field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.contenu_field_ref_for_template) : null;
    }

    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().titre)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sous_titre)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sur_titre)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().contenu)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sous_titre_symbole)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().use_for_template)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().titre_template_is_date)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sous_titre_template_is_date)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sur_titre_template_is_date)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().contenu_template_is_date)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().titre_field_ref_for_template)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sous_titre_field_ref_for_template)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sur_titre_field_ref_for_template)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().contenu_field_ref_for_template)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().titre_class)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sous_titre_class)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().sur_titre_class)
    @Watch(reflect<CMSBlocTextWidgetOptionsComponent>().contenu_class)
    public async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.titre != this.titre ||
            this.widget_options.sous_titre != this.sous_titre ||
            this.widget_options.sur_titre != this.sur_titre ||
            this.widget_options.contenu != this.contenu ||
            this.widget_options.use_for_template != this.use_for_template ||
            this.widget_options.titre_template_is_date != this.titre_template_is_date ||
            this.widget_options.sous_titre_template_is_date != this.sous_titre_template_is_date ||
            this.widget_options.sur_titre_template_is_date != this.sur_titre_template_is_date ||
            this.widget_options.contenu_template_is_date != this.contenu_template_is_date ||
            this.widget_options.sous_titre_symbole != this.sous_titre_symbole ||
            this.widget_options.titre_class != this.titre_class ||
            this.widget_options.sous_titre_class != this.sous_titre_class ||
            this.widget_options.sur_titre_class != this.sur_titre_class ||
            this.widget_options.contenu_class != this.contenu_class ||
            !isEqual(this.widget_options.titre_field_ref_for_template, this.titre_field_ref_for_template) ||
            !isEqual(this.widget_options.sous_titre_field_ref_for_template, this.sous_titre_field_ref_for_template) ||
            !isEqual(this.widget_options.sur_titre_field_ref_for_template, this.sur_titre_field_ref_for_template) ||
            !isEqual(this.widget_options.contenu_field_ref_for_template, this.contenu_field_ref_for_template)
        ) {
            this.next_update_options.titre = this.titre;
            this.next_update_options.sous_titre = this.sous_titre;
            this.next_update_options.sur_titre = this.sur_titre;
            this.next_update_options.contenu = this.contenu;
            this.next_update_options.titre_class = this.titre_class;
            this.next_update_options.sous_titre_class = this.sous_titre_class;
            this.next_update_options.sur_titre_class = this.sur_titre_class;
            this.next_update_options.contenu_class = this.contenu_class;
            this.next_update_options.use_for_template = this.use_for_template;
            this.next_update_options.titre_template_is_date = this.titre_template_is_date;
            this.next_update_options.sous_titre_template_is_date = this.sous_titre_template_is_date;
            this.next_update_options.sur_titre_template_is_date = this.sur_titre_template_is_date;
            this.next_update_options.contenu_template_is_date = this.contenu_template_is_date;
            this.next_update_options.titre_field_ref_for_template = this.titre_field_ref_for_template;
            this.next_update_options.sous_titre_field_ref_for_template = this.sous_titre_field_ref_for_template;
            this.next_update_options.sur_titre_field_ref_for_template = this.sur_titre_field_ref_for_template;
            this.next_update_options.contenu_field_ref_for_template = this.contenu_field_ref_for_template;
            this.next_update_options.sous_titre_symbole = this.sous_titre_symbole;

            await this.throttled_update_options();
        }
    }

    public async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        await this.throttled_update_options();
    }

    public get_default_options(): CMSBlocTextWidgetOptionsVO {
        return CMSBlocTextWidgetOptionsVO.createNew(
            "",
            "",
            "",
            "",
            false,
            null,
            null,
            null,
            null,
            false,
            false,
            false,
            false,
            "",
            "",
            "",
            "",
            "",
        );
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

    public async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }
    }

    public async switch_titre_template_is_date() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.titre_template_is_date = !this.next_update_options.titre_template_is_date;

        await this.throttled_update_options();
    }

    public async switch_sous_titre_template_is_date() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.sous_titre_template_is_date = !this.next_update_options.sous_titre_template_is_date;

        await this.throttled_update_options();
    }

    public async switch_sur_titre_template_is_date() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.sur_titre_template_is_date = !this.next_update_options.sur_titre_template_is_date;

        await this.throttled_update_options();
    }

    public async switch_contenu_template_is_date() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.contenu_template_is_date = !this.next_update_options.contenu_template_is_date;

        await this.throttled_update_options();
    }

    public async switch_use_for_template() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.use_for_template = !this.next_update_options.use_for_template;

        await this.throttled_update_options();
    }

    public async add_titre_field_ref_for_template(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'titre_field_ref_for_template');
    }

    public async add_sous_titre_field_ref_for_template(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'sous_titre_field_ref_for_template');
    }
    public async add_sur_titre_field_ref_for_template(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'sur_titre_field_ref_for_template');
    }

    public async add_contenu_field_ref_for_template(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'contenu_field_ref_for_template');
    }

    public async add_vo_field_ref(api_type_id: string, field_id: string, field_name: string) {
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

    public async remove_titre_field_ref_for_template() {
        await this.remove_vo_field_ref('titre_field_ref_for_template');
    }

    public async remove_sous_titre_field_ref_for_template() {
        await this.remove_vo_field_ref('sous_titre_field_ref_for_template');
    }
    public async remove_sur_titre_field_ref_for_template() {
        await this.remove_vo_field_ref('sur_titre_field_ref_for_template');
    }

    public async remove_contenu_field_ref_for_template() {
        await this.remove_vo_field_ref('contenu_field_ref_for_template');
    }

    public async remove_vo_field_ref(field_name: string) {
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