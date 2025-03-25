import TypesHandler from './TypesHandler';

export default class TextHandler {

    public static Challenge_Cars: string[] =
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    public static Password_Cars: string[] =
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            '*', '-', '+', 'ù', '$', '£', '!', '§', ':', '/', ';', '.', ',', '?', '-', '&', 'é', '~', '²', '_', 'è', 'ç', 'à', '@', '=', '}', '{'];

    public static accents_replacements: { [src: string]: string } =
        {
            é: 'e',
            è: 'e',
            ê: 'e',
            à: 'a',
            ò: 'o',
            ô: 'o',
            ù: 'u',
            ì: 'i',
            î: 'i',
            û: 'u',
            ç: 'c',
        };

    public static html_accents_replacements: { [src: string]: string } =
        {
            é: '&eacute;',
            è: '&egrave;',
            ê: '&ecirc;',
            à: '&agrave;',
            ò: '&ograve;',
            ô: '&ocirc;',
            ù: '&ugrave;',
            ì: '&igrave;',
            î: '&icirc;',
            û: '&ucirc;',
            ç: '&ccedil;',
        };

    /** istanbul ignore next: nothing to test here */
    public static getInstance(): TextHandler {
        if (!TextHandler.instance) {
            TextHandler.instance = new TextHandler();
        }
        return TextHandler.instance;
    }

    private static instance: TextHandler = null;

    private constructor() {
    }

    /*
    * retire les accents de la chaine de caracteres src
    */
    public sanityze(src: string): string {

        if (!src) {
            return null;
        }

        let sanitized_res: string = '';
        const length: number = src.length;

        for (let i = 0; i < length; i++) {
            const c = src[i];

            if (TextHandler.accents_replacements[c]) {
                sanitized_res += TextHandler.accents_replacements[c];
                continue;
            }

            sanitized_res += c;
        }

        return sanitized_res;
    }

    /*
     * remplace les accents de la chaine de caracteres src par des codes html
     */
    public encode_accents(src: string): string {

        if (!src) {
            return null;
        }

        let sanitized_res: string = '';
        const length: number = src.length;

        for (let i = 0; i < length; i++) {
            const c = src[i];

            if (TextHandler.html_accents_replacements[c]) {
                sanitized_res += TextHandler.html_accents_replacements[c];
                continue;
            }

            sanitized_res += c;
        }

        return sanitized_res;
    }

    /**
     * On supprime tous les accents récursivement
     * @param object
     */
    public sanityze_object(object: any) {
        for (const field_id in object) {
            const field = object[field_id];

            if (TypesHandler.getInstance().isString(field)) {
                object[field_id] = this.sanityze(field);
                continue;
            }

            if (typeof field === 'object') {
                object[field_id] = this.sanityze_object(object[field_id]);
            }
        }
        return object;
    }

    /**
     * On encode vers un format HTML récursivement
     * @param object
     */
    public encode_object(object: any) {
        for (const field_id in object) {
            const field = object[field_id];

            if (TypesHandler.getInstance().isString(field)) {
                object[field_id] = this.encode_accents(field);
                continue;
            }

            if (typeof field === 'object') {
                object[field_id] = this.encode_object(object[field_id]);
            }
        }
        return object;
    }

    public standardize_for_comparaison(src: string): string {

        if (!src) {
            return null;
        }

        const res: string = src.trim().toLowerCase();
        let standardized_res: string = '';
        const length: number = res.length;

        for (let i = 0; i < length; i++) {
            const c = res[i];

            if (TextHandler.accents_replacements[c]) {
                standardized_res += TextHandler.accents_replacements[c];
                continue;
            }

            if (c.charCodeAt(0) == 160) {
                standardized_res += ' ';
                continue;
            }

            standardized_res += c;
        }

        return standardized_res;
    }

    /**
     * Renvoie un ID en lowercase et caractères spéciaux et espaces remplacés par _
     * @param txt Le texte à convertir
     */
    public formatTextToID(txt: string): string {
        return txt ? txt.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_') : null;
    }

    public formatTextsToID(txts: string[]): string[] {
        const res = [];
        for (const txt of txts) {
            res.push(this.formatTextToID(txt));
        }
        return res;
    }

    public generateChallenge(): string {
        // On génère un code à 8 caractères, chiffres et lettres.
        let res: string = "";
        let i: number = 0;

        while (i < 8) {
            res += TextHandler.Challenge_Cars[Math.floor(Math.random() * TextHandler.Challenge_Cars.length)];
            i++;
        }

        return res;
    }

    public generatePassword(): string {
        // On génère un code à 12 caractères, chiffres, minuscules, majuscules, caractères spéciaux.
        let res: string = "";
        let i: number = 0;

        while (i < 12) {
            res += TextHandler.Password_Cars[Math.floor(Math.random() * TextHandler.Password_Cars.length)];
            i++;
        }

        return res;
    }

    public capitalize(s: string) {
        if (!s) {
            return null;
        }
        if (typeof s !== 'string') {
            return '';
        }
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}