import { Component } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';

@Component({
    template: require('./Error404.pug'),
    components: {}
})
export default class Error404Component extends VueComponentBase {

    public mounted() {
        this.$router.push('/');
    }
}