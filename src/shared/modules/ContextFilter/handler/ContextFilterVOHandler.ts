import ContextFilterVO from '../vos/ContextFilterVO';

/**
 * ContextFilterVOHandler
 */
export class ContextFilterVOHandler {

    /**
     * Is Conditional Context Filter
     *
     * @param {ContextFilterVO} context_filter
     * @returns {boolean}
     */
    public static is_conditional_context_filter(context_filter: ContextFilterVO): boolean {
        const conditional_types = [
            ContextFilterVO.TYPE_FILTER_AND,
            ContextFilterVO.TYPE_FILTER_OR,
            ContextFilterVO.TYPE_FILTER_XOR,
        ];

        return conditional_types.find((t: number) => t == context_filter?.filter_type) != null;
    }



    public static getInstance(): ContextFilterVOHandler {
        if (!ContextFilterVOHandler.instance) {
            ContextFilterVOHandler.instance = new ContextFilterVOHandler();
        }
        return ContextFilterVOHandler.instance;
    }

    private static instance: ContextFilterVOHandler = null;

    private constructor() { }
}
