import TSRange from "../../../../../shared/modules/DataRender/vos/TSRange";
import TimeSegment from "../../../../../shared/modules/DataRender/vos/TimeSegment";
import Dates from "../../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import ISupervisedItemClientController from "../../../../../shared/modules/Supervision/interfaces/ISupervisedItemClientController";
import ISupervisedItemGraphSegmentation from "../../../../../shared/modules/Supervision/interfaces/ISupervisedItemGraphSegmentation";
import SupervisedCRONVO from "../../../../../shared/modules/Supervision/vos/SupervisedCRONVO";
import RangeHandler from "../../../../../shared/tools/RangeHandler";

export default class SupervisedCRONClientController implements ISupervisedItemClientController<SupervisedCRONVO> {

    public static getInstance(): SupervisedCRONClientController {
        if (!SupervisedCRONClientController.instance) {
            SupervisedCRONClientController.instance = new SupervisedCRONClientController();
        }

        return SupervisedCRONClientController.instance;
    }

    private static instance: SupervisedCRONClientController = null;

    private constructor() { }

    public get_graph_segmentation(supervised_item: SupervisedCRONVO): ISupervisedItemGraphSegmentation[] {

        return [{
            segmentation_name: '1 mois',
            range: RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.add(Dates.now(), -1, TimeSegment.TYPE_MONTH), Dates.now(), true, true, TimeSegment.TYPE_DAY)
        }, {
            segmentation_name: '6 mois',
            range: RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.add(Dates.now(), - 6, TimeSegment.TYPE_MONTH), Dates.now(), true, true, TimeSegment.TYPE_DAY)
        }, {
            segmentation_name: '24 mois',
            range: RangeHandler.createNew(TSRange.RANGE_TYPE, Dates.add(Dates.now(), -24, TimeSegment.TYPE_MONTH), Dates.now(), true, true, TimeSegment.TYPE_DAY)
        }];
    }

    public get_graph_filter(supervised_item: SupervisedCRONVO): string {
        return null;
    }

    public get_graph_filter_additional_params(supervised_item: SupervisedCRONVO): any {
        return null;
    }

    public get_graph_options(supervised_item: SupervisedCRONVO): string {
        return null;
    }

    public get_graph_date_format(supervised_item: SupervisedCRONVO): string {
        return 'DD/MM/YYYY';
    }

    public get_graph_label_translatable_code(supervised_item: SupervisedCRONVO): string {
        return 'sup_cron_graph_data_label';
    }
}