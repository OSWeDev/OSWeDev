import FileVO from "./FileVO";

export default class FileFilterVO extends FileVO {
    
    public year_file : number;
    public mounth_file : number ;
    public day_file : number;
    public date_file : Date;
    public file_path : string;
    public file_name : string;

    constructor(date_file :Date, file_path :string, file_name :string) {
        super();
        this.date_file =  date_file;
        this.day_file = date_file.getDate();
        this.mounth_file = date_file.getMonth();
        this.year_file = date_file.getFullYear();
        this.file_path = file_path;
        this.file_name = file_name;
    }
}