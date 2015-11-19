var async = require('async');
var msb = require('msb');

var mockResponder = exports;

mockResponder.create = function (config, channelManager) {
  var requests = [];
  var stack = [];
  var waitTimeouts = [];
  var emitter = msb.Responder.createEmitter(config, channelManager);

  var i = 0;
  emitter.on('responder', function (responder) {
    requests.push(responder.originalMessage);

    var responses = stack[i++];

    if (!responses) return;

    async.eachSeries(responses, function (response, next) {
      function respond () {
        if (response.type === 'ack') {
          return responder.sendAck(response.timeoutMs,
            response.responsesRemaining, next);
        }
        responder.send(response.payload, next);
      }

      if (response.waitMs) {
        waitTimeouts.push(setTimeout(respond, response.waitMs));
      } else {
        respond();
      }
    }, function () {});
  });

  return {
    requests: requests,
    respondWith: function (responses) {
      stack.push(responses);
      return this;
    },
    end: function () {
      waitTimeouts.forEach(clearTimeout);
      emitter.end();
    }
  };
};
