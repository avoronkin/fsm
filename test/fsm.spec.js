const FSM = require('../lib/fsm')

describe('FSM', () => {
    describe('door', () => {

        it('can be closed and opened', async () => {
            let hasKey = false
            const door = new FSM({
                start: 'closed',
                transitions: [
                    {action: 'open', from: 'closed', to: 'opened'},
                    {action: 'close', from: 'opened', to: 'closed'},
                    {action: 'lock', from: 'closed', to: 'locked', guard: function () { return hasKey }},
                    {action: 'unlock', from: 'locked', to: 'closed', guard: function () { return hasKey }}
                ]
            })

            expect(door.state).toEqual('closed')
            await door.open()
            expect(door.state).toEqual('opened')
            await door.lock()
            expect(door.state).toEqual('opened')
            await door.close()
            expect(door.state).toEqual('closed')
            await door.lock()
            expect(door.state).toEqual('closed')
            hasKey = true
            await door.lock()
            expect(door.state).toEqual('locked')
            await door.open()
            expect(door.state).toEqual('locked')
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
                    {action: 'open', from: 'closed', to: 'opened'},
                    {action: 'close', from: 'opened', to: 'closed'}
                ],
                methods: {
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

        it('can play, pause and stop', async () => {
            const player = new FSM({
                start: 'stopped',
                transitions: [
                    {action: 'play', from: ['stopped', 'paused'], to: 'playing'},
                    {action: 'stop', from: ['playing', 'paused'], to: 'stopped'},
                    {action: 'pause', from: 'playing', to: 'paused'},
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

})
