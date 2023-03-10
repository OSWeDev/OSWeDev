import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardFavoritesFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardFavoritesFiltersVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import { SaveFavoritesFiltersWidgetOptions } from './options/SaveFavoritesFiltersWidgetOptions';
import { SaveFavoritesFiltersWidgetController } from './SaveFavoritesFiltersWidgetController';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './SaveFavoritesFiltersWidgetComponent.scss';

@Component({
    template: require('./SaveFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class SaveFavoritesFiltersWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private start_update: boolean = false;

    /**
     * Handle Save
     *  - Save active dashboard filters for the current user
     */
    private async handle_save() {
        let self = this;

        if (self.start_update) {
            return;
        }

        self.start_update = true;

        let page_filters = null;

        try {
            page_filters = JSON.stringify(self.get_active_field_filters);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        const props = new DashboardFavoritesFiltersVO().from({
            dashboard_id: self.dashboard_page.dashboard_id,
            owner_id: self.data_user.id,
            page_filters,
        });

        self.snotify.prompt(
            self.label('dashboard_viewer.save_favorites_filters.enter_name'),
            self.label('dashboard_viewer.save_favorites_filters.save_favorites'),
            {
                buttons: [
                    {
                        text: self.label('crud.update.modal.save'),
                        action: (toast) => {
                            props.name = toast.value;
                            self.save_favorites_filters(props);

                            return self.snotify.remove(toast.id);
                        },
                    },
                    {
                        text: self.label('crud.update.modal.cancel'),
                        action: (toast) => self.snotify.remove(toast.id)
                    },
                ],
                placeholder: 'Nom', // Max-length = 40,
                showProgressBar: true,
                timeout: 10000,
            });

        self.start_update = false;
    }

    private async save_favorites_filters(props: DashboardFavoritesFiltersVO) {
        let self = this;

        self.snotify.async(self.label('dashboard_viewer.save_favorites_filters.start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await SaveFavoritesFiltersWidgetController.getInstance().throttle_save_favorites_filters(
                    props,
                );

                if (success) {
                    resolve({
                        body: self.label('dashboard_viewer.save_favorites_filters.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('dashboard_viewer.save_favorites_filters.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    get widget_options() {

        if (!this.page_widget) {
            return null;
        }

        let options: SaveFavoritesFiltersWidgetOptions = null;

        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SaveFavoritesFiltersWidgetOptions;
                options = options ? new SaveFavoritesFiltersWidgetOptions().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}