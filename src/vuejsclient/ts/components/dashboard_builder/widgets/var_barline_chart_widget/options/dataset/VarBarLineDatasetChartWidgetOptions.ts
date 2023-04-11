
export default class VarBarLineDatasetChartWidgetOptions {

    public static TYPE_LINE: string = 'line';
    public static TYPE_BAR: string = 'bar';
    public static TYPE_AREA: string = 'area';

    public constructor(

        public var_id: number,

        public filter_type: string,
        public filter_additional_params: string,

        public filter_custom_field_filters: { [field_id: string]: string },

        public bg_color: string,
        public border_color: string,
        public border_width: number,

        public dataset_type: string, // Line Bar Area => area = line + fill to origin https://www.chartjs.org/docs/2.9.4/charts/area.html
    ) { }
}