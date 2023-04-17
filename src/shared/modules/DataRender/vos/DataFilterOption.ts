/**
 * DataFilterOption
 */
export default class DataFilterOption {
    public static STATE_SELECTED: number = 1;
    public static STATE_SELECTABLE: number = 2;
    public static STATE_UNSELECTABLE: number = 3;

    public text_uid: string = null;

    public constructor(
        public select_state?: number,
        public label?: string,
        public id?: number,
        public disabled_state_selected: boolean = false,
        public disabled_state_selectable: boolean = false,
        public disabled_state_unselectable: boolean = false,
        public img: string = null,
        public desc: string = null,
        public boolean_value: boolean = null,
        public numeric_value: number = null,
        public string_value: string = null,
        public tstz_value: number = null,
        public init: boolean = false,
        public options: DataFilterOption[] = [],
        public custom_name: string = null,
    ) {
        if (!custom_name) {
            this.custom_name = label;
        }

        if (init) {
            this.init_text_uid();
        }
    }

    /**
     * Hydrate from the given properties
     *
     * @param {Partial<DataFilterOption>} [props]
     * @returns {DataFilterOption}
     */
    public from(props: Partial<DataFilterOption>): DataFilterOption {

        Object.assign(this, props);

        return this;
    }

    public init_text_uid() {
        if (this.id !== null) {
            this.text_uid = this.id.toString();
            return;
        }

        if (this.boolean_value !== null) {
            this.text_uid = this.boolean_value ? 'TRUE' : 'FALSE';
            return;
        }

        if (this.numeric_value !== null) {
            this.text_uid = this.numeric_value.toString();
            return;
        }

        if (this.tstz_value !== null) {
            this.text_uid = this.tstz_value.toString();
            return;
        }

        this.text_uid = this.string_value;
    }
}