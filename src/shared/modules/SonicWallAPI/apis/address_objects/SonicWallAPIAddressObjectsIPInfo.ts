export default class SonicWallAPIAddressObjectsIPInfo {
    public name: string;
    public uuid: string;
    public zone: string;
    public host: HostValue;
}

export interface HostValue {
    ip: string;
}