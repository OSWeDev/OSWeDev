import Vue from 'vue';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';

export default Vue.directive('select2', {
    bind: function (el, binding, vnode) {

        const key = vnode.data.attrs.set_value_in; //el.getAttribute('v-model');

        const select = $(el);

        Vue.nextTick(function () {
            // DIRTY : Incompatibilité quand on essaie de mettre les types select2 avec les types nodes....
            if (!select['select2']) {
                ConsoleHandler.error("FIXME: select2 not loading properly");
                return;
            }
            select['select2']({
                theme: 'bootstrap',
                //tags: "true",
                allowClear: false
            });
        });

        select.on('change', function () {
            const value = select.val() || [];
            Vue.set(vnode.context, key, value);
        });
    }
});