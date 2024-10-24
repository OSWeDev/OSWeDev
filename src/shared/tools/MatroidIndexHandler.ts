import ModuleTableController from "../modules/DAO/ModuleTableController";
import ModuleTableFieldVO from "../modules/DAO/vos/ModuleTableFieldVO";
import IRange from "../modules/DataRender/interfaces/IRange";
import HourSegment from "../modules/DataRender/vos/HourSegment";
import NumRange from "../modules/DataRender/vos/NumRange";
import NumSegment from "../modules/DataRender/vos/NumSegment";
import TimeSegment from "../modules/DataRender/vos/TimeSegment";
import TSRange from "../modules/DataRender/vos/TSRange";
import MatroidController from "../modules/Matroid/MatroidController";
import VarsController from "../modules/Var/VarsController";
import VarDataBaseVO from "../modules/Var/vos/VarDataBaseVO";
import VarPixelFieldConfVO from "../modules/Var/vos/VarPixelFieldConfVO";
import RangeHandler from "./RangeHandler";

export default class MatroidIndexHandler {

    // Ne peuvent être utilisés : - (négatif) | (séparateur de field) & (séparateur de min/max) $ (séparateur de range)
    private static TO_BASE_76_CARS: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,;!%*_@?:/#=+';
    private static FROM_BASE_76_CARS: { [base_76_car: string]: number } = {
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
    public static base_10_num_to_base_76_txt(num: number): string {

        if (num == null) {
            return null;
        }

        let res: string = '';
        const minus: boolean = num < 0;

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
    public static base_76_txt_to_base_10_num(b76: string): number {

        if (b76 == null) {
            return null;
        }

        let res: number = 0;
        const minus: boolean = b76[0] == '-';

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

    /**
     * Check injection ok : aucun risque détecté à ce niveau
     * @param range
     * @param is_matroid_index
     * @returns
     */
    public static get_normalized_range(range: IRange, is_matroid_index: boolean = false): string {

        if (!range) {
            return null;
        }

        let res: string = '';

        // Toujours 1 caractère max
        // Inutile sur un index de matroid puisqu'on le retrouve sur le var_id
        if (!is_matroid_index) {
            const segment_type = MatroidIndexHandler.base_10_num_to_base_76_txt(range.segment_type);
            res += (segment_type == null) ? ((range.range_type == NumRange.RANGE_TYPE) ? NumSegment.TYPE_INT :
                ((range.range_type == TSRange.RANGE_TYPE) ? TimeSegment.TYPE_SECOND : HourSegment.TYPE_SECOND)) : segment_type;
        }

        if (RangeHandler.getCardinal(range) == 1) {
            res += MatroidIndexHandler.base_10_num_to_base_76_txt(range.min);
        } else {
            res += RangeHandler.is_left_open(range) ? '' : MatroidIndexHandler.base_10_num_to_base_76_txt(range.min);
            res += '&';
            res += RangeHandler.is_right_open(range) ? '' : MatroidIndexHandler.base_10_num_to_base_76_txt(range.max);
        }

        return res;
    }

    public static from_normalized_range(index: string, range_type: number, is_matroid_index: boolean = false, matroid_segmentations: { [field_id: string]: number } = null, field_id: string = null): IRange {

        if (index == null) {
            return null;
        }

        // Toujours 1 caractère max
        const segment_type = is_matroid_index ? matroid_segmentations[field_id] : this.FROM_BASE_76_CARS[index[0]];

        const separator_position = index.indexOf('&');
        const min_max = is_matroid_index ? index : index.substring(1, index.length);

        if (separator_position >= 0) {
            const splitted_min_max = min_max.split('&');
            return RangeHandler.createNew(
                range_type,
                (splitted_min_max[0] == '') ? RangeHandler.get_left_open_min_value(range_type) : MatroidIndexHandler.base_76_txt_to_base_10_num(splitted_min_max[0]),
                (splitted_min_max[1] == '') ? RangeHandler.get_right_open_max_value(range_type) : MatroidIndexHandler.base_76_txt_to_base_10_num(splitted_min_max[1]), true, false, segment_type);
        } else {
            return RangeHandler.create_single_elt_range(range_type, MatroidIndexHandler.base_76_txt_to_base_10_num(min_max), segment_type);
        }
    }

    /**
     * Check injection (usage dans les requêtes) ok : get_normalized_range ok
     * @param ranges
     * @param is_matroid_index
     * @returns
     */
    public static get_normalized_ranges(ranges: IRange[], is_matroid_index: boolean = false): string {

        if (!ranges || !ranges.length) {
            return null;
        }

        // On fait une union sur la dimension
        // Si on est sur un matroid index on a déjà fait l'union
        ranges = is_matroid_index ? ranges : RangeHandler.getRangesUnion(ranges);

        if (!ranges || !ranges.length) {
            return null;
        }

        let res: string = '';

        ranges.forEach((range) => {
            res += ((res.length > 0) ? '$' : '') + this.get_normalized_range(range, is_matroid_index);
        });
        return res;
    }

    /**
     * Check injection (usage dans les requêtes) ok : get_normalized_range ok
     * Version pour avoir les variations de chaque pixel (au lieu de faire un index, on fait un index par pixel)
     * @param ranges
     * @param is_matroid_index
     * @returns liste des indexs de pixels
     */
    public static get_pixels_normalized_ranges(ranges: IRange[]): string[] {

        if (!ranges || !ranges.length) {
            return null;
        }

        const res: string[] = [];

        RangeHandler.foreach_ranges_sync(ranges, (e: number) => {
            res.push(MatroidIndexHandler.base_10_num_to_base_76_txt(e));
        });
        return res;
    }

    public static from_normalized_ranges<T extends IRange>(index: string, range_type: number, is_matroid_index: boolean = false, matroid_segmentations: { [field_id: string]: number } = null, field_id: string = null): T[] {

        if (index == null) {
            return null;
        }

        const ranges = [];
        let splitted_index = [];
        try {
            splitted_index = index.split('$');
        } catch (error) {
            console.error('from_normalized_ranges ; index : ' + index
                + ' ; range_type : ' + range_type + ' ; is_matroid_index : ' + is_matroid_index
                + ' ; matroid_segmentations : ' + (matroid_segmentations ? JSON.stringify(matroid_segmentations) : '')
                + ' ; field_id : ' + field_id);
            console.error(error);
        }

        splitted_index.forEach((e) => {
            ranges.push(this.from_normalized_range(e, range_type, is_matroid_index, matroid_segmentations, field_id));
        });

        return ranges;
    }

    public static get_human_readable_index(vardata: VarDataBaseVO): string {
        if (!vardata) {
            return null;
        }

        let res: string = vardata.var_id.toString();

        this.normalize_vardata_fields(vardata);
        const fields = MatroidController.getMatroidFields(vardata._type);

        for (const i in fields) {
            const field = fields[i];

            res += '|' + RangeHandler.humanizeRanges(vardata[field.field_id]);
        }
        return res;
    }

    public static get_normalized_vardata(vardata: VarDataBaseVO): string {

        if (!vardata) {
            return null;
        }

        let res: string = MatroidIndexHandler.base_10_num_to_base_76_txt(vardata.var_id);

        this.normalize_vardata_fields(vardata);
        const fields = MatroidController.getMatroidFields(vardata._type);

        for (const i in fields) {
            const field = fields[i];

            res += '|' + this.get_normalized_ranges(vardata[field.field_id], true);
        }
        return res;
    }

    // /**
    //  * Une variante pour les pixels, qui renvoie les indexs de tous les pixels touchés par cette var
    //  * WARN: nE peut marcher que sur un unique champs pixellisé pour le moment
    //  * @param vardata
    //  * @returns la liste des pixels (sous la forme de leur index)
    //  */
    // public static get_normalized_vardata_pixels(vardata: VarDataBaseVO): string[] {

    //     if (!vardata) {
    //         return null;
    //     }

    //     const res: string[] = [];

    //     let index_prefix = MatroidIndexHandler.base_10_num_to_base_76_txt(vardata.var_id);
    //     let pixel_field_values = null;
    //     let index_suffix = '';

    //     const varconf = VarsController.var_conf_by_id[vardata.var_id];
    //     const pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO } = {};
    //     for (const i in varconf.pixel_fields) {
    //         const pixel_field = varconf.pixel_fields[i];

    //         pixellised_fields_by_id[pixel_field.pixel_param_field_name] = pixel_field;
    //     }

    //     this.normalize_vardata_fields(vardata);
    //     const fields = MatroidController.getMatroidFields(vardata._type);

    //     for (const i in fields) {
    //         const field = fields[i];

    //         if (!pixellised_fields_by_id[field.field_name]) {
    //             if (!pixel_field_values) {
    //                 index_prefix += '|' + this.get_normalized_ranges(vardata[field.field_name], true);
    //             } else {
    //                 index_suffix += '|' + this.get_normalized_ranges(vardata[field.field_name], true);
    //             }
    //         } else {
    //             pixel_field_values = this.get_pixels_normalized_ranges(vardata[field.field_name]);
    //         }
    //     }

    //     if ((!pixel_field_values) || (!pixel_field_values.length)) {
    //         return null;
    //     }

    //     for (const i in pixel_field_values) {
    //         res.push(index_prefix + '|' + pixel_field_values[i] + index_suffix);
    //     }

    //     return res;
    // }
    /**
     * Une variante pour les pixels, qui renvoie les indexs de tous les pixels touchés par cette var
     * @param vardata
     * @returns la liste des pixels (sous la forme de leur index)
     */
    public static get_normalized_vardata_pixels(
        vardata: VarDataBaseVO,
        res: string[],
        pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO } = null,
        fields_to_handle: ModuleTableFieldVO[] = null,
        index_prefix: string = null
    ): void {

        if (!vardata) {
            return null;
        }

        index_prefix = index_prefix ? index_prefix : MatroidIndexHandler.base_10_num_to_base_76_txt(vardata.var_id);
        let pixel_field_values = null;

        if (!pixellised_fields_by_id) {
            const varconf = VarsController.var_conf_by_id[vardata.var_id];
            pixellised_fields_by_id = {};
            for (const i in varconf.pixel_fields) {
                const pixel_field = varconf.pixel_fields[i];

                pixellised_fields_by_id[pixel_field.pixel_param_field_name] = pixel_field;
            }
            this.normalize_vardata_fields(vardata);
        }

        fields_to_handle = fields_to_handle ? fields_to_handle : MatroidController.getMatroidFields(vardata._type);

        const field = fields_to_handle.shift();
        if (!field) {
            res.push(index_prefix);
            return;
        }

        if (!pixellised_fields_by_id[field.field_name]) {
            index_prefix += '|' + this.get_normalized_ranges(vardata[field.field_name], true);

            if (!fields_to_handle.length) {
                res.push(index_prefix);
            } else {
                this.get_normalized_vardata_pixels(
                    vardata,
                    res,
                    pixellised_fields_by_id,
                    Array.from(fields_to_handle),
                    index_prefix,
                );
            }

        } else {
            pixel_field_values = this.get_pixels_normalized_ranges(vardata[field.field_name]);
            for (const i in pixel_field_values) {
                const pixel_field_value = pixel_field_values[i];

                if (!fields_to_handle.length) {
                    res.push(index_prefix + '|' + pixel_field_value);;
                } else {
                    this.get_normalized_vardata_pixels(
                        vardata,
                        res,
                        pixellised_fields_by_id,
                        Array.from(fields_to_handle),
                        index_prefix + '|' + pixel_field_value,
                    );
                }

            }
        }
    }

    public static get_var_id_from_normalized_vardata(index: string): number {

        if (!index) {
            return null;
        }

        let pieces: string[] = [];

        try {
            pieces = index.split('|');
        } catch (error) {
            console.error('get_var_id_from_normalized_vardata ; index : ' + index);
            console.error(error);
        }

        return MatroidIndexHandler.base_76_txt_to_base_10_num(pieces[0]);
    }

    public static from_normalized_vardata(index: string): VarDataBaseVO {

        if (!index) {
            return null;
        }

        const var_id: number = this.get_var_id_from_normalized_vardata(index);
        const var_conf = VarsController.var_conf_by_id[var_id];

        if (!var_conf) {
            return null;
        }

        let pieces: string[] = [];

        try {
            pieces = index.split('|');
        } catch (error) {
            console.error('from_normalized_vardata ; index : ' + index);
            console.error(error);
        }

        const res: VarDataBaseVO = new ModuleTableController.vo_constructor_by_vo_type[var_conf.var_data_vo_type]() as VarDataBaseVO;

        res.var_id = var_id;
        const fields = MatroidController.getMatroidFields(var_conf.var_data_vo_type);

        const matroid_segmentations = VarDataBaseVO.get_varconf_segmentations(var_conf);

        let i = 0;
        while (i < fields.length) {
            const field = fields[i];
            res[field.field_id] = this.from_normalized_ranges(pieces[i + 1], RangeHandler.getRangeType(field), true, matroid_segmentations, field.field_id);
            i++;
        }
        return res;
    }

    public static normalize_vardata_fields(vardata: VarDataBaseVO) {
        if (!vardata) {
            return null;
        }

        const var_conf = VarsController.var_conf_by_id[vardata.var_id];
        const field_segmentations: { [field_id: string]: number } = VarDataBaseVO.get_varconf_segmentations(var_conf);
        VarDataBaseVO.adapt_param_to_varconf_segmentations(vardata, field_segmentations);
    }
}