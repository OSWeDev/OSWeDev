
export default class SendInBlueContactVO {

    public static createNew(
        email: string,
        sms: string = null,
        lastname: string = null,
        firstname: string = null,
    ): SendInBlueContactVO {
        let res: SendInBlueContactVO = new SendInBlueContactVO();

        res.email = email;
        res.lastname = lastname;
        res.firstname = firstname;
        res.sms = sms;

        return res;
    }

    public email: string;
    public lastname: string;
    public firstname: string;
    public sms: string;
}