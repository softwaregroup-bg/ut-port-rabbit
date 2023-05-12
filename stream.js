const mq = require('amqplib');
const {Duplex} = require('readable-stream');

const CONNECTION = Symbol('connection');
const CHANNEL = Symbol('channel');

const QUEUE = Symbol('queue');

class RabbitStream extends Duplex {
    constructor(config, log, streamOptions) {
        super({readableObjectMode: true, writableObjectMode: true, ...streamOptions});
        this.remoteAddress = config.host;
        this.remotePort = config.port;
        this.connect(config);
    }

    async connect({ssl, exchange, queue, ...config}) {
        try {
            const connection = await mq.connect({hostname: config.host, ...config}, ssl);
            if (this.destroyed) return connection.close();
            connection
                .on('error', error => this.destroy(error))
                .on('close', error => this.destroy(error));
            this[CONNECTION] = connection;
            const channel = await connection.createConfirmChannel();
            this[CHANNEL] = channel;
            this[QUEUE] = {};

            const handleIncoming = msg => {
                const { content, properties, fields } = msg;
                this.push([content, {...fields, ...properties}]);
                channel.ack(msg);
            };

            const entries = object => Object.entries(object || {}).filter(([, value]) => Boolean(value));

            for (const [name, { type = 'fanout', options }] of entries(exchange)) await channel.assertExchange(name, type, {autoDelete: true, options});
            for (const [name, { name: queueName, bind, ...options }] of entries(queue)) {
                this[QUEUE][name] = await channel.assertQueue(queueName || '', { exclusive: !queueName, autoDelete: true, ...options });
                await channel.consume(this[QUEUE][name].queue, handleIncoming);
                const { exchange, pattern } = (typeof bind === 'string') ? { exchange: bind } : (bind || {});
                if (exchange) {
                    await channel.checkExchange(exchange);
                    await channel.bindQueue(this[QUEUE][name].queue, exchange, pattern);
                }
            }

            this.emit('connect');
            return connection;
        } catch (e) {
            this.destroy(e);
        }
    }

    _destroy(error, callback) {
        const close = async what => {
            if (this[CONNECTION] && this[what]) {
                await this[what].close();
            }
            delete this[what];
        };

        return close(CHANNEL)
            .then(() => close(CONNECTION))
            .then(() => callback(error))
            .catch(err => callback(error || err));
    }

    async _write([payload, {type, exchange, routingKey, replyTo, ...options}], encoding, callback) {
        if (exchange) {
            try {
                await this[CHANNEL].checkExchange(exchange);
            } catch (error) {
                callback(error);
                return;
            }
        }
        if (['error', 'response'].includes(type)) {
            exchange = '';
            routingKey = replyTo;
        }
        this[CHANNEL].publish(exchange, routingKey, payload, {
            type,
            appId: 'ut',
            ...options,
            timestamp: Date.now(),
            ...(type === 'request') && {replyTo: this[QUEUE].reply?.queue}
        }, callback);
    }

    _final(cb) {
        this.destroy(undefined, cb);
    }

    _read() {
        //
    }

    unref() {
        //
    }
}

module.exports = {connect: config => new RabbitStream(config)};
