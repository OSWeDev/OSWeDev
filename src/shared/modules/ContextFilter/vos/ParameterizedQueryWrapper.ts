import ParameterizedQueryWrapperField from "./ParameterizedQueryWrapperField";

export default class ParameterizedQueryWrapper {

    /**
     * PAramètre utilisé pour indiquer que la requête est une requête segmentée sur une table qui n'existe pas
     */
    public is_segmented_non_existing_table: boolean = false;

    public constructor(
        public query: string,
        public params: any[],
        public fields: ParameterizedQueryWrapperField[]
    ) { }

    public set_query(query: string): ParameterizedQueryWrapper {
        this.query = query;
        return this;
    }

    public mark_as_is_segmented_non_existing_table(): ParameterizedQueryWrapper {
        this.is_segmented_non_existing_table = true;
        return this;
    }
}