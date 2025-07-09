import * as d3 from 'd3';
import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
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
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import './PerfReportGraphWidgetComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';

@Component({
    template: require('./PerfReportGraphWidgetComponent.pug'),
    components: {},
})
export default class PerfReportGraphWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private selected_perf_report: EventifyPerfReportVO = null;

    // On crée juste une petite marge pour la zone brush
    private brushHeight: number = 50;

    private filter_text: string = '';

    private throttle_select_perf_report = ThrottleHelper.declare_throttle_without_args(
        'PerfReportGraphWidgetComponent.throttle_select_perf_report',
        this.select_perf_report.bind(this), 200);

    private throttle_redraw = ThrottleHelper.declare_throttle_without_args(
        'PerfReportGraphWidgetComponent.throttle_redraw',
        this.redraw.bind(this), 200);


    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet(reflect<this>().get_active_field_filters);
    }

    get get_dashboard_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet(reflect<this>().get_dashboard_discarded_field_paths);
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_dashboard_api_type_ids);
    }

    get get_active_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_active_api_type_ids);
    }

    get get_query_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_query_api_type_ids);
    }



    @Watch('filter_text')
    private on_filter_text_change() {
        this.throttle_redraw();
    }

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

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    private async select_perf_report() {
        // On build la query pour select le perf report
        const context_query_select: ContextQueryVO = query(EventifyPerfReportVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_dashboard_discarded_field_paths);
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

        /* ---------- data ---------- */
        const perfs_raw = [];
        for (const name in this.selected_perf_report.perf_datas) {
            const p = this.selected_perf_report.perf_datas[name];
            perfs_raw.push({
                perf_name: name,
                label: p.line_name,
                description: p.description,
                calls: p.calls,
                cooldowns: p.cooldowns,
                events: p.events
            });
        }

        const filter = this.filter_text.trim().toLowerCase();
        const perfs = filter
            ? perfs_raw.filter(p => {
                const inHeader =
                    (p.label && p.label.toLowerCase().includes(filter)) ||
                    (p.description && p.description.toLowerCase().includes(filter));
                const inCalls = p.calls?.some(c => c.description?.toLowerCase().includes(filter));
                const inCooldowns = p.cooldowns?.some(c => c.description?.toLowerCase().includes(filter));
                const inEvents = p.events?.some(e => e.description?.toLowerCase().includes(filter));
                return inHeader || inCalls || inCooldowns || inEvents;
            })
            : perfs_raw;

        if (!perfs.length) return;

        const listeners_names = perfs.map(p => p.perf_name);

        // Domaine total pour le brush
        const fullStart = this.selected_perf_report.start_date_perf_ms;
        const fullEnd = this.selected_perf_report.end_date_perf_ms;

        // Dimensions
        const width = 800;
        const height = perfs.length * 50;
        const margin = { top: 20, right: 20, bottom: 30, left: 250 };

        // CHANGEMENT : SVG avec fond blanc
        const container = d3
            .select(this.$refs.d3_perf_report_graph_widget_graph)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom + this.brushHeight + 30)
            .style("background", "#fff"); // <-- fond blanc

        const svg = container
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Échelle X (zoomable)
        const xScale = d3
            .scaleLinear()
            .domain([fullStart, fullEnd])
            .range([0, width]);

        // Échelle Y (on utilise perf_name comme identifiant)
        const yScale = d3
            .scaleBand()
            .domain(listeners_names)
            .range([0, height])
            .padding(0.5);

        // Axe X principal
        const xAxis = d3
            .axisBottom(xScale)
            .tickFormat((d: number) =>
                Dates.format_segment(Math.floor(d / 1000), TimeSegment.TYPE_SECOND) + "." + (Math.floor(d) % 1000)
            )
            .ticks(6);

        const xAxisGroup = svg
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        // CHANGEMENT : Pivot des labels pour lisibilité
        xAxisGroup
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.0em");

        // AJOUT : on crée l’axe Y et on applique un troncage + déroulement au survol
        const yAxis = d3.axisLeft(yScale);
        const yAxisGroup = svg.append("g").call(yAxis);

        // CHANGEMENT : gestion du label trop long + animation au survol
        const MAX_LABEL_LENGTH = 18; // nombre de caractères avant …
        yAxisGroup.selectAll(".tick text")
            .each(function (d: string) {
                const fullText = d; // la valeur d
                const truncated = (fullText.length > MAX_LABEL_LENGTH)
                    ? fullText.slice(0, MAX_LABEL_LENGTH) + "…"
                    : fullText;

                // On stocke texte original et tronqué en data-* pour y accéder au survol
                d3.select(this)
                    .attr("data-full-text", fullText)
                    .attr("data-truncated", truncated)
                    .text(truncated)
                    .attr("fill", "#333") // couleur de texte
                    .style("cursor", "pointer")
                    .on("mouseover", function () {
                        const textSel = d3.select(this);
                        const original = textSel.attr("data-full-text")!;
                        const short = textSel.attr("data-truncated")!;
                        // On remplace le texte par la version longue
                        textSel.text(original);
                        // On calcule la largeur
                        const textWidth = (textSel.node() as SVGTextElement).getComputedTextLength();
                        // Si la largeur dépasse 250, on décale
                        const shift = Math.max(0, textWidth - 1.0 * margin.left);

                        // Animation pour le déroulement
                        textSel
                            .attr("x", 0) // on part de 0
                            .transition()
                            .duration(2000)
                            .ease(d3.easeLinear)
                            .attr("x", -shift); // on décale le texte vers la gauche
                    })
                    .on("mouseout", function () {
                        const textSel = d3.select(this);
                        const short = textSel.attr("data-truncated")!;
                        textSel.interrupt();     // stop l'animation en cours
                        textSel.attr("x", 0);    // on remet le texte à x=0
                        textSel.text(short);     // on repasse en texte tronqué
                    });
            });

        // Conteneur du contenu (rectangles, cercles...)
        const content = svg.append("g");
        const matches = (txt?: string) => txt && filter ? txt.toLowerCase().includes(filter) : false;
        const colorize = (highlight: boolean, base: string) => highlight ? base : '#D3D3D3';
        const opa = (highlight: boolean) => highlight ? 1 : 0.3;

        // Séparateurs horizontaux
        content
            .selectAll(".separator")
            .data(perfs)
            .enter()
            .append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", (d) => yScale(d.perf_name)! + yScale.bandwidth())
            .attr("y2", (d) => yScale(d.perf_name)! + yScale.bandwidth())
            .attr("stroke", "#ccc");

        // Tooltip
        const tooltip = d3.select("#tooltip");

        // Fonction de (re)dessin des éléments (rectangles/cercles)
        const drawShapes = () => {

            // Rectangles "calls"
            perfs.forEach((d) => {
                d.calls.forEach((call: { start: number, end: number, description?: string }) => {
                    const domainStart = xScale.domain()[0];
                    const domainEnd = xScale.domain()[1];
                    const start = Math.max(call.start, domainStart);
                    const end = Math.min(call.end, domainEnd);
                    if (end <= domainStart || start >= domainEnd) return;

                    const highlight =
                        !filter ||
                        matches(call.description) ||
                        matches(d.label) ||
                        matches(d.description);

                    const start_date_formattee =
                        Dates.format_segment(Math.floor(call.start / 1000), TimeSegment.TYPE_SECOND) + "." + (call.start % 1000);
                    const end_date_formattee =
                        Dates.format_segment(Math.floor(call.end / 1000), TimeSegment.TYPE_SECOND) + "." + (call.end % 1000);

                    content
                        .append("rect")
                        .attr("x", xScale(start))
                        .attr("y", yScale(d.perf_name)!)
                        .attr("width", xScale(end) - xScale(start))
                        .attr("height", yScale.bandwidth() / 2)

                        .attr('fill', colorize(highlight, '#FF6F6F'))
                        .attr('stroke', colorize(highlight, '#FF6F6F'))
                        .attr('opacity', opa(highlight))

                        .on("click", async (event) => {
                            await navigator.clipboard.writeText(
                                '<b>' + d.label + '</b><br>' +
                                (d.description ? d.description + '<br>' : '') +
                                '<hr>' +
                                'Start: ' + start_date_formattee + '<br>' +
                                'End: ' + end_date_formattee +
                                (call.description ? '<br>' + call.description : '')
                            );
                            ConsoleHandler.debug(
                                '<b>' + d.label + '</b><br>' +
                                (d.description ? d.description + '<br>' : '') +
                                '<hr>' +
                                'Start: ' + start_date_formattee + '<br>' +
                                'End: ' + end_date_formattee +
                                (call.description ? '<br>' + call.description : '')
                            );
                        })
                        .on("mouseover", (event) => {
                            tooltip
                                .style("visibility", "visible")
                                .html(
                                    '<b>' + d.label + '</b><br>' +
                                    (d.description ? d.description + '<br>' : '') +
                                    '<hr>' +
                                    'Start: ' + start_date_formattee + '<br>' +
                                    'End: ' + end_date_formattee +
                                    (call.description ? '<br>' + call.description : '')
                                )
                                .style("left", (event.pageX + 10 - 270) + "px")
                                .style("top", (event.pageY - 10 - 200) + "px");
                        })
                        .on("mousemove", (event) => {
                            tooltip
                                .style("left", (event.pageX + 10 - 270) + "px")
                                .style("top", (event.pageY - 10 - 200) + "px");
                        })
                        .on("mouseout", () => {
                            tooltip.style("visibility", "hidden");
                        });
                });
            });

            // Rectangles "cooldowns"
            perfs.forEach((d) => {
                d.cooldowns.forEach((cooldown: { start: number, end: number, description?: string }) => {
                    const domainStart = xScale.domain()[0];
                    const domainEnd = xScale.domain()[1];
                    const start = Math.max(cooldown.start, domainStart);
                    const end = Math.min(cooldown.end, domainEnd);
                    if (end <= domainStart || start >= domainEnd) return;

                    const highlight =
                        !filter ||
                        matches(cooldown.description) ||
                        matches(d.label) ||
                        matches(d.description);

                    const start_date_formattee =
                        Dates.format_segment(Math.floor(cooldown.start / 1000), TimeSegment.TYPE_SECOND) + "." + (cooldown.start % 1000);
                    const end_date_formattee =
                        Dates.format_segment(Math.floor(cooldown.end / 1000), TimeSegment.TYPE_SECOND) + "." + (cooldown.end % 1000);

                    content
                        .append("rect")
                        .attr("x", xScale(start))
                        .attr("y", yScale(d.perf_name)! + yScale.bandwidth() / 2)
                        .attr("width", xScale(end) - xScale(start))
                        .attr("height", yScale.bandwidth() / 2)

                        .attr('fill', colorize(highlight, '#6ECF68'))
                        .attr('stroke', colorize(highlight, '#6ECF68'))
                        .attr('opacity', opa(highlight))

                        .on("click", async (event) => {
                            await navigator.clipboard.writeText(
                                '<b>' + d.label + '</b><br>' +
                                (d.description ? d.description + '<br>' : '') +
                                '<hr>' +
                                'Start: ' + start_date_formattee + '<br>' +
                                'End: ' + end_date_formattee +
                                (cooldown.description ? '<br>' + cooldown.description : '')
                            );
                            ConsoleHandler.debug(
                                '<b>' + d.label + '</b><br>' +
                                (d.description ? d.description + '<br>' : '') +
                                '<hr>' +
                                'Start: ' + start_date_formattee + '<br>' +
                                'End: ' + end_date_formattee +
                                (cooldown.description ? '<br>' + cooldown.description : '')
                            );
                        })
                        .on("mouseover", (event) => {
                            tooltip
                                .style("visibility", "visible")
                                .html(
                                    '<b>' + d.label + '</b><br>' +
                                    (d.description ? d.description + '<br>' : '') +
                                    '<hr>' +
                                    'Start: ' + start_date_formattee + '<br>' +
                                    'End: ' + end_date_formattee +
                                    (cooldown.description ? '<br>' + cooldown.description : '')
                                )
                                .style("left", (event.pageX + 10 - 270) + "px")
                                .style("top", (event.pageY - 10 - 200) + "px");
                        })
                        .on("mousemove", (event) => {
                            tooltip
                                .style("left", (event.pageX + 10 - 270) + "px")
                                .style("top", (event.pageY - 10 - 200) + "px");
                        })
                        .on("mouseout", () => {
                            tooltip.style("visibility", "hidden");
                        });
                });
            });

            // Cercles "events"
            perfs.forEach((d) => {
                d.events.forEach((evt: { ts: number, description?: string }) => {
                    const domainStart = xScale.domain()[0];
                    const domainEnd = xScale.domain()[1];
                    if (evt.ts <= domainStart || evt.ts >= domainEnd) return;

                    const date_formattee =
                        Dates.format_segment(Math.floor(evt.ts / 1000), TimeSegment.TYPE_SECOND) + "." + (evt.ts % 1000);

                    const highlight =
                        !filter ||
                        matches(evt.description) ||
                        matches(d.label) ||
                        matches(d.description);

                    content
                        .append("circle")
                        .attr("cx", xScale(evt.ts))
                        .attr("cy", yScale(d.perf_name)! + yScale.bandwidth() / 4)
                        .attr("r", 4)

                        .attr('fill', colorize(highlight, 'orange'))
                        .attr('opacity', opa(highlight))

                        .on("click", async (event) => {
                            await navigator.clipboard.writeText(
                                '<b>' + d.label + '</b><br>' +
                                (d.description ? d.description + '<br>' : '') +
                                '<hr>' +
                                'Date: ' + date_formattee +
                                (evt.description ? '<br>' + evt.description : '')
                            );
                            ConsoleHandler.debug(
                                '<b>' + d.label + '</b><br>' +
                                (d.description ? d.description + '<br>' : '') +
                                '<hr>' +
                                'Date: ' + date_formattee +
                                (evt.description ? '<br>' + evt.description : '')
                            );
                        })
                        .on("mouseover", (event) => {
                            tooltip
                                .style("visibility", "visible")
                                .html(
                                    '<b>' + d.label + '</b><br>' +
                                    (d.description ? d.description + '<br>' : '') +
                                    '<hr>' +
                                    'Date: ' + date_formattee +
                                    (evt.description ? '<br>' + evt.description : '')
                                )
                                .style("left", (event.pageX + 10 - 270) + "px")
                                .style("top", (event.pageY - 10 - 200) + "px");
                        })
                        .on("mousemove", (event) => {
                            tooltip
                                .style("left", (event.pageX + 10 - 270) + "px")
                                .style("top", (event.pageY - 10 - 200) + "px");
                        })
                        .on("mouseout", () => {
                            tooltip.style("visibility", "hidden");
                        });
                });
            });
        };

        // Premier dessin
        drawShapes();

        // BRUSH (slider) en bas
        const brushGroup = container
            .append("g")
            .attr("class", "brush")
            .attr("transform", `translate(${margin.left},${height + margin.top + 20})`);

        const xScaleBrush = d3
            .scaleLinear()
            .domain([fullStart, fullEnd])
            .range([0, width]);

        const xAxisBrush = d3
            .axisBottom(xScaleBrush)
            .tickFormat((d: number) =>
                Dates.format_segment(Math.floor(d / 1000), TimeSegment.TYPE_SECOND) + "." + (Math.floor(d) % 1000)
            )
            .ticks(6);

        const xAxisBrushGroup = brushGroup
            .append("g")
            .attr("transform", `translate(0,${this.brushHeight})`)
            .call(xAxisBrush);

        // Labels inclinés aussi pour le brush
        xAxisBrushGroup
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.0em");

        const brush = d3
            .brushX()
            .extent([[0, 0], [width, this.brushHeight]])
            .on("brush end", brushed);

        brushGroup.call(brush);

        function brushed(event: any) {
            if (!event.selection) {
                // Pas de sélection => vue complète
                xScale.domain([fullStart, fullEnd]);
            } else {
                const [x0, x1] = event.selection;
                xScale.domain([xScaleBrush.invert(x0), xScaleBrush.invert(x1)]);
            }
            // Mise à jour axe X
            svg.select(".x-axis").call(xAxis);

            // Re-rotation des labels
            svg
                .select(".x-axis")
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end")
                .attr("dx", "-0.5em")
                .attr("dy", "0.0em");

            // On efface et on redessine le contenu
            content.selectAll("*").remove();
            drawShapes();
        }
    }


}