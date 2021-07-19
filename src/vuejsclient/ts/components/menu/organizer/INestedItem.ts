export default interface INestedItem {
    id: number;
    text: string;
    target: string;
    weight: number;
    parent_id?: number;
    new_weight?: number;
    new_parent_id?: number;
    children?: INestedItem[];
}