import VOFieldRefVO from "../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO";

export default class FieldValueFilterWidgetOptions {

    public static VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX: string = "FieldValueFilterWidgetOptions.vo_field_ref.placeholder.";

    public constructor(
        public vo_field_ref: VOFieldRefVO,
        public can_select_multiple: boolean,
        public max_visible_options: number
    ) { }

    get placeholder_name_code_text(): string {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.id)) {
            return null;
        }
        return FieldValueFilterWidgetOptions.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + this.vo_field_ref.id;
    }
}