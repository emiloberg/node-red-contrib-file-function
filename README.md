# node-red-contrib-file-function

**This Node-RED node is just like the [core node "function"](http://nodered.org/docs/writing-functions.html), only that this node loads the script to be executed from an actual file on your drive.**

This may help you developing for Node RED. Instead of having to write your Javascript code in that small textfield in your browser you can use your favorite editor/IDE. 

![screenshot of settings](https://raw.githubusercontent.com/emiloberg/node-red-contrib-file-function/master/docs/screenshot-settings.png)



## Status
What? | Status | What? | Status
------- | ------ | ------- | ------
Code Climate GPA | [![Code Climate](https://codeclimate.com/github/emiloberg/node-red-contrib-file-function/badges/gpa.svg)](https://codeclimate.com/github/emiloberg/node-red-contrib-file-function) | Licence | [![Licence](https://img.shields.io/npm/l/node-red-contrib-file-function.svg)](https://github.com/emiloberg/node-red-contrib-file-function/blob/master/LICENSE)
Codacy | [![Codacy Badge](https://www.codacy.com/project/badge/f51ca088d01f4af6b83ed2e2529b51dd)](https://www.codacy.com/public/emiloberg/node-red-contrib-file-function) | Tag |  [![Tag](https://img.shields.io/github/tag/emiloberg/node-red-contrib-file-function.svg)](https://github.com/emiloberg/node-red-contrib-file-function/tags)
Issues | [![Issues](https://img.shields.io/github/issues/emiloberg/node-red-contrib-file-function.svg)](https://github.com/emiloberg/node-red-contrib-file-function/issues) | GitHub Forks | [![Forks](https://img.shields.io/github/forks/emiloberg/node-red-contrib-file-function.svg)](https://github.com/emiloberg/node-red-contrib-file-function/network)
GitHub Version | [![GitHub version](https://badge.fury.io/gh/emiloberg%2Fnode-red-contrib-file-function.svg)](http://badge.fury.io/gh/emiloberg%2Fnode-red-contrib-file-function) | GitHub Followers | [![Followers](https://img.shields.io/github/followers/emiloberg.svg)](https://github.com/emiloberg/followers)
NPM Version | [![npm version](https://badge.fury.io/js/node-red-contrib-file-function.svg)](http://badge.fury.io/js/node-red-contrib-file-function) | Dependencies | ![Dependencies](https://david-dm.org/emiloberg/node-red-contrib-file-function.svg)


## Filename
The file path will be relative from the path set in _settings.userDir_, or if not set from the Node-RED install directory.

Either set the filename in the configuration dialog of the node, or override it by the `msg.filename` property of the incoming message.

## Cache
By checking the _"Reread file from disk every time node is invoked?"_ checkbox the file will be read every time the node is called, so there's no need to redeploy or restart Node-RED. If the checkbox is unchecked, the file will be read on deploy/start.

If the checkbox is set to only read the file once (when flow is deployed/Node-RED is started) but another filename is sent in msg.filename, it will read the file from disk and cache it anyways. Only the last called file will be cached. If you're alternating between two different files you're better of creating two different nodes if you're looking for perfomance.

Unless you're working with functions called __very__ often or with __very__ large functions you can probably just leave it to reload the file every time it's invoked.


## Writing functions

Writing functions in this node works works just like functions in the the original function node (except that you write it in an actual file and no in an input field):

> The message is passed in as a JavaScript object called msg.
> 
> By convention it will have a `msg.payload` property containing the body of the message.
> 
> The function should return the messages it wants to pass on to the next nodes in the flow. It can return:
> 
> * a single message object - passed to nodes connected to the first output
> * an array of message objects - passed to nodes connected to the corresponding outputs
> 
> If any element of the array is itself an array of messages, multiple messages are sent to the corresponding output.
> 
> If null is returned, either by itself or as an element of the array, no message is passed on.
> 
> See the [online documentation](http://nodered.org/docs/writing-functions.html) for more help.


## Sample
Create a file called `sample-file-function.js` in your Node-RED root folder. Add the following content to that file:

```javascript
var reversedPayload = msg.payload.split("").reverse().join("");

return {
    payload: 'This is the input payload, but reversed: ' + reversedPayload
};
```

![screenshot of sample flow](https://raw.githubusercontent.com/emiloberg/node-red-contrib-file-function/master/docs/screenshot-flow.png)

Import this flow (or add it manually by creating a simple [inject] > [file function] > [debug] flow yourself. Add the value `sample-file-function.js` to the _filename_ field in the _file function_ node):

```javascript
[{"id":"62efe026.9d102","type":"inject","name":"Inject","topic":"this is topic from the function","payload":"this data is feeded to the function","payloadType":"string","repeat":"","crontab":"","once":false,"x":303,"y":119,"z":"dd1ad5c3.22e528","wires":[["fd11ceda.02ee3"]]},{"id":"fd11ceda.02ee3","type":"file function","name":"","filename":"sample-file-function.js","outputs":"1","x":508,"y":119,"z":"dd1ad5c3.22e528","wires":[["7e85f5db.817a0c"]]},{"id":"7e85f5db.817a0c","type":"debug","name":"","active":true,"console":"false","complete":"true","x":723,"y":118,"z":"dd1ad5c3.22e528","wires":[]}]
```

Deploy the changes and click the inject node - check the output in the debug sidebar!
