import IExportableSheet from './IExportableSheet';

export default interface IExportableMultiSheetsDatas {
    filename: string;
    sheets: IExportableSheet[];
    api_type_id: string;
}