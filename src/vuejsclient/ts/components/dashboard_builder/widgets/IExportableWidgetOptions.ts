export default interface IExportableWidgetOptions {
    /**
     * Renvoie une map des codes de la solution actuelle à exporter et du code exportable
     */
    get_all_exportable_name_code_and_translation(page_id: number, page_widget_id: number): Promise<{ [current_code_text: string]: string }>;
}