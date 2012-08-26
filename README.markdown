# duplex

<img src=https://secure.travis-ci.org/dominictarr/duplex.png?branch=master>


Simple base class for [duplex](https://github.com/dominictarr/stream-spec#duplex) streams, that automatically handles pausing and buffering.

``` js

var duplex = require('duplex')

var d = duplex()
  .on('write', function (data) {
    d.sendData(data)
  })
  .on('ended', function () {
    d.sendEnd()
  })
```

## API

### on('write', function (data))

Emitted when `write(data)` is called.

### on('ended', function ())

Emitted when `end()` is called

### sendData(data)

Add `data` to the output buffer. 
`'data'` will be emitted if there the stream is not paused.

### sendEnd()

Emit `'end'` after the output buffer drains.  
Will be emitted immediately, it the buffer is empty.

### pause()

Set the readable side of the stream into paused state.  
This will prevent it from emitting 'data' or or 'end'
until resume is called.

### resume()
Set the reabable side of the stream into the unpaused state.  
This will allow it to emit `'data'` and `'end'` events.  
If there there is any data in the output buffer,  
It will start draining immediately.  

## Automatic Behaviours

`destroy()` is called automitically after both sides of the stream has ended.
`write()==false` after the stream emits `'pause'`,  
and `write()==true` after the stream emits `'drain'`.
The user is responsible for emitting `'pause'` and `'drain'`.

The stream will call `resume()` in the next tick, unless `pause()` is called manually.
if `resume()` is manually called before the next tick, the stream will start emitting data
immediately.

## License

MIT / APACHE 2
