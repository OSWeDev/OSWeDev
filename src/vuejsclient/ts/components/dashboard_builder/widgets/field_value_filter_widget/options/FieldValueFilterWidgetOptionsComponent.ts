import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './FieldValueFilterWidgetOptionsComponent.scss';
import IFieldValueFilterWidgetOptions from './IFieldValueFilterWidgetOptions';

@Component({
    template: require('./FieldValueFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent
    }
})
export default class FieldValueFilterWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    get vo_field_ref(): VOFieldRefVO {
        if ((!this.page_widget) || (!this.page_widget.json_options)) {
            return null;
        }

        let options: IFieldValueFilterWidgetOptions = null;
        try {
            options = JSON.parse(this.page_widget.json_options) as IFieldValueFilterWidgetOptions;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        if (!options) {
            return null;
        }

        return options.vo_field_ref;
    }

    private async remove_field_ref() {
        if ((!this.page_widget) || (!this.page_widget.json_options)) {
            return null;
        }

        let options: IFieldValueFilterWidgetOptions = null;
        try {
            options = JSON.parse(this.page_widget.json_options) as IFieldValueFilterWidgetOptions;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        if (!options) {
            return null;
        }

        if (!options.vo_field_ref) {
            return null;
        }

        await ModuleDAO.getInstance().deleteVOs([options.vo_field_ref]);
        options.vo_field_ref = null;
        try {
            this.page_widget.json_options = JSON.stringify(options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
    }

    private async add_field_ref(api_type_id: string, field_id: string) {
        if ((!this.page_widget) || (!this.page_widget.json_options)) {
            return null;
        }

        let options: IFieldValueFilterWidgetOptions = null;
        try {
            options = JSON.parse(this.page_widget.json_options) as IFieldValueFilterWidgetOptions;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        if (!options) {
            return null;
        }

        if (!!options.vo_field_ref) {
            return null;
        }

        let vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;
        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(vo_field_ref);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            ConsoleHandler.getInstance().error("Failed insert new field ref");
            return null;
        }
        vo_field_ref.id = insertOrDeleteQueryResult.id;

        options.vo_field_ref = vo_field_ref;
        try {
            this.page_widget.json_options = JSON.stringify(options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
    }
}