/**
 * BooleanFilterModel
 */
export class BooleanFilterModel {

    public static FILTER_TYPE_LABELS: string[] = [
        'crud.field.boolean.true.___LABEL___',
        'crud.field.boolean.false.___LABEL___',
        'crud.field.boolean.n_a.___LABEL___',
    ];
    public static FILTER_TYPE_TRUE: number = 0;
    public static FILTER_TYPE_FALSE: number = 1;
    public static FILTER_TYPE_VIDE: number = 2;

    public filter_type: number;

    public constructor() {

    }
}