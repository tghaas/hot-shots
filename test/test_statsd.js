var dgram = require('dgram'),
    assert = require('assert'),
    StatsD = require('../').StatsD;

/**
 * Creates a test harness, that binds to an ephemeral port
 * @param test {Function} The test to run, should take message as the argument
 * @param callback {Function} The callback to call after the server is listening
 * @private
 */
function udpTest(test, callback){
  var server = dgram.createSocket("udp4");
  server.on('message', function(message){
    test(message.toString());
    server.close();
  });

  server.on('listening', function(){
    callback(server);
  });

  server.bind(0, '127.0.0.1');
}

/**
 * Since sampling uses random, we need to patch Math.random() to always give
 * a consisten result
 */
var oldRandom = Math.random;
Math.random = function(){
  return 0.42;
};


describe('StatsD', function(){
  describe('#init', function(){
    it('should set a default values when not specified', function(){
      var statsd = new StatsD();
      assert.equal(statsd.host, 'localhost');
      assert.equal(statsd.port, 8125);
      assert.equal(statsd.prefix, '');
      assert.equal(statsd.suffix, '');
    });

    it('should set the proper values when specified', function(){
      var statsd = new StatsD('host', 1234, 'prefix', 'suffix');
      assert.equal(statsd.host, 'host');
      assert.equal(statsd.port, 1234);
      assert.equal(statsd.prefix, 'prefix');
      assert.equal(statsd.suffix, 'suffix');
    });

    it('should create a global variable set to StatsD() when specified', function(){
      var statsd = new StatsD('host', 1234, 'prefix', 'suffix', true);
      assert.ok(global.statsd instanceof StatsD);
      //remove it from the namespace to not fail other tests
      delete global.statsd;
    });

    it('should not create a global variable when not specified', function(){
      var statsd = new StatsD('host', 1234, 'prefix', 'suffix');
      assert.equal(global.statsd, undefined);
    });

    it('should create a socket variable that is an instance of dgram.Socket', function(){
      var statsd = new StatsD();
      assert.ok(statsd.socket instanceof dgram.Socket);
    });
  });

  describe('#timing', function(finished){
    it('should send proper time format without prefix, suffix, sampling and callback', function(finished){
      udpTest(function(message){
        assert.equal(message, 'test:42|ms');

        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port);

        statsd.timing('test', 42);
      });
    });

    it('should send proper time format with prefix, suffix, sampling and callback', function(finished){
      var called = false;
      udpTest(function(message){
        assert.equal(message, 'foo.test.bar:42|ms|@0.5');
        assert.equal(called, true);
        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port, 'foo.', '.bar');

        statsd.timing('test', 42, 0.5, function(){
          called = true;
        });
      });
    });
  });

  describe('#gauge', function(finished){
    it('should send proper gauge format without prefix, suffix, sampling and callback', function(finished){
      udpTest(function(message){
        assert.equal(message, 'test:42|g');

        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port);

        statsd.gauge('test', 42);
      });
    });

    it('should send proper gauge format with prefix, suffix, sampling and callback', function(finished){
      var called = false;
      udpTest(function(message){
        assert.equal(message, 'foo.test.bar:42|g|@0.5');
        assert.equal(called, true);
        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port, 'foo.', '.bar');

        statsd.gauge('test', 42, 0.5, function(){
          called = true;
        });
      });
    });
  });

  describe('#increment', function(finished){
    it('should send count by 1 when no params are specified', function(finished){
      udpTest(function(message){
        assert.equal(message, 'test:1|c');

        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port);

        statsd.increment('test');
      });
    });

    it('should send proper count format with prefix, suffix, sampling and callback', function(finished){
      var called = false;
      udpTest(function(message){
        assert.equal(message, 'foo.test.bar:42|c|@0.5');
        assert.equal(called, true);
        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port, 'foo.', '.bar');

        statsd.increment('test', 42, 0.5, function(){
          called = true;
        });
      });
    });
  });

  describe('#decrement', function(finished){
    it('should send count by -1 when no params are specified', function(finished){
      udpTest(function(message){
        assert.equal(message, 'test:-1|c');

        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port);

        statsd.decrement('test');
      });
    });

    it('should send proper count format with prefix, suffix, sampling and callback', function(finished){
      var called = false;
      udpTest(function(message){
        assert.equal(message, 'foo.test.bar:-42|c|@0.5');
        assert.equal(called, true);
        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port, 'foo.', '.bar');

        statsd.decrement('test', 42, 0.5, function(){
          called = true;
        });
      });
    });
  });

  describe('#set', function(finished){
    it('should send proper set format without prefix, suffix, sampling and callback', function(finished){
      udpTest(function(message){
        assert.equal(message, 'test:42|s');

        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port);

        statsd.set('test', 42);
      });
    });

    it('should send proper set format with prefix, suffix, sampling and callback', function(finished){
      var called = false;
      udpTest(function(message){
        assert.equal(message, 'foo.test.bar:42|s|@0.5');
        assert.equal(called, true);
        finished();
      }, function(server){
        var address = server.address(),
            statsd = new StatsD(address.address, address.port, 'foo.', '.bar');

        statsd.unique('test', 42, 0.5, function(){
          called = true;
        });
      });
    });
  });

});