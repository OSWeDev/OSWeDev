import IDistantVOBase from "../../../../IDistantVOBase";

/**
 * Anciennement DataFilterOption
 */
export default class DataFilterOptionVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "data_filter_option";

    public static STATE_NA: number = 0; // pour des raisons historiques ou la première valeur est 1 et pas 0... probablmement osef
    public static STATE_SELECTED: number = 1;
    public static STATE_SELECTABLE: number = 2;
    public static STATE_UNSELECTABLE: number = 3;
    public static STATE_LABELS: { [key: number]: string } = {
        [DataFilterOptionVO.STATE_NA]: 'DataFilterOptionVO.STATE_LABELS.NA',
        [DataFilterOptionVO.STATE_SELECTED]: 'DataFilterOptionVO.STATE_LABELS.SELECTED',
        [DataFilterOptionVO.STATE_SELECTABLE]: 'DataFilterOptionVO.STATE_LABELS.SELECTABLE',
        [DataFilterOptionVO.STATE_UNSELECTABLE]: 'DataFilterOptionVO.STATE_LABELS.UNSELECTABLE',
    };

    public _type: string = DataFilterOptionVO.API_TYPE_ID;
    public id: number;

    public select_state: number;

    public label: string;
    public disabled_state_selected: boolean;
    public disabled_state_selectable: boolean;
    public disabled_state_unselectable: boolean;
    public img: string;
    public desc: string;
    public boolean_value: boolean;
    public numeric_value: number;
    public string_value: string;
    public tstz_value: number;
    public options: DataFilterOptionVO[];

    public custom_name: string;

    // TODO à gérer à la création ?
    // if(!custom_name) {
    //         this.custom_name = label;
    //     }

    get text_uid(): string {
        if (this.id !== null) {
            return this.id.toString();
        }

        if (this.boolean_value !== null) {
            return this.boolean_value ? 'TRUE' : 'FALSE';
        }

        if (this.numeric_value !== null) {
            return this.numeric_value.toString();
        }

        if (this.tstz_value !== null) {
            return this.tstz_value.toString();
        }

        return this.string_value;
    }
}