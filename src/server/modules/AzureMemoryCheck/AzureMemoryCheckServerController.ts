import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class AzureMemoryCheckServerController {

    public static memory_usage_datas: number[] = [];
    public static dao_server_coef: number = 1;

    // Ajouter une nouvelle entrée à memory_usage_datas en respectant la limite
    public static addMemoryUsageData(value: number, limit: number = 60): void {
        if (AzureMemoryCheckServerController.memory_usage_datas.length >= limit) {
            AzureMemoryCheckServerController.memory_usage_datas.shift();
        }
        AzureMemoryCheckServerController.memory_usage_datas.push(value);

        if (AzureMemoryCheckServerController.memory_usage_datas[AzureMemoryCheckServerController.memory_usage_datas.length - 1] > 0.95) {
            ConsoleHandler.warn('Mémoire RAM AZURE proche saturation : ' + AzureMemoryCheckServerController.memory_usage_datas[AzureMemoryCheckServerController.memory_usage_datas.length - 1] + ' % - on bloque les requêtes en attendant de retrouver de la mémoire');
            ConsoleHandler.warn('--     dao_server_coef était = à ' + AzureMemoryCheckServerController.dao_server_coef + ' et on le passe à 0');
            ConsoleHandler.warn('--     les dernières valeurs de memory_usage_datas sont : ' + AzureMemoryCheckServerController.memory_usage_datas.join(', '));
            AzureMemoryCheckServerController.dao_server_coef = 0;
            return;
        }

        let acceleration = AzureMemoryCheckServerController.getMemoryUsageAcceleration();
        if (acceleration > 1.1) {
            ConsoleHandler.warn('Acceleration de la consommation de mémoire détectée: ' + acceleration);
            AzureMemoryCheckServerController.dao_server_coef /= acceleration;
        } else if (acceleration < 0.9) {
            ConsoleHandler.log('Ralentissement de la consommation de mémoire détectée: ' + acceleration);
            AzureMemoryCheckServerController.dao_server_coef /= acceleration;
        }

        if (AzureMemoryCheckServerController.dao_server_coef > 1) {
            AzureMemoryCheckServerController.dao_server_coef = 1;
        }

        if (AzureMemoryCheckServerController.dao_server_coef < 0) {
            AzureMemoryCheckServerController.dao_server_coef = 0;
        }
    }

    // Calculez le taux d'augmentation de la consommation de mémoire
    // On prend la première moitité des éléments de memory_usage_datas et on calcule la moyenne d'augmentation de la consommation de mémoire
    //  puis on prend la deuxième moitié et on calcule la moyenne d'augmentation de la consommation de mémoire
    //  et on déduit l'accélération de l'augmentation de la consommation de mémoire'
    public static getMemoryUsageAcceleration(): number {

        if (this.memory_usage_datas.length < 4) {
            return 0;
        }

        let first_half = this.memory_usage_datas.slice(0, Math.floor(this.memory_usage_datas.length / 2));
        let second_half = this.memory_usage_datas.slice(Math.floor(this.memory_usage_datas.length / 2), this.memory_usage_datas.length);

        let first_half_acceleration = 0;
        let second_half_acceleration = 0;

        for (let istr in first_half) {
            let i = parseInt(istr);
            if (!i) {
                continue;
            }
            first_half_acceleration += first_half[i] - first_half[i - 1];
        }
        first_half_acceleration = first_half_acceleration / (first_half.length - 1);

        for (let istr in second_half) {
            let i = parseInt(istr);
            if (!i) {
                continue;
            }
            second_half_acceleration += second_half[i] - second_half[i - 1];
        }
        second_half_acceleration = second_half_acceleration / (second_half.length - 1);

        return second_half_acceleration / first_half_acceleration;
    }
}