'use strict';
/* Setup */
var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var expect = Code.expect;

/* Modules */
var simple = require('simple-mock');
var msb = require('msb');
var mockResponderFactory = require('../mockResponderFactory');

describe('mockResponderFactory', function() {
  var channelManager;
  var testNamespace;
  var mockResponder;
  var testRequester;
  var onError;
  var onAck;
  var onResponse;
  var onEnd;

  before(function(done) {
    msb.configure({
      brokerAdapter: 'local'
    });

    testNamespace = 'test:name:space';
    done();
  });

  beforeEach(function(done) {
    onError = simple.mock();
    onAck = simple.mock();
    onResponse = simple.mock();
    onEnd = simple.mock();

    mockResponder = mockResponderFactory.create({
      namespace: testNamespace
    });

    testRequester = new msb.Requester({
      namespace: testNamespace,
      waitForResponsesMs: 1000
    })
    .on('error', onError)
    .on('response', onResponse)
    .on('end', onEnd);

    done();
  });

  afterEach(function(done) {
    mockResponder.end();
    simple.restore();
    done();
  });

  describe('for a single request', function() {
    it('can register the incoming request', function(done) {
      testRequester.publish({
        body: 'a'
      });

      setImmediate(function() {
        expect(mockResponder.requests.length).equals(1);
        expect(mockResponder.requests[0].payload.body).equals('a');
        expect(onResponse.callCount).equals(0);
        done();
      });
    });

    it('can send a single response', function(done) {
      mockResponder.respondWith([{
        payload: {
          body: 'response'
        }
      }]);

      testRequester.publish({
        body: 'request'
      });

      setImmediate(function() {
        expect(mockResponder.requests.length).equals(1);
        expect(mockResponder.requests[0].payload.body).equals('request');
        expect(onResponse.callCount).equals(1);
        expect(onResponse.lastCall.args[1].payload.body).equals('response');
        done();
      });
    });

    it('can send a delayed response', function(done) {
      mockResponder.respondWith([{
        payload: {
          body: 'response'
        },
        waitMs: 150
      }]);

      testRequester.publish({
        body: 'request'
      });

      setImmediate(function() {
        expect(mockResponder.requests.length).equals(1);
        expect(mockResponder.requests[0].payload.body).equals('request');
        expect(onResponse.callCount).equals(0);
      });

      setTimeout(function() {
        expect(onResponse.callCount).equals(1);
        expect(onResponse.lastCall.args[1].payload.body).equals('response');
        done();
      }, 300);
    });

    it('can respond with multiple responses', function(done) {
      mockResponder.respondWith([
        {
          payload: {
            body: 'responseA'
          }
        },
        {
          payload: {
            body: 'responseB'
          }
        }
      ]);

      testRequester.publish({
        body: 'request'
      });

      setImmediate(function() {
        expect(mockResponder.requests.length).equals(1);
        expect(mockResponder.requests[0].payload.body).equals('request');
        expect(onResponse.callCount).equals(2);
        expect(onResponse.calls[0].args[1].payload.body).equals('responseA');
        expect(onResponse.calls[1].args[1].payload.body).equals('responseB');
        done();
      });
    });

    it('can ack and then respond with delay beyond the default', function(done) {
      mockResponder.respondWith([
        {
          type: 'ack',
          timeoutMs: 1200
        },
        {
          payload: {
            body: 'response'
          },
          waitMs: 1100
        }
      ]);

      testRequester.publish({
        body: 'request'
      });

      setImmediate(function() {
        expect(mockResponder.requests.length).equals(1);
        expect(mockResponder.requests[0].payload.body).equals('request');
        expect(onResponse.callCount).equals(0);
      });

      setTimeout(function() {
        expect(mockResponder.requests[0].payload.body).equals('request');
        expect(onResponse.callCount).equals(1);
        expect(onResponse.calls[0].args[1].payload.body).equals('response');
        done();
      }, 1500);
    });
  });
});

