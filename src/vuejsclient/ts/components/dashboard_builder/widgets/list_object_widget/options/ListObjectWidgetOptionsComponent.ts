import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ListObjectWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/ListObjectWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './ListObjectWidgetOptionsComponent.scss';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ObjectHandler, { field_names } from '../../../../../../../shared/tools/ObjectHandler';
import { cloneDeep } from 'lodash';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';

@Component({
    template: require('./ListObjectWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class ListObjectWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private type_display: number = ListObjectWidgetOptionsVO.TYPE_DISPLAY_CARD;
    private display_orientation: number = ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_HORIZONTAL;
    private number_of_elements: number = 10;
    private sort_dimension_by: string = null;
    private image_id: VOFieldRefVO = null;
    private title: VOFieldRefVO = null;
    private subtitle: VOFieldRefVO = null;
    private surtitre: VOFieldRefVO = null;
    private card_footer_label: VOFieldRefVO = null;
    private sort_field_ref: VOFieldRefVO = null;
    private button_elements: boolean = false;
    private url: VOFieldRefVO = null;
    private blank?: boolean;
    private is_card_display_single: boolean = false;
    private do_not_use_page_widget_ids: number[] = null;
    private do_not_use_page_widgets: DashboardPageWidgetVO[] = [];
    private page_widget_options: DashboardPageWidgetVO[] = [];
    private show_message_no_data: boolean = false;
    private message_no_data: string = null;
    private filter_on_cmv_vo: boolean = false;
    private field_filter_cmv_vo: VOFieldRefVO = null;
    private filter_on_distant_vo: boolean = false;
    private field_filter_distant_vo: VOFieldRefVO = null;
    private symbole_surtitre: string = null;
    private symbole_sous_titre: string = null;
    private zoom_on_click: boolean;
    private activate_like_button: boolean;

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

    private next_update_options: ListObjectWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_reload_options = ThrottleHelper.declare_throttle_without_args(this.reload_options.bind(this), 50, { leading: false, trailing: true });
    private widget_options: ListObjectWidgetOptionsVO = null;

    get title_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.title)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.title);
    }

    get card_footer_label_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.card_footer_label)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.card_footer_label);
    }

    get field_filter_cmv_vo_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.field_filter_cmv_vo)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.field_filter_cmv_vo);
    }

    get field_filter_distant_vo_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.field_filter_distant_vo)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.field_filter_distant_vo);
    }

    get subtitle_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.subtitle)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.subtitle);
    }

    get surtitre_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.surtitre)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.surtitre);
    }

    get image_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.image_id)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.image_id);
    }

    get url_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.url)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.url);
    }

    get _sort_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.sort_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.sort_field_ref);
    }

    get TYPE_DISPLAY_CARD() {
        return ListObjectWidgetOptionsVO.TYPE_DISPLAY_CARD;
    }

    get TYPE_DISPLAY_LIST() {
        return ListObjectWidgetOptionsVO.TYPE_DISPLAY_LIST;
    }

    get TYPE_DISPLAY_LABELS() {
        return ListObjectWidgetOptionsVO.TYPE_DISPLAY_LABELS;
    }

    get DISPLAY_ORIENTATION_HORIZONTAL() {
        return ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_HORIZONTAL;
    }

    get DISPLAY_ORIENTATION_VERTICAL() {
        return ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_VERTICAL;
    }

    get DISPLAY_ORIENTATION_LABELS() {
        return ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_LABELS;
    }

    @Watch('widget_options')
    private async onchange_widget_options() {
        await this.throttled_reload_options();
    }

    @Watch('page_widget', { immediate: true, deep: true })
    private async onchange_page_widget() {

        await this.throttled_reload_options();
    }

    @Watch('type_display')
    @Watch('display_orientation')
    @Watch('button_elements')
    @Watch('is_card_display_single')
    private async onchange_for_zoom_on_click() {
        if (!this.widget_options) {
            return;
        }

        if ((this.type_display == ListObjectWidgetOptionsVO.TYPE_DISPLAY_CARD) &&
            (this.display_orientation == ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_HORIZONTAL) &&
            (!this.button_elements) &&
            (!this.is_card_display_single)) {

            this.zoom_on_click = true;
            this.widget_options.zoom_on_click = true;
        } else {
            this.zoom_on_click = false;
            this.widget_options.zoom_on_click = false;
        }

        this.throttled_update_options();
    }

    @Watch('do_not_use_page_widgets')
    private async onchange_do_not_use_page_widgets() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.do_not_use_page_widgets?.length != this.next_update_options.do_not_use_page_widget_ids?.length) {
            this.next_update_options.do_not_use_page_widget_ids = this.do_not_use_page_widgets ? this.do_not_use_page_widgets.map((e) => e.id) : null;

            await this.throttled_update_options();
        }
    }

    @Watch('symbole_sous_titre')
    private async onchange_symbole_sous_titre() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.symbole_sous_titre != this.symbole_sous_titre) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.symbole_sous_titre = this.symbole_sous_titre;

            this.throttled_update_options();
        }
    }

    @Watch('symbole_surtitre')
    private async onchange_symbole_surtitre() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.symbole_surtitre != this.symbole_surtitre) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.symbole_surtitre = this.symbole_surtitre;

            this.throttled_update_options();
        }
    }

    @Watch('message_no_data')
    private async onchange_message_no_data() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.message_no_data != this.message_no_data) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.message_no_data = this.message_no_data;

            this.throttled_update_options();
        }
    }

    @Watch('url')
    private async onchange_url() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.url != this.url) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.url = this.url;

            this.throttled_update_options();
        }
    }

    @Watch('number_of_elements')
    private async onchange_number_of_elements() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.number_of_elements != this.number_of_elements) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.number_of_elements = this.number_of_elements;

            this.throttled_update_options();
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

    private get_default_options(): ListObjectWidgetOptionsVO {
        return ListObjectWidgetOptionsVO.createNew(
            ListObjectWidgetOptionsVO.TYPE_DISPLAY_CARD,
            ListObjectWidgetOptionsVO.DISPLAY_ORIENTATION_HORIZONTAL,
            10,
            null,
            null,
            null,
            null,
            null,
            null,
            false,
            null,
            false,
            false,
            false,
            null,
            false,
            null,
            false,
            null,
            false,
            [],
            false,
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



    private async reload_options() {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {

            let options: ListObjectWidgetOptionsVO = null;
            try {
                if (this.page_widget?.json_options && (this.page_widget?.json_options != 'null')) {
                    options = JSON.parse(this.page_widget.json_options) as ListObjectWidgetOptionsVO;
                    if (this.widget_options &&
                        (this.widget_options.blank == options.blank) &&
                        (this.widget_options.zoom_on_click == options.zoom_on_click) &&
                        (this.widget_options.activate_like_button == options.activate_like_button) &&
                        (this.widget_options.button_elements == options.button_elements) &&
                        (this.widget_options.display_orientation == options.display_orientation) &&
                        (this.widget_options.image_id == options.image_id) &&
                        (this.widget_options.sort_field_ref == options.sort_field_ref) &&
                        (this.widget_options.number_of_elements == options.number_of_elements) &&
                        (this.widget_options.sort_dimension_by == options.sort_dimension_by) &&
                        (this.widget_options.subtitle == options.subtitle) &&
                        (this.widget_options.surtitre == options.surtitre) &&
                        (this.widget_options.title == options.title) &&
                        (this.widget_options.card_footer_label == options.card_footer_label) &&
                        (this.widget_options.url == options.url) &&
                        (this.widget_options.is_card_display_single == options.is_card_display_single) &&
                        (this.widget_options.show_message_no_data == options.show_message_no_data) &&
                        (this.widget_options.message_no_data == options.message_no_data) &&
                        (this.widget_options.do_not_use_page_widget_ids == options.do_not_use_page_widget_ids) &&
                        (this.widget_options.symbole_surtitre == options.symbole_surtitre) &&
                        (this.widget_options.symbole_sous_titre == options.symbole_sous_titre) &&
                        (this.widget_options.filter_on_cmv_vo == options.filter_on_cmv_vo) &&
                        (this.widget_options.field_filter_cmv_vo == options.field_filter_cmv_vo) &&
                        (this.widget_options.filter_on_distant_vo == options.filter_on_distant_vo) &&
                        (this.widget_options.field_filter_distant_vo == options.field_filter_distant_vo)
                    ) {
                        options = null;
                    }

                    options = options ? ListObjectWidgetOptionsVO.createNew(
                        options.type_display,
                        options.display_orientation,
                        options.number_of_elements,
                        options.sort_dimension_by,
                        options.image_id,
                        options.title,
                        options.subtitle,
                        options.surtitre,
                        options.sort_field_ref,
                        options.button_elements,
                        options.url,
                        options.blank,
                        options.is_card_display_single,
                        options.filter_on_cmv_vo,
                        options.field_filter_cmv_vo,
                        options.filter_on_distant_vo,
                        options.field_filter_distant_vo,
                        options.zoom_on_click,
                        options.card_footer_label,
                        options.activate_like_button,
                        options.do_not_use_page_widget_ids,
                        options.show_message_no_data,
                        options.message_no_data,
                        options.symbole_surtitre,
                        options.symbole_sous_titre,
                    ) : null;
                }
            } catch (error) {
                ConsoleHandler.error(error);
            }

            if ((!!options) && (!!this.page_widget.json_options)) {
                if (!ObjectHandler.are_equal(this.widget_options, options)) {
                    this.widget_options = options;
                }
            } else if ((!!this.widget_options) && !this.page_widget.json_options) {
                this.widget_options = null;
            }
        }

        if (!this.widget_options) {
            this.next_update_options = null;
            const default_options = this.get_default_options();

            this.type_display = default_options.type_display;
            this.display_orientation = default_options.display_orientation;
            this.number_of_elements = default_options.number_of_elements;
            this.sort_dimension_by = default_options.sort_dimension_by;
            this.image_id = default_options.image_id;
            this.title = default_options.title;
            this.card_footer_label = default_options.card_footer_label;
            this.subtitle = default_options.subtitle;
            this.surtitre = default_options.surtitre;
            this.sort_field_ref = default_options.sort_field_ref;
            this.button_elements = default_options.button_elements;
            this.url = default_options.url;
            this.blank = default_options.blank;
            this.zoom_on_click = default_options.zoom_on_click;
            this.is_card_display_single = default_options.is_card_display_single;
            this.do_not_use_page_widget_ids = default_options.do_not_use_page_widget_ids;
            this.show_message_no_data = default_options.show_message_no_data;
            this.message_no_data = default_options.message_no_data;
            this.filter_on_cmv_vo = default_options.filter_on_cmv_vo;
            this.field_filter_cmv_vo = default_options.field_filter_cmv_vo;
            this.symbole_surtitre = default_options.symbole_surtitre;
            this.symbole_sous_titre = default_options.symbole_sous_titre;
            this.filter_on_distant_vo = default_options.filter_on_distant_vo;
            this.field_filter_distant_vo = default_options.field_filter_distant_vo;
            this.activate_like_button = default_options.activate_like_button;

            this.widget_options = default_options;
            return;
        }

        if (this.type_display != this.widget_options.type_display) {
            this.type_display = this.widget_options.type_display;
        }
        if (this.display_orientation != this.widget_options.display_orientation) {
            this.display_orientation = this.widget_options.display_orientation;
        }
        if (this.number_of_elements != this.widget_options.number_of_elements) {
            this.number_of_elements = this.widget_options.number_of_elements;
        }
        if (this.sort_dimension_by != this.widget_options.sort_dimension_by) {
            this.sort_dimension_by = this.widget_options.sort_dimension_by;
        }
        if (this.image_id != this.widget_options.image_id) {
            this.image_id = this.widget_options.image_id;
        }
        if (this.title != this.widget_options.title) {
            this.title = this.widget_options.title;
        }
        if (this.card_footer_label != this.widget_options.card_footer_label) {
            this.card_footer_label = this.widget_options.card_footer_label;
        }
        if (this.subtitle != this.widget_options.subtitle) {
            this.subtitle = this.widget_options.subtitle;
        }
        if (this.surtitre != this.widget_options.surtitre) {
            this.surtitre = this.widget_options.surtitre;
        }
        if (this.sort_field_ref != this.widget_options.sort_field_ref) {
            this.sort_field_ref = this.widget_options.sort_field_ref;
        }
        if (this.button_elements != this.widget_options.button_elements) {
            this.button_elements = this.widget_options.button_elements;
        }
        if (this.url != this.widget_options.url) {
            this.url = this.widget_options.url;
        }
        if (this.blank != this.widget_options.blank) {
            this.blank = this.widget_options.blank;
        }
        if (this.zoom_on_click != this.widget_options.zoom_on_click) {
            this.zoom_on_click = this.widget_options.zoom_on_click;
        }
        if (this.is_card_display_single != this.widget_options.is_card_display_single) {
            this.is_card_display_single = this.widget_options.is_card_display_single;
        }
        if (this.do_not_use_page_widget_ids != this.widget_options.do_not_use_page_widget_ids) {
            this.do_not_use_page_widget_ids = this.widget_options.do_not_use_page_widget_ids;
        }
        if (this.show_message_no_data != this.widget_options.show_message_no_data) {
            this.show_message_no_data = this.widget_options.show_message_no_data;
        }
        if (this.message_no_data != this.widget_options.message_no_data) {
            this.message_no_data = this.widget_options.message_no_data;
        }
        if (this.filter_on_cmv_vo != this.widget_options.filter_on_cmv_vo) {
            this.filter_on_cmv_vo = this.widget_options.filter_on_cmv_vo;
        }
        if (this.field_filter_cmv_vo != this.widget_options.field_filter_cmv_vo) {
            this.field_filter_cmv_vo = this.widget_options.field_filter_cmv_vo;
        }
        if (this.symbole_surtitre != this.widget_options.symbole_surtitre) {
            this.symbole_surtitre = this.widget_options.symbole_surtitre;
        }
        if (this.symbole_sous_titre != this.widget_options.symbole_sous_titre) {
            this.symbole_sous_titre = this.widget_options.symbole_sous_titre;
        }
        if (this.filter_on_distant_vo != this.widget_options.filter_on_distant_vo) {
            this.filter_on_distant_vo = this.widget_options.filter_on_distant_vo;
        }
        if (this.field_filter_distant_vo != this.widget_options.field_filter_distant_vo) {
            this.field_filter_distant_vo = this.widget_options.field_filter_distant_vo;
        }
        if (this.activate_like_button != this.widget_options.activate_like_button) {
            this.activate_like_button = this.widget_options.activate_like_button;
        }

        if (this.next_update_options != this.widget_options) {
            this.next_update_options = this.widget_options;
        }

        this.page_widget_options = await query(DashboardPageWidgetVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<DashboardPageWidgetVO>().page_id, this.page_widget.page_id)
            .filter_by_num_not_eq(field_names<DashboardPageWidgetVO>().id, this.page_widget.id)
            .filter_is_true(field_names<DashboardWidgetVO>().is_filter, DashboardWidgetVO.API_TYPE_ID)
            .select_vos();

        if (this.do_not_use_page_widget_ids?.length) {
            this.do_not_use_page_widgets = this.page_widget_options.filter((page_widget) => {
                return this.do_not_use_page_widget_ids.includes(page_widget.id);
            });
        }
    }

    private page_widget_label(p_widget: DashboardPageWidgetVO): string {
        return "Widget ID: " + p_widget.id.toString();
    }

    private async switch_filter_on_cmv_vo() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.filter_on_cmv_vo = !this.next_update_options.filter_on_cmv_vo;
        if (this.next_update_options.filter_on_cmv_vo == true) {
            this.next_update_options.filter_on_distant_vo = false;
        }

        await this.throttled_update_options();
    }

    private async switch_filter_on_distant_vo() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.filter_on_distant_vo = !this.next_update_options.filter_on_distant_vo;
        if (this.next_update_options.filter_on_distant_vo == true) {
            this.next_update_options.filter_on_cmv_vo = false;
        }

        await this.throttled_update_options();
    }

    private async switch_show_message_no_data() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_message_no_data = !this.next_update_options.show_message_no_data;

        await this.throttled_update_options();
    }

    private async switch_button_for_elements() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.button_elements = !this.next_update_options.button_elements;

        await this.throttled_update_options();
    }

    private async switch_use_blank() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.blank = !this.next_update_options.blank;

        await this.throttled_update_options();
    }

    private async switch_zoom_on_click() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.zoom_on_click = !this.next_update_options.zoom_on_click;

        await this.throttled_update_options();
    }

    private async switch_activate_like_button() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.activate_like_button = !this.next_update_options.activate_like_button;

        await this.throttled_update_options();
    }

    private async switch_is_card_display_single() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.is_card_display_single = !this.next_update_options.is_card_display_single;

        await this.throttled_update_options();
    }

    private async change_sort_dimension(dimension: string) {
        if (!this.widget_options) {
            return;
        }
        this.next_update_options = this.widget_options;
        const accepted_dimensions = ['Ascending', 'Descending', 'Default'];
        this.next_update_options = this.widget_options;
        if (accepted_dimensions.indexOf(dimension) < 0) {
            return;
        } else {
            this.next_update_options.sort_dimension_by = dimension;
        }

        await this.throttled_update_options();
    }

    private async change_type_display(type_display: number) {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;
        this.next_update_options.type_display = type_display;

        await this.throttled_update_options();
    }

    private async change_display_orientation(display_orientation: number) {
        if (!this.widget_options) {
            return;
        }

        this.next_update_options = this.widget_options;
        this.next_update_options.display_orientation = display_orientation;

        await this.throttled_update_options();
    }

    private async remove_title_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.title) {
            return null;
        }

        this.next_update_options.title = null;

        await this.throttled_update_options();
    }

    private async remove_card_footer_label_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.card_footer_label) {
            return null;
        }

        this.next_update_options.card_footer_label = null;

        await this.throttled_update_options();
    }

    private async add_title_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.title = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async add_card_footer_label_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.card_footer_label = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_field_filter_cmv_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.field_filter_cmv_vo) {
            return null;
        }

        this.next_update_options.field_filter_cmv_vo = null;

        await this.throttled_update_options();
    }

    private async add_field_filter_cmv_vo_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.field_filter_cmv_vo = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_field_filter_distant_vo_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.field_filter_distant_vo) {
            return null;
        }

        this.next_update_options.field_filter_distant_vo = null;

        await this.throttled_update_options();
    }

    private async add_field_filter_distant_vo_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.field_filter_distant_vo = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_subtitle_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.subtitle) {
            return null;
        }

        this.next_update_options.subtitle = null;

        await this.throttled_update_options();
    }

    private async add_subtitle_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.subtitle = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_surtitre_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.surtitre) {
            return null;
        }

        this.next_update_options.surtitre = null;

        await this.throttled_update_options();
    }

    private async add_surtitre_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.surtitre = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_image_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.image_id) {
            return null;
        }

        this.next_update_options.image_id = null;

        await this.throttled_update_options();
    }

    private async add_image_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.image_id = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_url_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.url) {
            return null;
        }

        this.next_update_options.url = null;

        await this.throttled_update_options();
    }

    private async add_url_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.url = dimension_vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_sort_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.sort_field_ref) {
            return null;
        }

        this.next_update_options.sort_field_ref = null;

        await this.throttled_update_options();
    }

    private async add_sort_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.sort_field_ref = dimension_vo_field_ref;

        await this.throttled_update_options();
    }
}