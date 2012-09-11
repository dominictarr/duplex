var Stream = require('stream')

/*
  lemmy think...

    pause() and resume() must prevent data from being emitted.

  write controls 'drain', and the return value.

  idea:

    write -> emit('write')

    on('pause') --> writePause = true
    if(writePause) --> wirte() == false
    on('drain') --> writePause = false

    pause() -> paused = true
    resume() -> paused = false, drain()
    sendData(data) -> push onto buffer or emit.
    sendEnd()      -> queue end after buffer clears.  
*/

module.exports = function (write, end) {
  var stream = new Stream() 
  var buffer = [], ended = false, destroyed = false, emitEnd
  stream.writable = stream.readable = true
  stream.paused = false
  stream.buffer = buffer
  
  stream.writePause = false
  stream
    .on('pause', function () {
      stream.writePause = true
    })
    .on('drain', function () {
      stream.writePause = false
    })
   
  function destroySoon () {
    process.nextTick(stream.destroy.bind(stream))
  }

  if(write)
    stream.on('write', write)
  if(end)
    stream.on('ended', end)

  //destroy the stream once both ends are over
  //but do it in nextTick, so that other listeners
  //on end have time to respond
  stream.once('end', function () { 
    stream.readable = false
    if(!stream.writable) {
      process.nextTick(function () {
        stream.destroy()
      })
    }
  })

  stream.once('ended', function () { 
    stream.writable = false
    if(!stream.readable)
      stream.destroy()
  })

  // this is the default write method,
  // if you overide it, you are resposible
  // for pause state.

  stream.emitData =
  stream.sendData = function (data) {
    if(!stream.paused && !buffer.length)
      stream.emit('data', data)
    else 
      buffer.push(data) 
    return !(stream.paused || buffer.length)
  }

  stream.emitEnd =
  stream.sendEnd = function (data) {
    if(data) stream.emitData(data)
    if(emitEnd) return
    emitEnd = true
    //destroy is handled above.
    stream.drain()
  }

  stream.write = function (data) {
    stream.emit('write', data)
    return !stream.writePaused
  }
  stream.end = function () {
    stream.writable = false
    if(stream.ended) return
    stream.ended = true
    stream.emit('ended')
  }
  stream.drain = function () {
    if(!buffer.length && !emitEnd) return
    //if the stream is paused after just before emitEnd()
    //end should be buffered.
    while(!stream.paused) {
      if(buffer.length) {
        stream.emit('data', buffer.shift())
        if(buffer.length == 0)
          stream.emit('read-drain')
      }
      else if(emitEnd && stream.readable) {
        stream.readable = false
        stream.emit('end')
        return
      } else {
        //if the buffer has emptied. emit drain.
        return true
      }
    }
  }
  var started = false
  stream.resume = function () {
    //this is where I need pauseRead, and pauseWrite.
    //here the reading side is unpaused,
    //but the writing side may still be paused.
    //the whole buffer might not empity at once.
    //it might pause again.
    //the stream should never emit data inbetween pause()...resume()
    //and write should return !buffer.length
    started = true
    stream.paused = false
    stream.drain() //will emit drain if buffer empties.
    return stream
  }

  stream.destroy = function () {
    if(destroyed) return
    destroyed = ended = true     
    buffer.length = 0
    stream.emit('close')
  }
  var pauseCalled = false
  stream.pause = function () {
    started = true
    stream.paused = true
    return stream
  }
  stream.paused = true
  process.nextTick(function () {
    //unless the user manually
    if(started) return
    stream.resume()
  })
 
  return stream
}

