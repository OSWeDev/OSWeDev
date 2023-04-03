import IDistantVOBase from "./IDistantVOBase";

export default interface IArchivedVOBase extends IDistantVOBase {
    id: number;
    _type: string;
    archived: boolean;
}