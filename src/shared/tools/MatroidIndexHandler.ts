import IRange from "../modules/DataRender/interfaces/IRange";
import MatroidController from "../modules/Matroid/MatroidController";
import VarsController from "../modules/Var/VarsController";
import VarDataBaseVO from "../modules/Var/vos/VarDataBaseVO";
import VOsTypesManager from "../modules/VOsTypesManager";
import RangeHandler from "./RangeHandler";

export default class MatroidIndexHandler {
    public static getInstance(): MatroidIndexHandler {
        if (!MatroidIndexHandler.instance) {
            MatroidIndexHandler.instance = new MatroidIndexHandler();
        }
        return MatroidIndexHandler.instance;
    }

    private static instance: MatroidIndexHandler = null;

    // Ne peuvent être utilisés : - (négatif) | (séparateur de field) & (séparateur de min/max) $ (séparateur de range)
    private TO_BASE_76_CARS: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,;!%*_@?:/#=+';
    private FROM_BASE_76_CARS: { [base_76_car: string]: number } = {
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15, 'g': 16, 'h': 17, 'i': 18, 'j': 19,
        'k': 20, 'l': 21, 'm': 22, 'n': 23, 'o': 24, 'p': 25, 'q': 26, 'r': 27, 's': 28, 't': 29,
        'u': 30, 'v': 31, 'w': 32, 'x': 33, 'y': 34, 'z': 35,
        'A': 36, 'B': 37, 'C': 38, 'D': 39, 'E': 40, 'F': 41, 'G': 42, 'H': 43, 'I': 44, 'J': 45,
        'K': 46, 'L': 47, 'M': 48, 'N': 49, 'O': 50, 'P': 51, 'Q': 52, 'R': 53, 'S': 54, 'T': 55,
        'U': 56, 'V': 57, 'W': 58, 'X': 59, 'Y': 60, 'Z': 61,
        '.': 62, ',': 63, ';': 64, '!': 65, '%': 66, '*': 67, '_': 68, '@': 69, '?': 70, ':': 71,
        '/': 72, '#': 73, '=': 74, '+': 75
    };

    private constructor() { }

    /**
     * Does not handle decimals
     */
    public base_10_num_to_base_76_txt(num: number): string {

        if (num == null) {
            return null;
        }

        let res: string = '';
        let minus: boolean = num < 0;

        num = (num < 0) ? -num : num;

        while (num >= 76) {

            res = this.TO_BASE_76_CARS[num % 76] + res;
            num = Math.floor(num / 76);
        }
        res = ((num == 0) && (res.length > 0)) ? res : this.TO_BASE_76_CARS[num % 76] + res;

        return minus ? '-' + res : res;
    }

    /**
     * Does not handle decimals
     */
    public base_76_txt_to_base_10_num(b76: string): number {

        if (b76 == null) {
            return null;
        }

        let res: number = 0;
        let minus: boolean = b76[0] == '-';

        if (minus) {
            b76 = b76.substr(1, b76.length);
        }

        let i = 0;
        while (i < b76.length) {
            res = (res * 76) + this.FROM_BASE_76_CARS[b76[i]];
            i++;
        }
        return minus ? -res : res;
    }

    public get_normalized_range(range: IRange, is_matroid_index: boolean = false): string {

        if (!range) {
            return null;
        }

        let res: string = '';

        // Toujours 1 caractère max
        // Inutile sur un index de matroid puisqu'on le retrouve sur le var_id
        res += is_matroid_index ? this.base_10_num_to_base_76_txt(range.segment_type) : '';

        if (RangeHandler.getInstance().getCardinal(range) == 1) {
            res += this.base_10_num_to_base_76_txt(range.min);
        } else {
            res += RangeHandler.getInstance().is_left_open(range) ? '' : this.base_10_num_to_base_76_txt(range.min);
            res += '&';
            res += RangeHandler.getInstance().is_right_open(range) ? '' : this.base_10_num_to_base_76_txt(range.max);
        }

        return res;
    }

    public from_normalized_range(index: string, range_type: number, is_matroid_index: boolean = false, matroid_segmentations: { [field_id: string]: number } = null, field_id: string = null): IRange {

        if (index == null) {
            return null;
        }

        // Toujours 1 caractère max
        let segment_type = is_matroid_index ? matroid_segmentations[field_id] : this.FROM_BASE_76_CARS[index[0]];

        let separator_position = index.indexOf('&');
        let min_max = is_matroid_index ? index : index.substring(1, index.length);

        if (separator_position > 0) {
            let splitted_min_max = min_max.split('&');
            return RangeHandler.getInstance().createNew(
                range_type,
                (splitted_min_max[0] == '') ? RangeHandler.getInstance().get_left_open_min_value(range_type) : this.base_76_txt_to_base_10_num(splitted_min_max[0]),
                (splitted_min_max[1] == '') ? RangeHandler.getInstance().get_right_open_max_value(range_type) : this.base_76_txt_to_base_10_num(splitted_min_max[1]), true, false, segment_type);
        } else {
            return RangeHandler.getInstance().create_single_elt_range(range_type, this.base_76_txt_to_base_10_num(min_max), segment_type);
        }
    }

    public get_normalized_ranges(ranges: IRange[], is_matroid_index: boolean = false): string {

        if (!ranges) {
            return null;
        }

        // On fait une union sur la dimension
        // Si on est sur un matroid index on a déjà fait l'union
        ranges = is_matroid_index ? ranges : RangeHandler.getInstance().getRangesUnion(ranges);

        let res: string = '';

        ranges.forEach((range) => {
            res += (res.length > 0 ? '$' : '') + this.get_normalized_range(range, is_matroid_index);
        });
        return res;
    }

    public from_normalized_ranges(index: string, range_type: number, is_matroid_index: boolean = false, matroid_segmentations: { [field_id: string]: number } = null, field_id: string = null): IRange[] {

        if (index == null) {
            return null;
        }

        let ranges = [];
        let splitted_index = index.split('$');

        splitted_index.forEach((e) => {
            ranges.push(this.from_normalized_range(e, range_type, is_matroid_index, matroid_segmentations, field_id));
        });

        return ranges;
    }

    public get_human_readable_index(vardata: VarDataBaseVO): string {
        if (!vardata) {
            return null;
        }

        let res: string = vardata.var_id.toString();

        this.normalize_vardata_fields(vardata);
        let fields = MatroidController.getInstance().getMatroidFields(vardata._type);

        for (let i in fields) {
            let field = fields[i];

            res += '|' + RangeHandler.getInstance().humanizeRanges(vardata[field.field_id]);
        }
        return res;
    }

    public get_normalized_vardata(vardata: VarDataBaseVO): string {

        if (!vardata) {
            return null;
        }

        let res: string = this.base_10_num_to_base_76_txt(vardata.var_id);

        this.normalize_vardata_fields(vardata);
        let fields = MatroidController.getInstance().getMatroidFields(vardata._type);

        for (let i in fields) {
            let field = fields[i];

            res += '|' + this.get_normalized_ranges(vardata[field.field_id], true);
        }
        return res;
    }

    public from_normalized_vardata(index: string): VarDataBaseVO {

        if (!index) {
            return null;
        }

        let pieces: string[] = index.split('|');
        let var_id: number = this.base_76_txt_to_base_10_num(pieces[0]);
        let var_conf = VarsController.getInstance().var_conf_by_id[var_id];
        let res: VarDataBaseVO = VOsTypesManager.getInstance().moduleTables_by_voType[var_conf.var_data_vo_type].voConstructor();

        res.var_id = var_id;
        let fields = MatroidController.getInstance().getMatroidFields(var_conf.var_data_vo_type);

        let matroid_segmentations = VarDataBaseVO.get_varconf_segmentations(var_conf);

        let i = 0;
        while (i < fields.length) {
            let field = fields[i];
            res[field.field_id] = this.from_normalized_ranges(pieces[i + 1], RangeHandler.getInstance().getRangeType(field), true, matroid_segmentations, field.field_id);
            i++;
        }
        return res;
    }

    public normalize_vardata_fields(vardata: VarDataBaseVO) {
        if (!vardata) {
            return null;
        }

        let var_conf = VarsController.getInstance().var_conf_by_id[vardata.var_id];
        let field_segmentations: { [field_id: string]: number } = VarDataBaseVO.get_varconf_segmentations(var_conf);
        VarDataBaseVO.adapt_param_to_varconf_segmentations(vardata, field_segmentations);
    }
}