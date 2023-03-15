import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import VueComponentBase from '../../../../VueComponentBase';
import ContextFilterHandler from '../../../../../../../shared/modules/ContextFilter/ContextFilterHandler';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './SaveFavoritesFiltersWidgetComponent.scss';
import { cloneDeep } from 'lodash';

export interface IReadableActiveFieldFilters {
    readable_active_field_filters: string;
    filter: ContextFilterVO;
    path: { api_type_id: string, field_id: string };
}

export interface ISaveFavoritesFiltersModalValidationCallbackProps {
    favorites_filters_name: string;
    selected_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };
}

@Component({
    template: require('./SaveFavoritesFiltersModalComponent.pug'),
    components: {}
})
export default class SaveFavoritesFiltersModalComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    private modal_initialized: boolean = false;

    private is_modal_open: boolean = false;

    private favorites_filters_name: string = null;
    private selected_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } } = null;

    private on_validation_callback: (props: ISaveFavoritesFiltersModalValidationCallbackProps) => Promise<void> = null;

    /**
     * Handle Open Modal
     *
     * @param props
     * @param validation_callback
     * @return {void}
     */
    public open_modal(
        props: any = null,
        validation_callback?: (props?: ISaveFavoritesFiltersModalValidationCallbackProps) => Promise<void>
    ): void {
        this.is_modal_open = true;

        if (validation_callback) {
            this.on_validation_callback = validation_callback;
        }
    }

    /**
     * On mounted
     *  - Happen on component mount
     *
     * @return {void}
     */
    private mounted(): void {
        this.$nextTick(async () => {
            if (!this.modal_initialized) {
                this.modal_initialized = true;
                $("#save_favorites_filters_modal_component").on("hidden.bs.modal", () => {
                    this.is_modal_open = false;
                });
            }
        });
    }

    /**
     * Watch on is_modal_open
     *  - Happen on component each time is_modal_open changes
     *
     * @returns {void}
     */
    @Watch('is_modal_open')
    private is_modal_open_watcher(): void {
        this.handle_modal_state();
    }

    /**
     * Handle Close Modal
     *
     * @return {Promise<void>}
     */
    private async handle_close_modal(): Promise<void> {
        this.is_modal_open = false;
    }

    /**
     * Handle Save
     *  - Save active dashboard filters for the current user
     *
     * @return {Promise<void>}
     */
    private async handle_save(): Promise<void> {
        this.is_modal_open = false;

        if (this.on_validation_callback) {
            await this.on_validation_callback({
                favorites_filters_name: this.favorites_filters_name,
                selected_field_filters: this.selected_field_filters
            });
        }
    }

    /**
     * Toggle Modal Open
     *  - Swich modal from show to hide (vice versa)
     *
     * @return {void}
     */
    private toggle_modal_open(): void {
        this.is_modal_open = !this.is_modal_open;
    }

    /**
     * Handle Modal State
     *  - Manage modal depending on its state
     *
     * @return {Promise<void>}
     */
    private async handle_modal_state(): Promise<void> {
        if (this.is_modal_open) {
            this.init_modal();
            $('#save_favorites_filters_modal_component').modal('show');
        } else {
            this.reset_modal();
            $('#save_favorites_filters_modal_component').modal('hide');
        }
    }

    /**
     * Init Modal
     *
     * @return {void}
     */
    private init_modal(): void {
        this.selected_field_filters = cloneDeep(this.get_active_field_filters);
    }

    /**
     * Reset Modal
     *
     * @return {void}
     */
    private reset_modal(): void {
        this.favorites_filters_name = null;
        this.selected_field_filters = null;
    }

    /**
     * Is Active Field Filter Selected
     *
     * @param {IReadableActiveFieldFilters} [props]
     * @returns {boolean}
     */
    private is_active_field_filter_selected(props: IReadableActiveFieldFilters): boolean {
        const path = props.path;

        if (!this.selected_field_filters) {
            return false;
        }

        return this.selected_field_filters[path.api_type_id] ?
            this.selected_field_filters[path.api_type_id][path.field_id] != undefined :
            false;
    }

    /**
     * Handle Toggle Select Favorite Filter
     *  - Select or unselect from favorites the given active filter props
     *
     * @param {IReadableActiveFieldFilters} [props]
     * @returns {void}
     */
    private handle_toggle_select_favorite_filter(props: IReadableActiveFieldFilters): void {
        const path = props.path;

        let tmp_selected_field_filters = cloneDeep(this.selected_field_filters);
        const active_field_filters = this.get_active_field_filters;

        if (!tmp_selected_field_filters) {
            tmp_selected_field_filters = {};
        }

        if (this.is_active_field_filter_selected(props)) {
            delete tmp_selected_field_filters[path.api_type_id][path.field_id];
        } else {
            tmp_selected_field_filters[path.api_type_id][path.field_id] = active_field_filters[path.api_type_id][path.field_id];
        }

        this.selected_field_filters = tmp_selected_field_filters;
    }

    /**
     * Get Readable Active Field Filters HMI
     *  - For each selected active field filters get as Human readable filters
     *
     * @return {{ [translatable_field_filters_code: string]: IReadableActiveFieldFilters }}
     */
    get readable_active_field_filters_hmi(): { [translatable_field_filters_code: string]: IReadableActiveFieldFilters } {
        let res: { [translatable_field_filters_code: string]: IReadableActiveFieldFilters } = {};

        const active_field_filters = this.get_active_field_filters;

        for (const api_type_id in active_field_filters) {
            const filters = active_field_filters[api_type_id];

            for (const field_id in filters) {
                // Label of filter to be displayed
                const label = api_type_id.concat(`.${field_id}`);

                // the actual filter
                const filter = filters[field_id];

                // Path to find the actual filter
                const path: { api_type_id: string, field_id: string, } = {
                    api_type_id,
                    field_id
                };

                // Get HMI readable active field filters
                const readable_active_field_filters = ContextFilterHandler.context_filter_to_readable_ihm(filter);

                res[label] = {
                    readable_active_field_filters,
                    filter,
                    path,
                };

            }
        }

        return res;
    }

    /**
     * Get base_filter
     */
    get base_filter(): string {
        return 'filter_opt_';
    }
}