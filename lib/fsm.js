const {camelCase} = require('lodash')

module.exports = class FSM {
    constructor ({start, transitions = [], methods = []}) {
        this.state = start
        this.states = {}
        this.methods = methods
        transitions.forEach(transition => {
            if (!Array.isArray(transition.from)) {
                transition.from = [transition.from]
            }

            transition.from.forEach(from => {
                this.states[from] = this.states[from] || {}
                this.states[from][transition.to] = transition.action
            })
        })

        return new Proxy(this, {
            get: function (object, property) {
                if (Reflect.has(object, property)) {
                    return Reflect.get(object, property)
                } else {
                    return async function () {
                        const action = property
                        const from = this.state
                        const to = Object.keys(this.states[from]).find(to => this.states[from][to] === action)

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
        })
    }
}
