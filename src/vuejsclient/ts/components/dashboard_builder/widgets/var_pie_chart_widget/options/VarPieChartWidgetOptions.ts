import VarPieChartWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO';
import IExportableWidgetOptions from "../../IExportableWidgetOptions";

/**
 * On va gérer 2 types de paramétrages :
 *  - soit 1 var et une dimension :
 *      - exemple var_id 15 et sur cette var on a un ts_ranges, on le propose en dimension et on doit choisir le segment_type (dont la segmentation minimale
 *          est le segment_type du ts_ranges)
 *  - Soit 2 vars sans dimension :
 *      - exemple on veut un donut à 50% de circonférence et on compare la part de la var 1 dans le max == var 2 (ou max = var 1 + var 2)
 */
export default class VarPieChartWidgetOptions extends VarPieChartWidgetOptionsVO implements IExportableWidgetOptions {

}