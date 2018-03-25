const {camelCase} = require('lodash')
const state = Symbol('state')

function addTransition (states, {name, from, to}) {
    from = Array.isArray(from) ? from : [from]

    from.forEach(from => {
        states[from] = states[from] || {}
        states[from][to] = states[from][to] || {}
        states[from][to].transition = name
    })
}

function parseTransition (str) {
    const [name, statesStr] = str.split(':')
    const states = statesStr.split('>')

    return {
        name: name.trim(),
        states: states.map(state => {
            return state.split('|').map(state => state.trim())
        })
    }
}

module.exports = class FSM {
    constructor ({start, transitions = [], handlers = []}) {
        this.states = {}
        this[state] = start
        this.transition
        this.handlers = handlers

        transitions.forEach(transition => {
            if (typeof transition === 'string') {
                transition = parseTransition(transition)
            }

            if (transition.from && transition.to) {
                addTransition(this.states, transition)
            } else if (transition.states) {
                transition.states.reduce((from, to) => {
                    addTransition(this.states, { name: transition.name, from, to })

                    return to
                }, transition.states.shift())
            }
        })

        return new Proxy(this, {
            get: function (target, property) {
                if (Reflect.has(target, property)) {
                    return Reflect.get(target, property)
                } else {
                    return async function () {
                        try {
                            const name = property

                            if (target.transition) {
                                return
                            }

                            target.transition = name

                            const can = await this.can(name)

                            const from = target[state]
                            const to = this.getToState(from, name)

                            if (can) {
                                const handlers = [
                                    `on ${name}`,
                                    `from ${from}`,
                                    `to ${to}`,
                                ]
                                    .map(camelCase)
                                    .filter(handlerName => !!this.handlers[handlerName])
                                    .map(handlerName => this.handlers[handlerName](name, from, to))

                                await Promise.all(handlers)

                                this[state] = to
                            }


                            delete target.transition
                        } catch (err) {
                            delete target.transition
                            throw err
                        }
                    }
                }
            }
        })
    }

    get state () {
        return this[state]
    }

    set state (v) {}

    async can (name) {
        const from = this.state
        const to = this.getToState(from, name)

        if (!to) {
            return false
        }

        const guards = [
            `can ${to}`,
            `can to ${to}`,
            `can ${from}`,
            `can from ${from}`,
            `can ${name}`
        ]
            .map(camelCase)
            .filter(guardName => !!this.handlers[guardName])
            .map(guardName => this.handlers[guardName](name, from, to))

        const results = await Promise.all(guards)

        return !results.filter(result => !result).length
    }

    getToState (fromStateName, transitionName) {
        if (!this.states[fromStateName]) {
            return false
        }

        return Object
            .keys(this.states[fromStateName])
            .find(to => this.states[fromStateName][to].transition === transitionName)
    }
}
