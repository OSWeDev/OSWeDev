import { all_promises } from "../../../../../../shared/tools/PromiseTools";
import ThrottleHelper from "../../../../../../shared/tools/ThrottleHelper";
import ValidationFiltersCallUpdaters from "./ValidationFiltersCallUpdaters";

export default class ValidationFiltersWidgetController {

    // istanbul ignore next: nothing to test
    public static getInstance(): ValidationFiltersWidgetController {
        if (!this.instance) {
            this.instance = new ValidationFiltersWidgetController();
        }

        return this.instance;
    }

    private static instance = null;

    public updaters: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: Array<{ validator_page_widget_id: number, updater: () => Promise<void> }> } } } = {};
    public is_init: { [dashboard_id: number]: { [dashboard_page_id: number]: { [page_widget_id: number]: boolean } } } = {};

    public throttle_call_updaters = ThrottleHelper.declare_throttle_with_stackable_args(this.throttled_call_updaters.bind(this), 50);

    private constructor() { }

    public async register_updater(
        dashboard_id: number,
        page_id: number,
        page_widget_id: number,
        updater: () => Promise<void>,
        validator_page_widget_id?: number, // To know/specify which widget call the updaters
    ) {

        if (!this.updaters[dashboard_id]) {
            this.updaters[dashboard_id] = {};
        }

        if (!this.updaters[dashboard_id][page_id]) {
            this.updaters[dashboard_id][page_id] = {};
        }

        if (!this.updaters[dashboard_id][page_id][page_widget_id]) {
            this.updaters[dashboard_id][page_id][page_widget_id] = [];
        }

        // Associate the actual updater to the given page_widget_id
        const updater_caller = {
            validator_page_widget_id,
            updater,
        };

        this.updaters[dashboard_id][page_id][page_widget_id].push(updater_caller);
    }

    private async throttled_call_updaters(params: ValidationFiltersCallUpdaters[]) {

        for (const i in params) {

            const caller_page_widget_id = params[i].page_widget_id; // To know which widget activate the updaters
            const dashboard_id = params[i].dashboard_id;
            const page_id = params[i].page_id;

            let updaters_by_page_widget_id: { [page_widget_id: number]: Array<{ validator_page_widget_id: number, updater: () => Promise<void> }> } = {};

            if (
                ValidationFiltersWidgetController.getInstance().updaters &&
                ValidationFiltersWidgetController.getInstance().updaters[dashboard_id]
            ) {
                updaters_by_page_widget_id = ValidationFiltersWidgetController.getInstance().updaters[dashboard_id][page_id];
            }

            const promises = [];

            // Page has at least one validator
            const page_has_validator = Object.values(updaters_by_page_widget_id).some((updater_callers) => {
                return updater_callers.find((updater_caller) => {
                    return updater_caller.validator_page_widget_id != null;
                });
            });

            for (const key in updaters_by_page_widget_id) {
                const updater_callers = updaters_by_page_widget_id[key];

                // Update all updaters depending on the given caller_page_widget_id
                for (const j in updater_callers) {
                    const updater_caller = updater_callers[j];

                    // If page has at least one validator, and it is not
                    // the actual updater (the validate button) we skip
                    if (
                        page_has_validator &&
                        updater_caller.validator_page_widget_id != caller_page_widget_id
                    ) {
                        continue;
                    }

                    // Once the updater (validate button) is called,
                    // We should call all updaters of the same page_id
                    if (
                        page_has_validator &&
                        updater_caller.validator_page_widget_id == caller_page_widget_id
                    ) {
                        Object.values(updaters_by_page_widget_id).forEach((callers: Array<{ validator_page_widget_id: number, updater: () => Promise<void> }>) => {
                            promises.push(callers.map((caller) => caller.updater()));
                        });
                    }

                    if (!page_has_validator) {
                        // We can call the updater of the given page_id if there is no validator
                        promises.push(updater_caller.updater());
                    }
                }
            }

            await all_promises(promises);
        }
    }
}