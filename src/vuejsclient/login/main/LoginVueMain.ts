import "bootstrap/dist/css/bootstrap.min.css";
import 'font-awesome/css/font-awesome.min.css';
import { Component } from "vue-property-decorator";
import OnPageTranslation from '../../ts/components/OnPageTranslation/component/OnPageTranslation';
import VueComponentBase from '../../ts/components/VueComponentBase';
import "../scss/login-skin-print.scss";
import "../scss/login-skin.scss";
import './LoginVueMain.scss';

@Component({
    template: require('./LoginVueMain.pug'),
    components: {
        Onpagetranslation: OnPageTranslation,
    }
})
export default class LoginVueMain extends VueComponentBase {
}