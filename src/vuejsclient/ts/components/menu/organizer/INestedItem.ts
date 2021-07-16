export default interface INestedItem {
    id: number;
    text: string;
    db_weight: number;
    db_parent_id?: number;
    new_weight?: number;
    new_parent_id?: number;
    children?: INestedItem[];
}