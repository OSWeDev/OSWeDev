Check those versions in package.json

        "compression-webpack-plugin": "10.0.0",
        "html-webpack-plugin": "5.5.1",
        "ifdef-loader": "2.3.2",
        "pug-plain-loader": "1.1.0",
        "raw-loader": "4.0.2",
        "speed-measure-webpack-plugin": "1.5.0",
        "style-loader": "3.3.2",
        "ts-loader": "9.4.2",
        "webpack": "5.80.0",
        "webpack-bundle-analyzer": "4.8.0",
        "webpack-cli": "5.0.2",
        "webpack-mild-compile": "3.4.0",
        "webpack-pwa-manifest": "4.3.0",
        "workbox-webpack-plugin": "6.5.4"

Remove
     filename: "[path].gz[query]",
from Compression plugin in common webpack conf


in common webpack conf add :
/**
 * This is a hack to make fullcalendar work with webpack 5
 *  cf https://github.com/fullcalendar/fullcalendar/issues/5822
 *  cf https://github.com/webpack/webpack/issues/11467
 */
export let hack_until_fullcalendar_5_4_0 = {
    test: /\.m?js/,
    resolve: {
        fullySpecified: false
    }
};

and then add the new module in each webpack conf (login/admin/client)
    module: {
        rules: [
            module_scss,
            module_vue,
            module_pug,
            module_ts,
            module_css,
            module_img,
            hack_until_fullcalendar_5_4_0
        ]
    },




Not sure this part is mandatory, try without but then if it fails try with it :

Add 
    "browser": {
        "zlib": false
    },
Over
    "dependencies": {
in your package.json