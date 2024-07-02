import ModuleFormatDatesNombres from "../modules/FormatDatesNombres/ModuleFormatDatesNombres";

export default class Humanizer {

    public static humanize_number(value: number, fractionalDigits: number, currency: string): string {

        /**
         * On décide de toujours chercher une précision sur minimum 3 chiffres
         */
        const ALPHABET = 'KMGTPEZY'.split('');
        const TRESHOLD = 1e3;

        let i = -1;

        while (value > TRESHOLD) {
            value = value / TRESHOLD;
            i++;
        }

        return currency + ModuleFormatDatesNombres.getInstance().formatNumber_n_decimals(value, fractionalDigits) + ((i >= 0) ? ALPHABET[i] : '');
    }
}