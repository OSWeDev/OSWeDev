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
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import { isEqual } from 'lodash';

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
    private use_for_template: boolean = false;
    private titre_field_ref_for_template: VOFieldRefVO = null;
    private sous_titre_field_ref_for_template: VOFieldRefVO = null;
    private contenu_field_ref_for_template: VOFieldRefVO = null;

    private all_field_ref_for_template_options: VOFieldRefVO[] = [];
    private titre_field_ref_for_template_options: VOFieldRefVO[] = [];
    private sous_titre_field_ref_for_template_options: VOFieldRefVO[] = [];
    private contenu_field_ref_for_template_options: VOFieldRefVO[] = [];
    private multiselect_loading: boolean = false;

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
            this.use_for_template = false;
            this.titre_field_ref_for_template = null;
            this.sous_titre_field_ref_for_template = null;
            this.contenu_field_ref_for_template = null;

            return;
        }
        this.titre = this.widget_options.titre;
        this.sous_titre = this.widget_options.sous_titre;
        this.contenu = this.widget_options.contenu;
        this.alignement_titre = this.widget_options.alignement_titre;
        this.alignement_sous_titre = this.widget_options.alignement_sous_titre;
        this.use_for_template = this.widget_options.use_for_template;
        this.titre_field_ref_for_template = this.widget_options.titre_field_ref_for_template;
        this.sous_titre_field_ref_for_template = this.widget_options.sous_titre_field_ref_for_template;
        this.contenu_field_ref_for_template = this.widget_options.contenu_field_ref_for_template;
    }

    @Watch('titre')
    @Watch('sous_titre')
    @Watch('contenu')
    @Watch('alignement_titre')
    @Watch('alignement_sous_titre')
    @Watch('alignement_contenu')
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
            this.widget_options.alignement_titre != this.alignement_titre ||
            this.widget_options.alignement_sous_titre != this.alignement_sous_titre ||
            this.widget_options.use_for_template != this.use_for_template ||
            !isEqual(this.widget_options.titre_field_ref_for_template, this.titre_field_ref_for_template) ||
            !isEqual(this.widget_options.sous_titre_field_ref_for_template, this.sous_titre_field_ref_for_template) ||
            !isEqual(this.widget_options.contenu_field_ref_for_template, this.contenu_field_ref_for_template)
        ) {
            this.next_update_options.titre = this.titre;
            this.next_update_options.sous_titre = this.sous_titre;
            this.next_update_options.contenu = this.contenu;
            this.next_update_options.alignement_titre = this.alignement_titre;
            this.next_update_options.alignement_sous_titre = this.alignement_sous_titre;
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

        this.alignement_titre_selected = this.next_update_options.alignement_titre;
        this.alignement_sous_titre_selected = this.next_update_options.alignement_sous_titre;

        this.set_all_field_ref_for_template_options();

        await this.throttled_update_options();
    }

    private get_default_options(): CMSBlocTextWidgetOptionsVO {
        return CMSBlocTextWidgetOptionsVO.createNew(
            "",
            this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE),
            "",
            this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE),
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

    private fieldRefOptionLabel(field_ref: VOFieldRefVO): string {
        let field = null;
        const moduletable = ModuleTableController.module_tables_by_vo_type[field_ref.api_type_id];

        if (
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[field_ref.api_type_id] &&
            ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[field_ref.api_type_id][field_ref.field_id]
        ) {
            field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[field_ref.api_type_id][field_ref.field_id];
        }

        return ((moduletable?.label?.code_text) ? this.t(moduletable.label.code_text) : field_ref.api_type_id) + ' => ' + ((field?.field_label_translatable_code) ? this.t(field.field_label_translatable_code) : field_ref.field_id);
    }

    private titre_field_ref_multiselect_search_change(query_str: string) {
        this.titre_field_ref_for_template_options = this.multiselect_search_change(query_str);
    }

    private sous_titre_field_ref_multiselect_search_change(query_str: string) {
        this.sous_titre_field_ref_for_template_options = this.multiselect_search_change(query_str);
    }

    private contenu_field_ref_multiselect_search_change(query_str: string) {
        this.contenu_field_ref_for_template_options = this.multiselect_search_change(query_str);
    }

    private multiselect_search_change(query_str: string): VOFieldRefVO[] {
        this.multiselect_loading = true;

        const res: VOFieldRefVO[] = [];

        if (query_str?.length >= 3) {
            for (const i in this.all_field_ref_for_template_options) {
                const field_ref: VOFieldRefVO = this.all_field_ref_for_template_options[i];

                if (this.fieldRefOptionLabel(field_ref).toLowerCase().indexOf(query_str.toLowerCase()) >= 0) {
                    res.push(field_ref);
                }
            }
        }

        this.multiselect_loading = false;

        return res;
    }

    private set_all_field_ref_for_template_options() {
        const res: VOFieldRefVO[] = [];

        for (const api_type_id in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name) {
            const moduletable = ModuleTableController.module_tables_by_vo_type[api_type_id];

            // Pour l'instant on ne prend que les tables du schema REF
            if (moduletable.database != 'ref') {
                continue;
            }

            for (const field_name in ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[api_type_id]) {
                const field = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[api_type_id][field_name];

                // On prend que les fields de type image ou foreign key
                if (
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_html &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_email &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_string &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_textarea &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_int &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_float &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_amount &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_string_array &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_prct &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_date &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_tstz &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_tsrange &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_hour &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_day &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_month &&
                    field.field_type != ModuleTableFieldVO.FIELD_TYPE_translatable_text
                ) {
                    continue;
                }

                const field_ref = new VOFieldRefVO();

                field_ref.id = field.id;
                field_ref.api_type_id = api_type_id;
                field_ref.field_id = field_name;

                res.push(field_ref);
            }
        }

        this.all_field_ref_for_template_options = res;
    }
}