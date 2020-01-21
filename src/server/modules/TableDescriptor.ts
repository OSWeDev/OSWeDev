export default class TableDescriptor {

    public schemaname: string;
    public tablename: string;
    public tableowner: string;
    public tablespace: string;
    public hasindexes: boolean;
    public hasrules: boolean;
    public hastriggers: boolean;
    public rowsecurity: boolean;
}
