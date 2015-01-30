/**
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var vm = require("vm");
	var fs = require("fs");

    function FunctionNode(n) {
		RED.nodes.createNode(this, n);

		this.filename = n.filename || "";
		this.loadedScript = '';
		this.loadedFilename = '';

		var node = this;
		
		// Read and file when node is initialized,
		// if user didn't check the "reload file every time"-checkbox, we'll be using
		// this when node is invoked.
		if (this.filename !== '') {
			node.loadedFilename = this.filename;
			fs.readFile(this.filename, {encoding: 'utf-8'}, function (err, fileContent) {
				if (err) {
					if (err.code === 'ENOENT') {
						node.warn('Could not find file "' + err.path + '". Hint: File path is relative to "' + process.env.PWD + '"');
					} else {
						node.warn(err);
					}
				} else {
					node.loadedScript = fileContent;
				}
			});
		}


		// On invocation
		this.on("input", function (msg) {
			var filename = msg.filename || this.filename;

			if (filename === '') {
				node.warn('No filename specified');
			} else if (n.reloadfile === false && filename === node.loadedFilename && node.loadedScript !== ''){ // Run script from "cache"
				runScript(node, msg, node.loadedScript);
			} else { // Read script from disk and run
				fs.readFile(filename, {encoding: 'utf-8'}, function (err, fileContent) {
					if (err) {
						if (err.code === 'ENOENT') {
							node.warn('Could not find file "' + err.path + '". Hint: File path is relative to "' + process.env.PWD + '"');
						} else {
							node.warn(err);
						}
						msg.error = err;
					} else {
						node.loadedScript = fileContent;
						node.loadedFilename = filename;
						runScript(node, msg, fileContent);
					}
				});
			}
		});
	}


	function runScript(node, msg, script) {
		var functionText = "var results = null; results = (function(msg){"+script+"\n})(msg);";

		var sandbox = {
			console:console,
			util:util,
			Buffer:Buffer,
			context: {
				global:RED.settings.functionGlobalContext || {}
			}
		};

		var context = vm.createContext(sandbox);
		var vmScript = vm.createScript(functionText);

		try {
			var start = process.hrtime();
			context.msg = msg;
			vmScript.runInContext(context);
			var results = context.results;
			if (results == null) {
				results = [];
			} else if (results.length == null) {
				results = [results];
			}

			if (msg.topic) {
				for (var m in results) {
					if (results[m]) {
						if (util.isArray(results[m])) {
							for (var n=0; n < results[m].length; n++) {
								results[m][n].topic = msg.topic;
							}
						} else {
							results[m].topic = msg.topic;
						}
					}
				}
			}

			node.send(results);
			var duration = process.hrtime(start);
			if (process.env.NODE_RED_FUNCTION_TIME) {
				this.status({fill:"yellow",shape:"dot",text:""+Math.floor((duration[0]* 1e9 +  duration[1])/10000)/100});
			}

		} catch(err) {
			node.warn(err);
		}
	}

    RED.nodes.registerType("file function",FunctionNode);
    RED.library.register("functions");
};
