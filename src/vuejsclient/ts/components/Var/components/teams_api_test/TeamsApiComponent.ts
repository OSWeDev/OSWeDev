import { debounce } from 'lodash';
import { Pie } from 'vue-chartjs';
import Chart from "chart.js/auto";
import * as helpers from "chart.js/helpers";
import { Component, Prop, Watch } from 'vue-property-decorator';
import VarPieDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarPieDataSetDescriptor';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import VarDatasRefsParamSelectComponent from '../datasrefs/paramselect/VarDatasRefsParamSelectComponent';
import VarPieChartWidgetOptions from '../../../dashboard_builder/widgets/var_pie_chart_widget/options/VarPieChartWidgetOptions';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import TeamsAPIServerController from '../../../../../../server/modules/TeamsAPI/TeamsAPIServerController';
@Component({
    template: require('./TeamsApiComponent.pug')
})
export default class TeamsApiComponent extends VueComponentBase {
    @ModuleVarGetter
    public isDescMode: boolean;

    // private send_message() {
    //     TeamsAPIServerController.send_dev_teams_error(
    //         'Echec de création de carte Trello',
    //         'Impossible de créer la carte Trello pour le feedback ' + Math.round(Math.random() * 10) + ' : TITLE');
    // }
}