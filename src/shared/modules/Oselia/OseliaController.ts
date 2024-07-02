import { query } from '../ContextFilter/vos/ContextQueryVO';
import OseliaChatVO from './vos/OseliaChatVO';

export default class OseliaController {

    public static async get_referrer_id(url: string): Promise<number> {
        const vos: OseliaChatVO[] = await query(OseliaChatVO.API_TYPE_ID).select_vos<OseliaChatVO>()
        for (const i in vos) {
            const chat_instance: OseliaChatVO = vos[i];
            if (new RegExp(chat_instance.regex).test(url)) {
                return chat_instance.referrer_id;
            }
        }
        return null;
    }
}