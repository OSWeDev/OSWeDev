
export default class FactuProCategoryVO {
    public static API_TYPE_ID: string = "fp_category";

    // L'id est fourni par l'API
    public id: number;
    public _type: string = FactuProCategoryVO.API_TYPE_ID;

    //Type
    public status: number;
    //Nom
    public title: string;
}