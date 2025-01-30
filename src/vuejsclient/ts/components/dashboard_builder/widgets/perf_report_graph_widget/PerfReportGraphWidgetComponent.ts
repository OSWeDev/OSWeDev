import * as d3 from 'd3';
import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import EventifyPerfReportVO from '../../../../../../shared/modules/Eventify/vos/perfs/EventifyPerfReportVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './PerfReportGraphWidgetComponent.scss';

@Component({
    template: require('./PerfReportGraphWidgetComponent.pug'),
    components: {},
})
export default class PerfReportGraphWidgetComponent extends VueComponentBase {

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;
    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };
    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private selected_perf_report: EventifyPerfReportVO = null;

    private throttle_select_perf_report = ThrottleHelper.declare_throttle_without_args(
        'PerfReportGraphWidgetComponent.throttle_select_perf_report',
        this.select_perf_report.bind(this), 200);

    private throttle_redraw = ThrottleHelper.declare_throttle_without_args(
        'PerfReportGraphWidgetComponent.throttle_redraw',
        this.redraw.bind(this), 200);

    @Watch('selected_perf_report', { deep: true })
    private async on_change_selected_report() {
        if (!this.selected_perf_report) {
            return;
        }

        this.throttle_redraw();
    }

    @Watch('get_active_field_filters', { deep: true })
    @Watch('get_dashboard_api_type_ids', { deep: true })
    @Watch('get_discarded_field_paths', { deep: true, immediate: true })
    private on_change_filters() {
        this.throttle_select_perf_report();
    }

    private async select_perf_report() {
        // On build la query pour select le perf report
        const context_query_select: ContextQueryVO = query(EventifyPerfReportVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_discarded_field_paths);
        context_query_select.query_distinct = true;

        const context_query_count: ContextQueryVO = cloneDeep(context_query_select);

        const nb_vos = await context_query_count.select_count();

        if (nb_vos !== 1) {
            this.selected_perf_report = null;
            return;
        }

        // Si on en a exactement 1, on le prend on le sélectionne
        this.selected_perf_report = await context_query_select.select_vo<EventifyPerfReportVO>();
    }

    private async redraw() {
        if (!this.$refs.d3_perf_report_graph_widget_graph) return;

        d3.select(this.$refs.d3_perf_report_graph_widget_graph).selectAll("*").remove();

        const listeners_names = Object.keys(this.selected_perf_report.perf_datas);
        const perfs = [];
        for (const name in this.selected_perf_report.perf_datas) {
            const perf_data = this.selected_perf_report.perf_datas[name];
            perfs.push({
                name,
                calls: perf_data.calls,
                cooldowns: perf_data.cooldowns,
                events: perf_data.events
            });
        }

        const width = 800;
        const height = perfs.length * 50;
        const margin = { top: 20, right: 20, bottom: 30, left: 250 };

        // Conteneur principal
        const container = d3
            .select(this.$refs.d3_perf_report_graph_widget_graph)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Groupe pour la marge
        const svg = container
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Échelles
        const xScale = d3
            .scaleLinear()
            .domain([this.selected_perf_report.start_date_perf_ms, this.selected_perf_report.end_date_perf_ms])
            .range([0, width]);

        const yScale = d3
            .scaleBand()
            .domain(listeners_names)
            .range([0, height])
            .padding(0.5);

        // Axes
        const xAxis = d3
            .axisBottom(xScale)
            .tickFormat((d: number) =>
                Dates.format_segment(Math.floor(d / 1000), TimeSegment.TYPE_SECOND) + "." + (Math.floor(d) % 1000)
            )
            .ticks((xScale.domain()[1] - xScale.domain()[0]) / 1000);

        svg
            .append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        svg.append("g").call(d3.axisLeft(yScale));

        // Groupe qui contient les éléments
        const content = svg.append("g");

        // Séparateurs
        content
            .selectAll(".separator")
            .data(perfs)
            .enter()
            .append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", (d) => yScale(d.name)! + yScale.bandwidth())
            .attr("y2", (d) => yScale(d.name)! + yScale.bandwidth())
            .attr("stroke", "black");

        // Sélection du tooltip (assurez-vous d'avoir un <div id="tooltip"> dans votre HTML)
        const tooltip = d3.select("#tooltip");

        // Rects "calls"
        perfs.forEach((d) => {
            d.calls.forEach((call) => {
                const start = Math.max(call.start, this.selected_perf_report.start_date_perf_ms);
                const end = Math.min(call.end, this.selected_perf_report.end_date_perf_ms);

                const start_date_formattee =
                    Dates.format_segment(Math.floor(call.start / 1000), TimeSegment.TYPE_SECOND) + "." + (call.start % 1000);
                const end_date_formattee =
                    Dates.format_segment(Math.floor(call.end / 1000), TimeSegment.TYPE_SECOND) + "." + (call.end % 1000);

                content
                    .append("rect")
                    .attr("x", xScale(start))
                    .attr("y", yScale(d.name)!)
                    .attr("width", xScale(end) - xScale(start))
                    .attr("height", yScale.bandwidth() / 2)
                    .attr("fill", "red")
                    .attr("stroke", "red")
                    .on("mouseover", (event) => {
                        tooltip
                            .style("visibility", "visible")
                            .html(
                                `Listener: <b>${d.name}</b><br>
                             Start: ${start_date_formattee}<br>
                             End: ${end_date_formattee}`
                            )
                            .style("left", (event.pageX - container.left + 10) + "px")
                            .style("top", (event.pageY - container.top - 10) + "px");
                    })
                    .on("mousemove", (event) => {
                        tooltip
                            .style("left", (event.pageX - container.left + 10) + "px")
                            .style("top", (event.pageY - container.top - 10) + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.style("visibility", "hidden");
                    });
            });
        });

        // Rects "cooldowns"
        perfs.forEach((d) => {
            d.cooldowns.forEach((cooldown) => {
                const start = Math.max(cooldown.start, this.selected_perf_report.start_date_perf_ms);
                const end = Math.min(cooldown.end, this.selected_perf_report.end_date_perf_ms);

                const start_date_formattee =
                    Dates.format_segment(Math.floor(cooldown.start / 1000), TimeSegment.TYPE_SECOND) + "." + (cooldown.start % 1000);
                const end_date_formattee =
                    Dates.format_segment(Math.floor(cooldown.end / 1000), TimeSegment.TYPE_SECOND) + "." + (cooldown.end % 1000);

                content
                    .append("rect")
                    .attr("x", xScale(start))
                    .attr("y", yScale(d.name)! + yScale.bandwidth() / 2)
                    .attr("width", xScale(end) - xScale(start))
                    .attr("height", yScale.bandwidth() / 2)
                    .attr("fill", "green")
                    .attr("stroke", "green")
                    .on("mouseover", (event) => {
                        tooltip
                            .style("visibility", "visible")
                            .html(
                                `Listener: <b>${d.name}</b><br>
                             Start: ${start_date_formattee}<br>
                             End: ${end_date_formattee}`
                            )
                            .style("left", (event.pageX - container.left + 10) + "px")
                            .style("top", (event.pageY - container.top - 10) + "px");
                    })
                    .on("mousemove", (event) => {
                        tooltip
                            .style("left", (event.pageX - container.left + 10) + "px")
                            .style("top", (event.pageY - container.top - 10) + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.style("visibility", "hidden");
                    });
            });
        });

        // Cercles "events"
        perfs.forEach((d) => {
            d.events.forEach((evt) => {
                // Convertir evt (ms) en date formatée
                const date_formattee =
                    Dates.format_segment(Math.floor(evt / 1000), TimeSegment.TYPE_SECOND) + "." + (evt % 1000);

                content
                    .append("circle")
                    .attr("cx", xScale(evt))
                    .attr("cy", yScale(d.name)! + yScale.bandwidth() / 4)
                    .attr("r", 3)
                    .attr("fill", "black")
                    .on("mouseover", (event) => {
                        tooltip
                            .style("visibility", "visible")
                            .html(
                                `Listener: <b>${d.name}</b><br>
                             Date: ${date_formattee}`
                            )
                            .style("left", (event.pageX - container.left + 10) + "px")
                            .style("top", (event.pageY - container.top - 10) + "px");
                    })
                    .on("mousemove", (event) => {
                        tooltip
                            .style("left", (event.pageX - container.left + 10) + "px")
                            .style("top", (event.pageY - container.top - 10) + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.style("visibility", "hidden");
                    });
            });
        });
    }

}