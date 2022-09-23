import VarsController from '../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarPixelFieldConfVO from '../../../shared/modules/Var/vos/VarPixelFieldConfVO';
import RangeHandler from '../../../shared/tools/RangeHandler';

export default class PixelVarDataController {

    public static getInstance(): PixelVarDataController {
        if (!PixelVarDataController.instance) {
            PixelVarDataController.instance = new PixelVarDataController();
        }
        return PixelVarDataController.instance;
    }

    private static instance: PixelVarDataController = null;

    protected constructor() {
    }

    /**
     * Renvoie le nombre de pixels concernés par ce param. 1 => indique que le param est un pixel
     * @param var_data le vardata à tester
     */
    public get_pixel_card(var_data: VarDataBaseVO): number {

        let varconf = VarsController.getInstance().var_conf_by_id[var_data.var_id];
        let prod_cardinaux = 1;
        let pixellised_fields_by_id: { [param_field_id: string]: VarPixelFieldConfVO } = {};
        for (let i in varconf.pixel_fields) {
            let pixel_field = varconf.pixel_fields[i];

            pixellised_fields_by_id[pixel_field.pixel_param_field_id] = pixel_field;
            let card = RangeHandler.getInstance().getCardinalFromArray(var_data[pixel_field.pixel_param_field_id]);
            prod_cardinaux *= card;
        }

        return prod_cardinaux;
    }
}