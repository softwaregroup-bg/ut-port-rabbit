# UT Port Rabbit

Wrap around [amqplib], that allows messaging through RabbitMQ.

## Configuration

- `host`
- `port`
- `exchange` - Rabbit exchange, where the outgoing messages will be sent by default
- `destination` - UT namespace, where the incoming messages will be handled
- `connection`
  - `protocol`
  - `vhost`
  - `username`
  - `password`
  - `ssl`
    - `cert`
    - `key`
    - `passphrase`
  - `exchange` - Map describing exchanges to created on start.
    - `type`
    - `options`
  - `queue` - Map describing queues to created on start.
    - `name` - optional name, otherwise unique one will be created
    - `bind` - bind to exchange, can be one of
      - `string` - bind without pattern
      - `object` with properties `exchange` and `pattern` to
        bind using the specified exchange and pattern

See the official [documentation] for more information.

[amqplib]: <https://www.npmjs.com/package/amqplib>
[documentation]: <https://amqp-node.github.io/amqplib/channel_api.html>
