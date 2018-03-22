const {camelCase} = require('lodash')

function addTransition (states, {name, from, to}) {
    from = Array.isArray(from) ? from : [from]

    from.forEach(from => {
        states[from] = states[from] || {}
        states[from][to] = states[from][to] || {}
        states[from][to]['transition'] = name
    })
}

module.exports = class FSM {
    constructor ({start, transitions = [], methods = []}) {
        const states = {}
        this.state = start
        transitions.forEach(transition => {
            if (transition.from && transition.to) {
                addTransition(states, transition)
            } else if (transition.states) {
                transition.states.reduce((from, to) => {
                    addTransition(states, { name: transition.name, from, to })

                    return to
                }, transition.states.shift())
            }
        })

        return new Proxy(this, {
            get: function (object, property) {
                if (Reflect.has(object, property)) {
                    return Reflect.get(object, property)
                } else {
                    return async function () {
                        const name = property
                        const from = this.state
                        if (!states[from]) return
                        const to = Object.keys(states[from]).find(to => states[from][to]['transition'] === name)

                        if (to) {
                            let  canTo = true
                            if(methods[camelCase(`can be ${to}`)]) {
                                canTo = await methods[camelCase(`can be ${to}`)]()
                            }
                            let  canFrom = true
                            if(methods[camelCase(`can be ${from}`)]) {
                                canFrom = await methods[camelCase(`can be ${from}`)]()
                            }
                            let canAction = true
                            if(methods[camelCase(`can ${name}`)]) {
                                canAction = await methods[camelCase(`can ${name}`)]()
                            }

                            if (canAction && canTo && canFrom) {

                                if(methods[camelCase(`from ${from}`)]) {
                                    await methods[camelCase(`from ${from}`)]()
                                }
                                if(methods[camelCase(`to ${to}`)]) {
                                    await methods[camelCase(`to ${to}`)]()
                                }
                                if(methods[camelCase(`on ${name}`)]) {
                                    await methods[camelCase(`on ${name}`)]()
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
