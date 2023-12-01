
export default class NumRangeEnumHandler {

    public constructor(
        public label_handler: (value: number) => Promise<string>,
        public sync_label_handler: (e: any) => string,
        public enum_initial_options_handler: () => Promise<any[]>,
        public enum_query_options_handler: (query: string) => Promise<any[]>) { }
}