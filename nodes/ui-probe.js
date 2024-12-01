module.exports = function (RED) {
    function UIProbe (config) {
        RED.nodes.createNode(this, config)
        const node = this
        const group = RED.nodes.getNode(config.group)
        const base = group.getBase()

        if (typeof config.decimal !== 'undefined') {
            config.decimal = parseFloat(config.decimal)
        }
        if (typeof config.minin !== 'undefined') {
            config.minin = parseFloat(config.minin)
        }
        if (typeof config.minout !== 'undefined') {
            config.minout = parseFloat(config.minout)
        }
        if (typeof config.maxin !== 'undefined') {
            config.maxin = parseFloat(config.maxin)
        }
        if (typeof config.maxout !== 'undefined') {
            config.maxout = parseFloat(config.maxout)
        }

        function hasProperty (obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop)
        }

        function toFixedNumber (num, digits, base) {
            const pow = Math.pow(base ?? 10, digits)
            return Math.round(num * pow) / pow
        }

        const evts = {
            onChange: true,
            beforeSend: function (msg) {
                let err = false
                const p = msg.payload
                if (Array.isArray(p)) {
                    msg._datapoint = p.map((point) => {
                        return addToChart(point)
                    })
                } else {
                    msg._datapoint = addToChart(p)
                }
                function addToChart (p) {
                    const datapoint = {}
                    if (typeof p === 'number') {
                        datapoint.x = (new Date()).getTime()
                        datapoint.y = p
                    } else if (typeof p === 'object') {
                        datapoint.x = hasProperty(p, 'x') ? p.x : (new Date()).getTime()
                        datapoint.y = (typeof p.y === 'number') ? p.y : 'ERR'
                    } else {
                        datapoint.y = 'ERR'
                    }
                    if (datapoint.y === 'ERR') {
                        err = true
                        return datapoint
                    }
                    if (config.scale) {
                        if (datapoint.y <= config.minin) { datapoint.y = config.minin }
                        if (datapoint.y >= config.maxin) { datapoint.y = config.maxin }
                        datapoint.y = (((datapoint.y - config.minin) / (config.maxin - config.minin)) * (config.maxout - config.minout)) + config.minout
                    }
                    datapoint.y = toFixedNumber(datapoint.y, config.decimal, 10)
                    return datapoint
                }
                if (err) {
                    node.error('Invalid payload!', msg)
                }
                return msg
            },
            onInput: function (msg, send, done) {
                if (!base.stores.data.get(node.id)) {
                    base.stores.data.save(base, node, [])
                }
                if (Array.isArray(msg.payload) && !msg.payload.length) {
                    base.stores.data.save(base, node, [])
                } else {
                    if (!Array.isArray(msg.payload)) {
                        base.stores.data.append(base, node, {
                            ...msg
                        })
                    } else {
                        msg.payload.forEach((p, i) => {
                            const payload = JSON.parse(JSON.stringify(p))
                            const d = msg._datapoint ? msg._datapoint[i] : null
                            const m = {
                                ...msg,
                                payload,
                                _datapoint: d
                            }
                            base.stores.data.append(base, node, m)
                        })
                    }
                    if (config.removeOlder && config.removeOlderUnit) {
                        const removeOlder = parseFloat(config.removeOlder)
                        const removeOlderUnit = parseFloat(config.removeOlderUnit)
                        const ago = (removeOlder * removeOlderUnit) * 1000
                        const cutoff = (new Date()).getTime() - ago
                        const _msg = base.stores.data.get(node.id).filter((msg) => {
                            let timestamp = msg._datapoint.x
                            if (typeof (msg._datapoint.x) === 'string') {
                                timestamp = (new Date(msg._datapoint.x)).getTime()
                            }
                            return timestamp > cutoff
                        })
                        base.stores.data.save(base, node, _msg)
                    }
                }
                send(msg)
            }
        }
        if (group) {
            group.register(node, config, evts)
        } else {
            node.error('No group configured')
        }
    }
    RED.nodes.registerType('ui-probe', UIProbe)
}
