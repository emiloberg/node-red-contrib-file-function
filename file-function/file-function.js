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
const util = require('util')
const vm = require('vm')
const fs = require('fs')
const path = require('path')

module.exports = RED => {
  function runScript(node, msg, script) {
    const functionText = `const results = null; results = (function(msg){${script.replace(/return *msg;*[\s\r\n\t]/, '')}return msg})(msg);`

    const sandbox = {
      console,
      util,
      Buffer,
      context: {
        global: RED.settings.functionGlobalContext || {}
      }
    }

    const context = vm.createContext(sandbox)
    const vmScript = vm.createScript(functionText)

    try {
      const start = process.hrtime()
      context.msg = msg
      vmScript.runInContext(context)
      let { results } = context
      results = Array.isArray(results) ? results : [results]

      if (msg.topic) {
        results.forEach(item => {
          const itemArray = Array.isArray(item) ? item : [item]
          itemArray.forEach(result => {
            if (result.topic) {
              result.topic = msg.topic
            }
          })
        })
      }

      node.send(results)
      const duration = process.hrtime(start)
      if (process.env.NODE_RED_FUNCTION_TIME) {
        this.status({
          fill: 'yellow',
          shape: 'dot',
          text: `${Math.floor((duration[0] * 1e9 + duration[1]) / 10000) / 100}`
        })
      }
    } catch (err) {
      node.warn(err)
    }
  }

  function FunctionNode(config) {
    const node = this
    const { filename } = config

    RED.nodes.createNode(node, config)
    node.filename = ''
    const projects = RED.settings.get('projects') || {}
    const paths = filename ? [
      path.join(process.env.PWD || '', filename),
      path.join(process.cwd(),filename),
      path.join(RED.settings.userDir, filename)
    ] : []

    if (paths.length && projects.activeProject) {
      paths.push(path.join(RED.settings.userDir, 'projects', projects.activeProject, filename))
    }

    paths.forEach(filename => {
      if (fs.existsSync(filename)) {
        node.filename = filename
      }
    })

    // Read and file when node is initialized,
    // if user didn't check the "reload file every time"-checkbox, we'll be using
    // this when node is invoked.
    if (node.filename) {
      node.loadedFilename = node.filename
      node.loadedScript = fs.readFileSync(node.filename, { encoding: 'utf-8' })

      // On invocation
      node.on('input', msg => {
        const filename = msg.filename || node.filename

        if (filename === '') {
          node.warn('No file with that name found.')
        } else if (
          config.reloadFile === false
          && filename === node.loadedFilename
          && node.loadedScript !== ''
        ) {
          // Run script from "cache"
          runScript(node, msg, node.loadedScript)
        } else {
          node.loadedScript = fs.readFileSync(node.filename, { encoding: 'utf-8' })
          node.loadedFilename = filename
          runScript(node, msg, node.loadedScript)
        }
      })
    } else {
      node.warn('No file with that name found.')
    }
  }

  RED.nodes.registerType('file-function', FunctionNode)
  RED.library.register('functions')
}
