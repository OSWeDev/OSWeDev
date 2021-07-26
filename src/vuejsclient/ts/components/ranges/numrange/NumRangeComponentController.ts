import NumRangeEnumHandler from './NumRangeEnumHandler';

export default class NumRangeComponentController {

    public static getInstance() {

        if (!NumRangeComponentController.instance) {
            NumRangeComponentController.instance = new NumRangeComponentController();
        }
        return NumRangeComponentController.instance;
    }

    private static instance: NumRangeComponentController = null;

    public num_ranges_enum_handler: { [vo_type: string]: { [field_id: string]: NumRangeEnumHandler } } = {};

    protected constructor() { }

    public register_enum_handler(vo_type: string, field_id: string, handler: NumRangeEnumHandler) {
        if (!this.num_ranges_enum_handler[vo_type]) {
            this.num_ranges_enum_handler[vo_type] = {};
        }
        this.num_ranges_enum_handler[vo_type][field_id] = handler;
    }

    public get_enum_handler(vo_type: string, field_id: string): NumRangeEnumHandler {
        if (!this.num_ranges_enum_handler[vo_type]) {
            return null;
        }
        return this.num_ranges_enum_handler[vo_type][field_id] ? this.num_ranges_enum_handler[vo_type][field_id] : null;
    }
}