```javascript
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

```
