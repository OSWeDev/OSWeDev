export default interface ICRUDComponentField {
    $data: any;
    on_reload_field_value: () => Promise<void>;
}