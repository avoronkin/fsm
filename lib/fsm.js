const {camelCase} = require('lodash')

module.exports = class FSM {
    constructor ({start, transitions = [], methods = []}) {
        this.state = start
        this.actions = {}
        this.methods = methods
        transitions.forEach(transition => {
            this.actions[transition.action] = this.actions[transition.action] || {}

            if (Array.isArray(transition.from)) {
                transition.from.forEach(from => {
                    this.actions[transition.action][from] = transition.to
                })

            } else {
                this.actions[transition.action][transition.from] = transition.to
            }
        })

        return new Proxy(this, {
            get: function (object, property) {
                if (Reflect.has(object, property)) {
                    return Reflect.get(object, property)
                } else {
                    return async function () {
                        const transition = this.actions[property]
                        const from = this.state

                        if (transition) {
                            const to = transition[from]

                            if (to) {
                                if(this.methods[camelCase(`from ${from}`)]) {
                                    await this.methods[camelCase(`from ${from}`)]()
                                }
                                if(this.methods[camelCase(`to ${to}`)]) {
                                    await this.methods[camelCase(`to ${to}`)]()
                                }
                                if(this.methods[camelCase(`on ${property}`)]) {
                                    await this.methods[camelCase(`on ${property}`)]()
                                }
                                this.state = to
                            }
                        }
                    }
                }
            }
        })
    }
}
