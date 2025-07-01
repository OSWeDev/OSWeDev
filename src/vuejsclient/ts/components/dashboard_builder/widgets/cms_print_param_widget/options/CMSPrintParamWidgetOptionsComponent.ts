import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSPrintParamWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSPrintParamWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSPrintParamWidgetOptionsComponent.scss';
import ParamVO from '../../../../../../../shared/modules/Params/vos/ParamVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    template: require('./CMSPrintParamWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSPrintParamWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private type_param: number = null;
    private param_name: string = null;
    private titre: string = null;

    private param_name_selected: string = null;
    private param_name_options: string[] = [];
    private type_param_selected: DataFilterOption = null;
    private type_param_options: DataFilterOption[] = [
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSPrintParamWidgetOptionsVO.TYPE_STRING_LABEL), CMSPrintParamWidgetOptionsVO.TYPE_STRING),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSPrintParamWidgetOptionsVO.TYPE_BOOLEAN_LABEL), CMSPrintParamWidgetOptionsVO.TYPE_BOOLEAN),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSPrintParamWidgetOptionsVO.TYPE_INT_LABEL), CMSPrintParamWidgetOptionsVO.TYPE_INT),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSPrintParamWidgetOptionsVO.TYPE_FLOAT_LABEL), CMSPrintParamWidgetOptionsVO.TYPE_FLOAT),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSPrintParamWidgetOptionsVO.TYPE_DATE_LABEL), CMSPrintParamWidgetOptionsVO.TYPE_DATE)
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

    private next_update_options: CMSPrintParamWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    get widget_options(): CMSPrintParamWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSPrintParamWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSPrintParamWidgetOptionsVO;
                options = options ? new CMSPrintParamWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.type_param = CMSPrintParamWidgetOptionsVO.TYPE_STRING;
            this.param_name = "";
            this.titre = "";
            return;
        }

        this.type_param = this.widget_options.type_param;
        this.param_name = this.widget_options.param_name;
        this.titre = this.widget_options.titre;
    }

    @Watch('type_param_selected')
    private async onchange_type_param_selected() {
        this.type_param = this.type_param_selected?.id;
    }

    @Watch('param_name_selected')
    private async onchange_param_name_selected() {
        this.param_name = this.param_name_selected;
    }

    @Watch('type_param')
    @Watch('param_name')
    @Watch('titre')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.type_param != this.type_param ||
            this.widget_options.param_name != this.param_name ||
            this.widget_options.titre != this.titre
        ) {
            this.next_update_options.type_param = this.type_param;
            this.next_update_options.param_name = this.param_name;
            this.next_update_options.titre = this.titre;

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        if (!this.type_param) {
            this.type_param = CMSPrintParamWidgetOptionsVO.TYPE_STRING;
        }

        if (!this.param_name_options || this.param_name_options?.length == 0) {
            const param_options: ParamVO[] = await query(ParamVO.API_TYPE_ID).select_vos();
            this.param_name_options = param_options.map(param => param.name);
        }

        this.type_param_selected = this.type_param_options.find((type_param_option) => type_param_option.id == this.type_param);
        this.param_name_selected = this.param_name_options.find((param_option) => param_option == this.param_name);

        await this.throttled_update_options();
    }

    private get_default_options(): CMSPrintParamWidgetOptionsVO {
        return CMSPrintParamWidgetOptionsVO.createNew(
            CMSPrintParamWidgetOptionsVO.TYPE_STRING,
            "",
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

    private multiselectOptionLabel(filter_item: string): string {
        if ((filter_item == null) || (typeof filter_item == 'undefined')) {
            return '';
        }

        return filter_item;
    }
}