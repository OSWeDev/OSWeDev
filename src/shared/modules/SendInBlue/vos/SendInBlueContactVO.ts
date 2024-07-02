import SendInBlueSmsFormatVO from "./SendInBlueSmsFormatVO";

export default class SendInBlueContactVO {

    public static createNew(
        email: string,
        sms: string = null,
        lastname: string = null,
        firstname: string = null,
    ): SendInBlueContactVO {
        const res: SendInBlueContactVO = new SendInBlueContactVO();

        res.email = email;
        res.lastname = lastname;
        res.firstname = firstname;
        res.sms = SendInBlueSmsFormatVO.formate(sms);

        return res;
    }

    public email: string;
    public lastname: string;
    public firstname: string;
    public sms: string;
}