import { Component } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import { ModuleMenuGetter } from '../store/MenuStore';
import MenuElementBase from '../vos/MenuElementBase';
import './MenuComponent.scss';

@Component({
    template: require('./MenuComponent.pug'),
    components: {}
})
export default class MenuComponent extends VueComponentBase {

    // On triche un peu mais il est sensé n'y avoir qu'un menu....
    public static getInstance(): MenuComponent {
        return MenuComponent.instance;
    }

    private static instance: MenuComponent;

    @ModuleMenuGetter
    public getMenuElements: MenuElementBase[];

    // TODO : Toggle menu size
    //private toggleMenu:boolean = true;

    public constructor() {
        super();
        MenuComponent.instance = this;
    }
}