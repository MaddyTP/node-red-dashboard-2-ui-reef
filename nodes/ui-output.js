/* eslint-disable no-prototype-builtins */
module.exports = function (RED) {
    'use strict'
    const util = require('util')
    const vm = require('vm')
    const acorn = require('acorn')
    const acornWalk = require('acorn-walk')
    function UIOutput (config) {
        RED.nodes.createNode(this, config)
        const node = this
        const group = RED.nodes.getNode(config.group)
        const base = group.getBase()
        node.name = config.name
        node.func = config.func
        node.outputs = config.outputs
        node.libs = config.libs || []
        node.topic = config.topic
        node.outstandingTimers = []
        node.outstandingIntervals = []
        node.clearStatus = false
        function emit (val) {
            base.emit('msg-display:' + node.id, val, node)
        }
        function sendResults (node, send, _msgid, msgs, cloneFirstMessage) {
            if (msgs == null) {
                return
            } else if (!Array.isArray(msgs)) {
                msgs = [msgs]
            }
            let msgCount = 0
            for (let m = 0; m < msgs.length; m++) {
                if (msgs[m]) {
                    if (!Array.isArray(msgs[m])) {
                        msgs[m] = [msgs[m]]
                    }
                    for (let n = 0; n < msgs[m].length; n++) {
                        let msg = msgs[m][n]
                        if (msg !== null && msg !== undefined) {
                            if (typeof msg === 'object' && !Buffer.isBuffer(msg) && !Array.isArray(msg)) {
                                if (msgCount === 0 && cloneFirstMessage !== false) {
                                    msgs[m][n] = RED.util.cloneMessage(msgs[m][n])
                                    msg = msgs[m][n]
                                }
                                if (typeof msg.display !== 'undefined') { emit(msg.display) }
                                msg._msgid = _msgid
                                msgCount++
                            } else {
                                let type = typeof msg
                                if (type === 'object') {
                                    type = Buffer.isBuffer(msg) ? 'Buffer' : (Array.isArray(msg) ? 'Array' : 'Date')
                                }
                                node.error(RED._('function.error.non-message-returned', { type }))
                                emit('ERR')
                            }
                        }
                    }
                }
            }
            if (msgCount > 0) {
                send(msgs)
            }
        }
        function createVMOpt (node, kind) {
            const opt = {
                filename: 'Function node' + kind + ':' + node.id + (node.name ? ' [' + node.name + ']' : ''),
                displayErrors: true
            }
            return opt
        }
        function updateErrorInfo (err) {
            if (err.stack) {
                const stack = err.stack.toString()
                const m = /^([^:]+):([^:]+):(\d+).*/.exec(stack)
                if (m) {
                    const line = parseInt(m[3]) - 1
                    let kind = 'body:'
                    if (/setup/.exec(m[1])) {
                        kind = 'setup:'
                    }
                    if (/cleanup/.exec(m[1])) {
                        kind = 'cleanup:'
                    }
                    err.message += ' (' + kind + 'line ' + line + ')'
                }
            }
        }
        if (RED.settings.functionExternalModules === false && node.libs.length > 0) {
            throw new Error(RED._('function.error.externalModuleNotAllowed'))
        }
        const functionText = 'var results = null;' +
            'results = (async function(msg,__send__,__done__){ ' +
                'var __msgid__ = msg._msgid;' +
                'var node = {' +
                    'id:__node__.id,' +
                    'name:__node__.name,' +
                    'path:__node__.path,' +
                    'outputCount:__node__.outputCount,' +
                    'log:__node__.log,' +
                    'error:__node__.error,' +
                    'warn:__node__.warn,' +
                    'debug:__node__.debug,' +
                    'trace:__node__.trace,' +
                    'on:__node__.on,' +
                    'status:__node__.status,' +
                    'send:function(msgs,cloneMsg){ __node__.send(__send__,__msgid__,msgs,cloneMsg);},' +
                    'done:__done__' +
                '};\n' +
                node.func + '\n' +
            '})(msg,__send__,__done__);'
        let handleNodeDoneCall = true
        if (/node\.done\s*\(\s*\)/.test(functionText)) {
            acornWalk.simple(acorn.parse(functionText, { ecmaVersion: 'latest' }), {
                CallExpression (astNode) {
                    if (astNode.callee && astNode.callee.object) {
                        if (astNode.callee.object.name === 'node' && astNode.callee.property.name === 'done') {
                            handleNodeDoneCall = false
                        }
                    }
                }
            })
        }
        const sandbox = {
            console,
            util,
            Buffer,
            Date,
            RED: {
                util: {
                    ...RED.util,
                    getSetting: function (_node, name, _flow) {
                        return RED.util.getSetting(node, name)
                    }
                }
            },
            __node__: {
                id: node.id,
                name: node.name,
                path: node._path,
                outputCount: node.outputs,
                log: function () {
                    node.log.apply(node, arguments)
                },
                error: function () {
                    node.error.apply(node, arguments)
                },
                warn: function () {
                    node.warn.apply(node, arguments)
                },
                debug: function () {
                    node.debug.apply(node, arguments)
                },
                trace: function () {
                    node.trace.apply(node, arguments)
                },
                send: function (send, id, msgs, cloneMsg) {
                    sendResults(node, send, id, msgs, cloneMsg)
                },
                on: function () {
                    if (arguments[0] === 'input') {
                        throw new Error(RED._('function.error.inputListener'))
                    }
                    node.on.apply(node, arguments)
                },
                status: function () {
                    node.clearStatus = true
                    node.status.apply(node, arguments)
                }
            },
            context: {
                set: function () {
                    node.context().set.apply(node, arguments)
                },
                get: function () {
                    return node.context().get.apply(node, arguments)
                },
                keys: function () {
                    return node.context().keys.apply(node, arguments)
                },
                get global () {
                    return node.context().global
                },
                get flow () {
                    return node.context().flow
                }
            },
            flow: {
                set: function () {
                    node.context().flow.set.apply(node, arguments)
                },
                get: function () {
                    return node.context().flow.get.apply(node, arguments)
                },
                keys: function () {
                    return node.context().flow.keys.apply(node, arguments)
                }
            },
            global: {
                set: function () {
                    node.context().global.set.apply(node, arguments)
                },
                get: function () {
                    return node.context().global.get.apply(node, arguments)
                },
                keys: function () {
                    return node.context().global.keys.apply(node, arguments)
                }
            },
            env: {
                get: function (envVar) {
                    return RED.util.getSetting(node, envVar)
                }
            },
            setTimeout: function () {
                const func = arguments[0]
                arguments[0] = function () {
                    sandbox.clearTimeout(timerId)
                    try {
                        func.apply(node, arguments)
                    } catch (err) {
                        node.error(err, {})
                    }
                }
                const timerId = setTimeout.apply(node, arguments)
                node.outstandingTimers.push(timerId)
                return timerId
            },
            clearTimeout: function (id) {
                clearTimeout(id)
                const index = node.outstandingTimers.indexOf(id)
                if (index > -1) {
                    node.outstandingTimers.splice(index, 1)
                }
            },
            setInterval: function () {
                const func = arguments[0]
                arguments[0] = function () {
                    try {
                        func.apply(node, arguments)
                    } catch (err) {
                        node.error(err, {})
                    }
                }
                const timerId = setInterval.apply(node, arguments)
                node.outstandingIntervals.push(timerId)
                return timerId
            },
            clearInterval: function (id) {
                clearInterval(id)
                const index = node.outstandingIntervals.indexOf(id)
                if (index > -1) {
                    node.outstandingIntervals.splice(index, 1)
                }
            }
        }
        if (util.hasOwnProperty('promisify')) {
            sandbox.setTimeout[util.promisify.custom] = function (after, value) {
                return new Promise(function (resolve, reject) {
                    sandbox.setTimeout(function () { resolve(value) }, after)
                })
            }
            sandbox.promisify = util.promisify
        }
        const moduleLoadPromises = []
        if (node.hasOwnProperty('libs')) {
            let moduleErrors = false
            const modules = node.libs
            modules.forEach(module => {
                const vname = module.hasOwnProperty('var') ? module.var : null
                if (vname && (vname !== '')) {
                    if (sandbox.hasOwnProperty(vname) || vname === 'node') {
                        node.error(RED._('function.error.moduleNameError', { name: vname }))
                        moduleErrors = true
                        return
                    }
                    sandbox[vname] = null
                    const spec = module.module
                    if (spec && (spec !== '')) {
                        moduleLoadPromises.push(RED.import(module.module).then(lib => {
                            sandbox[vname] = lib.default || lib
                        }).catch(err => {
                            node.error(RED._('function.error.moduleLoadError', { module: module.spec, error: err.toString() }))
                            throw err
                        }))
                    }
                }
            })
            if (moduleErrors) {
                throw new Error(RED._('function.error.externalModuleLoadError'))
            }
        }
        let func = false
        let processMessage = () => {}
        const evts = {
            /**
             * @param {object} msg - the last known msg received (prior to this new value)
             * @param {boolean} value - the updated value sent by the widget
             */
            onChange: async function (msg, value) {
                node.context().set('state', value)
                base.stores.data.save(base, node, value)
                const p = value.payload
                const n = RED.nodes.getNode(node.id)
                n.status({ fill: 'blue', shape: 'dot', text: p.label })
                delete msg._client
                delete msg.display
                msg.payload = p.value
                if (config.topic) { msg.topic = config.topic }
                if (p.valueType === 'func') {
                    func = true
                } else {
                    func = false
                    n.send(msg)
                }
            },
            onInput: function (msg, send) {}
        }
        const init = base.stores.data.get(node.id) === undefined ? node.context().get('state') || { payload: config.options[0] } : base.stores.data.get(node.id)
        if (init !== undefined) {
            base.stores.data.save(base, node, init)
            const msg = {}
            if (init.payload.valueType === 'func') {
                func = true
            } else {
                func = false
                if (config.topic) { msg.topic = config.topic }
                msg.payload = init.payload.value
                setTimeout(function () {
                    node.status({ fill: 'blue', shape: 'dot', text: init.payload.label })
                    node.send(msg)
                }, 1000)
            }
        }
        config.options.forEach(option => {
            option.value = RED.util.evaluateNodeProperty(option.value, option.valueType, node)
        })
        if (group) {
            group.register(node, config, evts)
        } else {
            node.error('No group configured')
        }
        node.on('input', function (msg, send, done) {
            if (func) {
                processMessage(msg, send, done)
            }
        })
        Promise.all(moduleLoadPromises).then(() => {
            const context = vm.createContext(sandbox)
            try {
                node.script = new vm.Script(functionText, createVMOpt(node, ''))
                processMessage = function (msg, send, done) {
                    const start = process.hrtime()
                    context.msg = msg
                    context.__send__ = send
                    context.__done__ = done
                    let opts = {}
                    if (node.timeout > 0) {
                        opts = node.timeoutOptions
                    }
                    node.script.runInContext(context, opts)
                    context.results.then(function (results) {
                        sendResults(node, send, msg._msgid, results, false)
                        if (handleNodeDoneCall) {
                            done()
                        }
                        const duration = process.hrtime(start)
                        const converted = Math.floor((duration[0] * 1e9 + duration[1]) / 10000) / 100
                        node.metric('duration', msg, converted)
                        if (process.env.NODE_RED_FUNCTION_TIME) {
                            node.status({ fill: 'yellow', shape: 'dot', text: '' + converted })
                        }
                    }).catch(err => {
                        emit('ERR')
                        if ((typeof err === 'object') && err.hasOwnProperty('stack')) {
                            const index = err.stack.search(/\n\s*at ContextifyScript.Script.runInContext/)
                            err.stack = err.stack.slice(0, index).split('\n').slice(0, -1).join('\n')
                            const stack = err.stack.split(/\r?\n/)
                            msg.error = err
                            if (stack.length > 0) {
                                let line = 0
                                let errorMessage
                                while (line < stack.length && stack[line].indexOf('ReferenceError') !== 0) {
                                    line++
                                }
                                if (line < stack.length) {
                                    errorMessage = stack[line]
                                    const m = /:(\d+):(\d+)$/.exec(stack[line + 1])
                                    if (m) {
                                        const lineno = Number(m[1]) - 1
                                        const cha = m[2]
                                        errorMessage += ' (line ' + lineno + ', col ' + cha + ')'
                                    }
                                }
                                if (errorMessage) {
                                    err.message = errorMessage
                                }
                            }
                            done(err)
                        } else if (typeof err === 'string') {
                            done(err)
                        } else {
                            done(JSON.stringify(err))
                        }
                    })
                }
                node.on('close', function () {
                    while (node.outstandingTimers.length > 0) {
                        clearTimeout(node.outstandingTimers.pop())
                    }
                    while (node.outstandingIntervals.length > 0) {
                        clearInterval(node.outstandingIntervals.pop())
                    }
                    if (node.clearStatus) {
                        node.status({})
                    }
                })
            } catch (err) {
                updateErrorInfo(err)
                node.error(err)
            }
        }).catch(() => {
            node.error(RED._('function.error.externalModuleLoadError'))
        })
    }
    RED.nodes.registerType('ui-output', UIOutput, {
        dynamicModuleList: 'libs',
        settings: {
            functionExternalModules: { value: true, exportable: true },
            functionTimeout: { value: 0, exportable: true }
        }
    })
    RED.library.register('ui-output')
}
