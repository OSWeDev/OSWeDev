
export default class SendInBlueSmsFormatVO {

    public static DEFAULT_CODE_PAYS: string = '+33';

    public static createNew(tel: string, code_pays: string = SendInBlueSmsFormatVO.DEFAULT_CODE_PAYS): SendInBlueSmsFormatVO {
        let res: SendInBlueSmsFormatVO = new SendInBlueSmsFormatVO();

        res.tel = tel;
        res.code_pays = code_pays;

        return res;
    }

    public static formate(tel: string, code_pays: string = SendInBlueSmsFormatVO.DEFAULT_CODE_PAYS): string {
        if (tel && code_pays) {
            let new_tel: string = tel;
            new_tel = new_tel.replace(/ /g, '');
            if (tel[0] == '0') {
                new_tel = new_tel.substr(1);
            }

            return code_pays + new_tel;
        }

        return null;
    }

    public tel: string;
    public code_pays: string;
}