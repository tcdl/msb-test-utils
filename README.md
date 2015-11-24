# msb-test-utils [![Build Status](https://travis-ci.org/tcdl/msb-test-utils.svg)](https://travis-ci.org/tcdl/msb-test-utils)
Testing utility modules for [MSB](https://github.com/tcdl/msb) implementers.

## mockResponderFactory

```js
var mockResponderFactory = require('msb-test-utils/mockResponderFactory');
```

### mockResponderFactory.create(msb, options[, channelManager])

Sets up a new responder using the provided options and optional channelManager and returns an API for setting up mock responses.

- **msb** Object E.g. `require('msb')`
- **options** See [msb.Responder.createEmitter()](https://github.com/tcdl/msb#respondercreateemitteroptions-channelmanager)
- **channelManager** Optional See [msb.Responder.createEmitter()](https://github.com/tcdl/msb#respondercreateemitteroptions-channelmanager).

Example:

```js
  msb.configure({ brokerAdapter: 'local' });

  mockResponderFactory.create({
    namespace: 'test:topic'
  });
```

### mockResponder.respondWith(responseArr)

Adds response instructions for one request. Repeat for each expected request.

- **responseArr** Array Instructions for responses to a request.
  - **waitMs** Optional Integer Milliseconds to wait before publishing this response.
  - **type** Optional String ('ack'|'payload') The type of response to provide (Default: 'payload')
  - **timeoutMs** Optional For ack instructions only - see [responder.sendAck](https://github.com/tcdl/msb#respondersendacktimeoutms-responsesremaining-cb).
  - **responsesRemaining** Optional For ack instructions only - see [responder.sendAck](https://github.com/tcdl/msb#respondersendacktimeoutms-responsesremaining-cb).
  - **payload** Optional For payload instructions only - see [responder.send](https://github.com/tcdl/msb#respondersendpayload-cb).

Example:

```js
  mockResponder
  .respondWith([
    { type: 'ack', timeoutMs: 2000 },
    { waitMs: 1000, payload: { ... } }
  ]) // Responses to first request
  .respondWith([
    { payload: { ... } }
  ]) // Responses to second request
```

### mockResponder.end()

Stops the responder from listening for requests and clears all timeouts, commonly put in an `afterEach` block.
