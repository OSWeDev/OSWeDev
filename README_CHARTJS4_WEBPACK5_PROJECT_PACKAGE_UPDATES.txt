Check those versions in package.json

        "ifdef-loader": "2.3.2",
        "pug-plain-loader": "1.1.0",
        "raw-loader": "4.0.2",
        "style-loader": "3.3.2",
        "ts-loader": "9.4.2",

REPLACE all using regexp from line 1 to line 2 :
@import 'base/
@import '

AND
import ([^ =]+) = require\(['"]([^'"]+)['"]\);
import $1 from '$2';

REPLACE all without regexp :
import * as 
import 