import * as moment from 'moment';
import { Moment } from 'moment';
import MonthEventVO from '../modules/MonthEvents/vos/MonthEventVO';
import ModuleMonthEvents from '../modules/MonthEvents/ModuleMonthEvents';
import ModuleHolidayController from '../modules/HolidayController/ModuleHolidayController';
import StoreHolidayVO from '../modules/HolidayController/vos/StoreHolidayVO';
import HolidayVO from '../modules/HolidayController/vos/HolidayVO';

export default class TextHandler {

    public static Challenge_Cars: string[] =
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    public static getInstance(): TextHandler {
        if (!TextHandler.instance) {
            TextHandler.instance = new TextHandler();
        }
        return TextHandler.instance;
    }

    private static instance: TextHandler = null;

    private constructor() {
    }

    /**
     * Renvoie un ID en lowercase et caractères spéciaux et espaces remplacés par _
     * @param txt Le texte à convertir
     */
    public formatTextToID(txt: string): string {
        return txt.toLowerCase().replace(/[^a-z]/g, '_').replace(/__+/g, '_');
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
}