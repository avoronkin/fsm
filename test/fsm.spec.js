const FSM = require('../lib/fsm')

describe('FSM', () => {
    describe('door', () => {

        it('can be closed and opened', async () => {
            let hasKey = false
            const door = new FSM({
                start: 'closed',
                transitions: [
                    {name: 'open', from: 'closed', to: 'opened'},
                    {name: 'close', from: 'opened', to: 'closed'},
                    {name: 'lock', from: 'closed', to: 'locked'},
                    {name: 'unlock', from: 'locked', to: 'closed'}
                ],
                handlers: {
                    canLocked: function () { return hasKey }
                }
            })

            expect(door.state).toEqual('closed')
            await door.open()
            expect(door.state).toEqual('opened')
            await door.lock()
            expect(door.state).toEqual('opened')
            await door.close()
            expect(door.state).toEqual('closed')
            hasKey = false
            await door.lock()
            expect(door.state).toEqual('closed')
            hasKey = true
            const canLocked = await door.can('lock')
            expect(canLocked).toEqual(true)
            await door.lock()
            expect(door.state).toEqual('locked')
            await door.open()
            expect(door.state).toEqual('locked')
            hasKey = false
            await door.unlock()
            expect(door.state).toEqual('locked')
            hasKey = true
            await door.unlock()
            expect(door.state).toEqual('closed')

        })

        it('can have handlers', async () => {
            const onClose = jest.fn()
            const onOpen = jest.fn()
            const fromClosed = jest.fn()
            const toClosed = jest.fn()
            const fromOpened = jest.fn()
            const toOpened = jest.fn()

            const doorConfig = {
                start: 'closed',
                transitions: [
                    {name: 'open', from: 'closed', to: 'opened'},
                    {name: 'close', from: 'opened', to: 'closed'}
                ],
                handlers: {
                    onClose,
                    onOpen,
                    fromClosed,
                    toClosed,
                    fromOpened,
                    toOpened
                }
            }

            const door = new FSM(doorConfig)

            expect(door.state).toEqual('closed')
            expect(onClose.mock.calls.length).toBe(0)
            expect(onOpen.mock.calls.length).toBe(0)
            expect(fromClosed.mock.calls.length).toBe(0)
            expect(toClosed.mock.calls.length).toBe(0)
            expect(fromOpened.mock.calls.length).toBe(0)
            expect(toOpened.mock.calls.length).toBe(0)

            await door.open()
            expect(door.state).toEqual('opened')
            expect(onClose.mock.calls.length).toBe(0)
            expect(onOpen.mock.calls.length).toBe(1)
            expect(fromClosed.mock.calls.length).toBe(1)
            expect(toClosed.mock.calls.length).toBe(0)
            expect(fromOpened.mock.calls.length).toBe(0)
            expect(toOpened.mock.calls.length).toBe(1)

            await door.close()
            expect(door.state).toEqual('closed')
            expect(onClose.mock.calls.length).toBe(1)
            expect(onOpen.mock.calls.length).toBe(1)
            expect(fromClosed.mock.calls.length).toBe(1)
            expect(toClosed.mock.calls.length).toBe(1)
            expect(fromOpened.mock.calls.length).toBe(1)
            expect(toOpened.mock.calls.length).toBe(1)
        })
    })

    describe('player', () => {

        it('should play, pause and stop', async () => {
            const player = new FSM({
                start: 'stopped',
                transitions: [
                    {name: 'play', from: ['stopped', 'paused'], to: 'playing'},
                    {name: 'stop', from: ['playing', 'paused'], to: 'stopped'},
                    {name: 'pause', from: 'playing', to: 'paused'},
                ]
            })

            expect(player.state).toEqual('stopped')
            await player.play()
            expect(player.state).toEqual('playing')
            await player.pause()
            expect(player.state).toEqual('paused')
            await player.stop()
            expect(player.state).toEqual('stopped')
            await player.pause()
            expect(player.state).toEqual('stopped')

        })

        it('should support short syntax', async () => {
            const player = new FSM({
                start: 'stopped',
                transitions: [
                    'play: stopped | paused > playing',
                    'stop: playing | paused > stopped',
                    'pause: playing > paused',
                ]
            })

            expect(player.state).toEqual('stopped')
            await player.play()
            expect(player.state).toEqual('playing')
            await player.pause()
            expect(player.state).toEqual('paused')
            await player.stop()
            expect(player.state).toEqual('stopped')
            await player.pause()
            expect(player.state).toEqual('stopped')
        })
    })

    describe('wizard', () => {
        it('should go to the next step', async () => {
            const wizard = new FSM({
                start: 'first',
                transitions: [
                    {name: 'next', from: 'first', to: 'second'},
                    {name: 'next', from: 'second', to: 'third'},
                    {name: 'next', from: 'third', to: 'fourth'},
                    {name: 'next', from: 'fourth', to: 'done'},

                    {name: 'prev', from: 'fourth', to: 'third'},
                    {name: 'prev', from: 'third', to: 'second'},
                    {name: 'prev', from: 'second', to: 'first'},
                ]
            })

            expect(wizard.state).toEqual('first')
            await wizard.next()
            expect(wizard.state).toEqual('second')
            await wizard.next()
            expect(wizard.state).toEqual('third')
            await wizard.next()
            expect(wizard.state).toEqual('fourth')
            await wizard.prev()
            expect(wizard.state).toEqual('third')
            await wizard.prev()
            expect(wizard.state).toEqual('second')
            await wizard.next()
            await wizard.next()
            await wizard.next()
            expect(wizard.state).toEqual('done')
            await wizard.prev()
            expect(wizard.state).toEqual('done')

        })

        it('should support compact syntax', async () => {
            const wizard = new FSM({
                start: 'first',
                transitions: [
                    {name: 'next', states: ['first', 'second', 'third', 'fourth', 'done']},
                    {name: 'prev', states: ['fourth', 'third', 'second', 'first']},
                ]
            })

            expect(wizard.state).toEqual('first')
            await wizard.next()
            expect(wizard.state).toEqual('second')
            await wizard.next()
            expect(wizard.state).toEqual('third')
            await wizard.next()
            expect(wizard.state).toEqual('fourth')
            await wizard.prev()
            expect(wizard.state).toEqual('third')
            await wizard.prev()
            expect(wizard.state).toEqual('second')
            await wizard.next()
            await wizard.next()
            await wizard.next()
            expect(wizard.state).toEqual('done')
            await wizard.prev()
            expect(wizard.state).toEqual('done')

        })

        it('should support very short syntax', async () => {
            const wizard = new FSM({
                start: 'first',
                transitions: [
                    'next: first > second > third > fourth > done',
                    'prev: fourth > third > second > first',
                ]
            })

            expect(wizard.state).toEqual('first')
            await wizard.next()
            expect(wizard.state).toEqual('second')
            await wizard.next()
            expect(wizard.state).toEqual('third')
            await wizard.next()
            expect(wizard.state).toEqual('fourth')
            await wizard.prev()
            expect(wizard.state).toEqual('third')
            await wizard.prev()
            expect(wizard.state).toEqual('second')
            await wizard.next()
            await wizard.next()
            await wizard.next()
            expect(wizard.state).toEqual('done')
            await wizard.prev()
            expect(wizard.state).toEqual('done')

        })

    })

})
