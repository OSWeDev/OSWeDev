export default class ValidationFiltersCallUpdaters {
    public constructor(
        public dashboard_id: number,
        public page_id: number,
        public page_widget_id: number, // To know/specify which widget call the updaters actually
    ) { }
}