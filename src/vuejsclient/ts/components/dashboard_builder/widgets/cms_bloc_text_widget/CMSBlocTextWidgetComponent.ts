import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import './CMSBlocTextWidgetComponent.scss';
import CMSBlocTextWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSBlocTextWidgetOptionsVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';

@Component({
    template: require('./CMSBlocTextWidgetComponent.pug'),
    components: {}
})
export default class CMSBlocTextWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private titre: string = null;
    private sous_titre: string = null;
    private contenu: string = null;

    private alignement_titre: string = null;
    private alignement_sous_titre: string = null;
    private alignement_contenu: string = null;

    private style_titre: string = null;
    private style_sous_titre: string = null;
    private style_contenu: string = null;

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.titre = null;
            this.sous_titre = null;
            this.contenu = null;

            this.alignement_titre = this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE);
            this.alignement_sous_titre = this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE);
            this.alignement_contenu = this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE);

            this.style_titre = this.base_style + this.style_alignments(this.alignement_titre);
            this.style_sous_titre = this.base_style + this.style_alignments(this.alignement_sous_titre);
            this.style_contenu = this.base_style + this.style_alignments(this.alignement_contenu);

            return;
        }
        this.titre = this.widget_options.titre.toUpperCase();
        this.sous_titre = this.widget_options.sous_titre;
        this.contenu = this.widget_options.contenu;

        this.alignement_titre = this.widget_options.alignement_titre;
        this.alignement_sous_titre = this.widget_options.alignement_sous_titre;
        this.alignement_contenu = this.widget_options.alignement_contenu;

        this.style_titre = this.base_style + this.style_alignments(this.widget_options.alignement_titre);
        this.style_sous_titre = this.base_style + this.style_alignments(this.widget_options.alignement_sous_titre);
        this.style_contenu = this.base_style + this.style_alignments(this.widget_options.alignement_contenu);
    }

    private async mounted() {
        this.onchange_widget_options();
    }

    private style_alignments(text_alignement: string): string {
        switch (text_alignement) {
            case this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_GAUCHE):
                return 'text-align: start;';
            case this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_CENTRE):
                return 'text-align: center;';
            case this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_DROITE):
                return 'text-align: end;';
            case this.label(CMSBlocTextWidgetOptionsVO.ALIGNER_JUSTIFIE):
                return 'text-align: justify;';
            default:
                break;
        }
    }

    get base_style(): string {
        return "word-wrap: break-word;";
    }

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

}