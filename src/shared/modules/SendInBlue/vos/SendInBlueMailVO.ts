
export default class SendInBlueMailVO {
    public static createNew(
        name: string,
        email: string
    ): SendInBlueMailVO {
        const res: SendInBlueMailVO = new SendInBlueMailVO();

        res.name = name;
        res.email = email;

        return res;
    }

    public name: string;
    public email: string;
}