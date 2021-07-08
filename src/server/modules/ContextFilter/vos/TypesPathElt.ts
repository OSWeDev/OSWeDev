export default class TypesPathElt {
    public constructor(
        public from_api_type_id: string,
        public from_field_id: string,

        public to_api_type_id: string,
        public to_field_id: string,

        public from_path_index: number,
        public to_path_index: number,

        public next_path_elt: TypesPathElt = null,
    ) { }
}