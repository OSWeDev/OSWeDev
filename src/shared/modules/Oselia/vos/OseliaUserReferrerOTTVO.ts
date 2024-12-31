import { randomBytes } from 'crypto';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

/**
 * One Time Token pour valider l'accès d'un user à Osélia via un referrer
 */
export default class OseliaUserReferrerOTTVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_user_referrer_ott";

    public id: number;
    public _type: string = OseliaUserReferrerOTTVO.API_TYPE_ID;

    public user_referrer_id: number;

    public ott: string;

    public expires: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;

    public static async generateSecretToken(length: number): Promise<string> {

        return new Promise((resolve, reject) => {

            randomBytes(length, (err, buffer) => {

                if (err) {
                    return reject(err);
                }

                return resolve(buffer.toString('hex'));
            });
        });
    }
}