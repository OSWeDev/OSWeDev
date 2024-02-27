import ParameterizedQueryWrapperField from "./ParameterizedQueryWrapperField";
import ModuleTableVO from "../../ModuleTableVO";

export default class ParameterizedQueryWrapper {

    /**
     * PAramètre utilisé pour indiquer que la requête est une requête segmentée sur une table qui n'existe pas
     */
    public is_segmented_non_existing_table: boolean = false;

    /**
     * On prend arbitrairement la première table comme FROM,
     * on join vers elle par la suite.
     */
    public joined_tables_by_vo_type: { [vo_type: string]: ModuleTableVO } = {};

    public cross_joins: string[] = [];

    public jointures: string[] = [];

    /**
     * Union queries can be used to make a query on multiple tables at once (with a union)
     * - Filter the union query result with WHERE, GROUP BY, HAVING, ORDER BY, LIMIT and OFFSET clauses
     */
    public union_queries: ParameterizedQueryWrapper[] = null;

    public constructor(
        public query: string,
        public params: any[],
        public fields: ParameterizedQueryWrapperField[],
        public tables_aliases_by_type: { [vo_type: string]: string } = {},
    ) { }

    public set_query(query: string): ParameterizedQueryWrapper {
        this.query = query;

        return this;
    }

    /**
     * Add a union query in the union_queries collection
     *
     * @param {ParameterizedQueryWrapper} union_query
     * @returns {ParameterizedQueryWrapper[]}
     */
    public add_union_query(union_query: ParameterizedQueryWrapper): ParameterizedQueryWrapper {
        if (!(this.union_queries?.length > 0)) {
            this.union_queries = [];
        }

        this.union_queries.push(union_query);

        return this;
    }

    public mark_as_is_segmented_non_existing_table(): ParameterizedQueryWrapper {
        this.is_segmented_non_existing_table = true;

        return this;
    }
}