/* à creuser export default class ServiceFactory {
    private static instance = null;

    private constructor(){
        ServiceFactory.instance = this;
    }

    public static getInstance(){
        if (!ServiceFactory.instance){
            ServiceFactory.instance = new ServiceFactory();
        }
        return ServiceFactory.instance;
    }

    private singletons: {[name:string] : Object} = {};

    public addSingleton(name:string, item:Object){
        this.singletons[name] = item;
    }
    public getSingleton(name:string, ctor:Function){
        if (!this.singletons[name]){

        }
    }
}*/