# UT Port Rabbit

Wrap around [amqplib], that allows messaging through RabbitMQ.

## Configuration

- `host` - passed as `hostname` to [connect]
- `port` - see [connect]
- `exchange` - Rabbit exchange, where the outgoing messages will be published,
  see [publish]
- `destination` - UT namespace, where the incoming messages will be handled
- `connection`
  - `protocol` - see [connect]
  - `vhost` - see [connect]
  - `username` - see [connect]
  - `password` - see [connect]
  - `ssl` - passed as socketOptions to [connect]
    - `cert` - the client certificate to use or `certPath` from which to load it
    - `key` - the private key or `keyPath` from which to load it
    - `ca` - the root CA to trust or `caPaths` array of strings, from which
       to load them
    - `passphrase` - the pass phrase for the `key`
  - `exchange` - Map describing exchanges to created on start.
    - `type`
    - `options` - see [assertExchange]
  - `queue` - Map describing queues to created on start.
    - `name` - optional name, otherwise unique one will be created
    - `exclusive` - see [assertQueue]
    - `durable` - see [assertQueue]
    - `autoDelete` - see [assertQueue]
    - `arguments` - see [assertQueue]
    - `bind` - bind to exchange, can be one of
      - `string` - bind without pattern
      - `object` with properties `exchange` and `pattern` -
        bind using the specified exchange and pattern

See the official [documentation] for more information.

[amqplib]: <https://www.npmjs.com/package/amqplib>
[documentation]: <https://amqp-node.github.io/amqplib/channel_api.html>
[connect]: <https://amqp-node.github.io/amqplib/channel_api.html#connect>
[publish]: <https://amqp-node.github.io/amqplib/channel_api.html#channel_publish>
[assertExchange]: <https://amqp-node.github.io/amqplib/channel_api.html#channel_assertExchange>
[assertQueue]: <https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue>
