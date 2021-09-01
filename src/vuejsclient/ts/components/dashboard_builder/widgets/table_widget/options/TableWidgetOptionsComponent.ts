import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import TableWidgetOptions from './TableWidgetOptions';
import './TableWidgetOptionsComponent.scss';

@Component({
    template: require('./TableWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class TableWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: TableWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false });

    private async remove_field_ref(vo_field_ref: VOFieldRefVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_refs) {
            return null;
        }

        let i = this.next_update_options.vo_field_refs.findIndex((ref_elt) => {
            return ref_elt.id == vo_field_ref.id;
        });

        if (i < 0) {
            return null;
        }

        await ModuleDAO.getInstance().deleteVOs([vo_field_ref]);
        this.next_update_options.vo_field_refs.splice(i, 1);

        await this.throttled_update_options();
    }

    private async add_field_ref(api_type_id: string, field_id: string, vo_field_ref: VOFieldRefVO) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new TableWidgetOptions(null, this.page_widget.id);
        }

        let i = -1;
        let found = false;

        if (!!vo_field_ref) {
            i = this.next_update_options.vo_field_refs.findIndex((ref_elt) => {
                return ref_elt.id == vo_field_ref.id;
            });
        }

        if ((i < 0) || (!vo_field_ref)) {
            i = 0;
            vo_field_ref = new VOFieldRefVO();
            vo_field_ref.weight = 0;
        } else {
            found = true;
        }

        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(vo_field_ref);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.getInstance().error("Failed insert new field ref");
            return null;
        }
        if (!vo_field_ref.id) {
            vo_field_ref.id = insertOrDeleteQueryResult.id;
        }

        if (!found) {
            if (!this.next_update_options.vo_field_refs) {
                this.next_update_options.vo_field_refs = [];
            }
            this.next_update_options.vo_field_refs.push(vo_field_ref);
        }

        await this.throttled_update_options();
    }

    get vo_field_refs(): VOFieldRefVO[] {
        let options: TableWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_refs)) {
            return null;
        }

        let res: VOFieldRefVO[] = [];
        for (let i in options.vo_field_refs) {
            res.push(Object.assign(new VOFieldRefVO(), options.vo_field_refs));
        }

        return res;
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.title_name_code_text;
    }

    get default_title_translation(): string {
        return null;
    }

    get widget_options(): TableWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: TableWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as TableWidgetOptions;
                options = new TableWidgetOptions(options.vo_field_refs, options.page_widget_id);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}