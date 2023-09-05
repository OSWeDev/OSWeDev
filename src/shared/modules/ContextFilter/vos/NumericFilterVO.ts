import ContextFilterVO from "./ContextFilterVO";

/**
 * NumericFilterVO
 */
export default class NumericFilterVO {

    public static LOGIC_GATE_TYPE_LABEL = {
        NOT: 'context_filter.type.FILTER_NOT',
        AND: 'context_filter.type.FILTER_AND',
        OR: 'context_filter.type.FILTER_OR',
        XOR: 'context_filter.type.FILTER_XOR',
    };

    public static LOGIC_GATE_TYPE_VALUE = {
        NOT: 0,
        AND: 1,
        OR: 2,
        XOR: 3,
    };

    public static CONDITION_TYPE_LABEL = {
        INF_ALL: 'context_filter.type.NUMERIC_INF_ALL',
        INFEQ_ALL: 'context_filter.type.NUMERIC_INFEQ_ALL',
        SUP_ALL: 'context_filter.type.NUMERIC_SUP_ALL',
        SUPEQ_ALL: 'context_filter.type.NUMERIC_SUPEQ_ALL',
        NULL_ALL: 'context_filter.type.NULL_ALL',
        NULL_NONE: 'context_filter.type.NULL_NONE',
        EQUALS_ALL: 'context_filter.type.NUMERIC_EQUALS',
        NOT_EQUALS: 'context_filter.type.NUMERIC_NOT_EQUALS',
    };

    public static CONDITION_TYPE_VALUE = {
        INF_ALL: ContextFilterVO.TYPE_NUMERIC_INF_ALL,
        INFEQ_ALL: ContextFilterVO.TYPE_NUMERIC_INFEQ_ALL,
        SUP_ALL: ContextFilterVO.TYPE_NUMERIC_SUP_ALL,
        SUPEQ_ALL: ContextFilterVO.TYPE_NUMERIC_SUPEQ_ALL,
        NULL_ALL: ContextFilterVO.TYPE_NULL_ALL,
        NULL_NONE: ContextFilterVO.TYPE_NULL_NONE,
        EQUALS_ALL: ContextFilterVO.TYPE_NUMERIC_EQUALS_ALL,
        NOT_EQUALS: ContextFilterVO.TYPE_NUMERIC_NOT_EQUALS,
    };

    public param_numeric: number;
    public filter_type: number;

    public constructor() {
        this.filter_type = NumericFilterVO.CONDITION_TYPE_VALUE.INF_ALL;
        this.param_numeric = null;
    }
}