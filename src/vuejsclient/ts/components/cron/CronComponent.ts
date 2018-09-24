import Component from 'vue-class-component';
import ModuleCron from '../../../../shared/modules/Cron/ModuleCron';
import VueComponentBase from '../../../ts/components/VueComponentBase';

@Component({
    template: require('./CronComponent.pug'),
    components: {}
})
export default class CronComponent extends VueComponentBase {

    private is_running: boolean = false;

    private async run_cron() {
        this.is_running = true;

        await ModuleCron.getInstance().executeWorkers();

        this.is_running = false;
    }
}