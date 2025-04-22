export default class SonicWallAPINatPoliciesIPInfo {
    public uuid: string;
    public name: string;
    public inbound: string;
    public outbound: string;
    public source: NATValue;
    public translated_source: NATValue;
    public destination: NATValue;
    public translated_destination: NATValue;
    public service: NATValue;
    public translated_service: NATValue;
    public enable: boolean;
    public priority: Priority;
    public comment: string;
    public dns_doctoring: boolean;
    public ticket: Ticket;
    public source_port_remap: boolean;
}

export interface NATValue {
    name: string;
    group: string;
    any: boolean;
    original: boolean;
}

export interface Priority {
    auto: boolean;
    manual: number;
}

export interface Ticket {
    tag1: string;
    tag2: string;
    tag3: string;
}