module.exports = function (RED) {
    const moment = require('moment')
    function UIFeed (config) {
        RED.nodes.createNode(this, config)
        const node = this
        const group = RED.nodes.getNode(config.group)
        const base = group.getBase()
        let tik = 0
        let seconds = 0
        const timeouts = {
            close: null,
            step: null
        }
        function formatTimer (val) {
            return moment.utc(val * 1000).format('HH:mm:ss')
        }
        function startTimer (val, dur) {
            seconds = dur
            tik = (new Date()).getTime()
            timeouts.close = setTimeout(() => {
                stopTimer()
            }, dur * 1000)
            timeouts.step = setInterval(() => {
                const tok = (new Date()).getTime()
                const elapsed = (tok - tik) / 1000
                seconds = dur - elapsed
                base.stores.data.save(base, node, { payload: val, timer: seconds })
                node.status({ fill: 'green', shape: 'dot', text: `${val.label}: ${formatTimer(seconds)}` })
            }, 1000)
            const msg = {}
            if (config.topic) { msg.topic = config.topic }
            msg.payload = val.value
            node.send(msg)
        }
        function stopTimer () {
            base.stores.data.save(base, node, { payload: null, timer: null })
            node.status({})
            clearTimeout(timeouts.close)
            clearInterval(timeouts.step)
            tik = null
            timeouts.close = null
            timeouts.step = null
            const msg = {}
            if (config.topic) { msg.topic = config.topic }
            msg.payload = config.cancel
            node.send(msg)
        }
        const evts = {
            /**
             * @param {object} msg - the last known msg received (prior to this new value)
             * @param {boolean} value - the updated value sent by the widget
             */
            onChange: async function (msg, value) {
                if (value === null) {
                    stopTimer()
                } else {
                    const dur = (value.hour * 3600) + (value.minute * 60) + value.second
                    base.stores.data.save(base, node, { payload: value, timer: dur })
                    startTimer(value, dur)
                }
            }
        }
        config.cancel = RED.util.evaluateNodeProperty(config.cancel, config.cancelType, node)
        config.options.forEach((option) => {
            option.value = RED.util.evaluateNodeProperty(option.value, option.valueType, node)
            option.hour = parseFloat(option.hour)
            option.minute = parseFloat(option.minute)
            option.second = parseFloat(option.second)
        })
        if (group) {
            group.register(node, config, evts)
        } else {
            node.error('No group configured')
        }
        node.on('close', function () {
            if (timeouts) {
                clearTimeout(timeouts.close)
                clearInterval(timeouts.step)
                node.status({})
            }
        })
    }
    RED.nodes.registerType('ui-feed', UIFeed)
}
