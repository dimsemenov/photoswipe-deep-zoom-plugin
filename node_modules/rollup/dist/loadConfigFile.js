/*
  @license
	Rollup.js v2.57.0
	Wed, 22 Sep 2021 04:43:07 GMT - commit b67ef301e8e44f9e0d9b144c0cce441e2a41c3da


	https://github.com/rollup/rollup

	Released under the MIT License.
*/
'use strict';

require('fs');
require('path');
require('url');
var loadConfigFile_js = require('./shared/loadConfigFile.js');
require('./shared/rollup.js');
require('./shared/mergeOptions.js');
require('tty');
require('crypto');
require('events');



module.exports = loadConfigFile_js.loadAndParseConfigFile;
//# sourceMappingURL=loadConfigFile.js.map
