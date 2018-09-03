import Vue from 'vue';
import * as $ from 'jquery';

export default Vue.directive('select2', {
    bind: function (el, binding, vnode) {

        var key = vnode.data.attrs.set_value_in; //el.getAttribute('v-model');

        var select = $(el);

        Vue.nextTick(function () {
            if (!select.select2) {
                console.error("FIXME: select2 not loading properly");
                return;
            }
            select.select2({
                theme: 'bootstrap',
                //tags: "true",
                allowClear: false
            });
        });

        select.on('change', function () {
            var value = select.val() || [];
            Vue.set(vnode.context, key, value);
        });
    }
});