import '../RangeComponent.scss';

export default class NumRangeComponentController {

    public static getInstance() {

        if (!NumRangeComponentController.instance) {
            NumRangeComponentController.instance = new NumRangeComponentController();
        }
        return NumRangeComponentController.instance;
    }

    private static instance: NumRangeComponentController = null;

    public num_ranges_label_handler: { [vo_type: string]: { [field_id: string]: (value: number) => Promise<string> } } = {};

    protected constructor() { }

    public register_label_handler(vo_type: string, field_id: string, handler: (value: number) => Promise<string>) {
        if (!this.num_ranges_label_handler[vo_type]) {
            this.num_ranges_label_handler[vo_type] = {};
        }
        this.num_ranges_label_handler[vo_type][field_id] = handler;
    }
}