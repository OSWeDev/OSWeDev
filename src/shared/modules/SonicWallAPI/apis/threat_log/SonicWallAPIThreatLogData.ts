export default class SonicWallAPIThreatLogData {
    public threatlogDbEntriesPerFile: number;
    public threatlogDbFiles: SonicWallAPIThreatLogDataInfo;
}

export interface SonicWallAPIThreatLogDataInfo {
    fname: string;
    startTime: number;
    endTime: number;
    count: number;
}