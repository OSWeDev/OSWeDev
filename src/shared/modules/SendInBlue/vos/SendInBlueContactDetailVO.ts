
export default class SendInBlueContactDetailVO {
    public id: number;
    public email: string;
    public emailBlacklisted: boolean;
    public smsBlacklisted: boolean;
    public createdAt: string;
    public modifiedAt: string;
    public listIds: number[];
    public listUnsubscribed: number[];
    public attributes: { [ATTRIBUTE_NAME: string]: string };
}