## Finite state machine
[![Build Status](https://travis-ci.org/avoronkin/fsm.svg?branch=master)](https://travis-ci.org/avoronkin/fsm)

```javascript
describe('player', () => {

    it('can play, pause and stop', async () => {
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

```
