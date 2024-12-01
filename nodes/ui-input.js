module.exports = function (RED) {
    function UIInput (config) {
        RED.nodes.createNode(this, config)
        const node = this
        const group = RED.nodes.getNode(config.group)
        const base = group.getBase()
        function findOptionByValue (val) {
            const opt = config.options?.find((option) => {
                if (typeof (val) === 'object') {
                    return (JSON.stringify(val) === JSON.stringify(option.value))
                } else {
                    return option.value === val
                }
            })
            if (opt) {
                return opt
            }
            return null
        }
        const evts = {
            beforeSend: function (msg) {
                const p = RED.util.getMessageProperty(msg, config.stateField)
                if (typeof p !== 'undefined') {
                    const option = findOptionByValue(p)
                    if (!option) {
                        node.error('Invalid payload!', msg)
                    }
                }
                return msg
            },
            onInput: function (msg) {
                base.stores.data.save(base, node, msg)
                node.send(msg)
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
    }
    RED.nodes.registerType('ui-input', UIInput)
}
