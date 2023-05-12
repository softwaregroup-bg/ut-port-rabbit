'use strict';
const uuid = require('uuid').v1;
const errors = require('./errors.json');
const stream = require('./stream');
const { importJWK } = require('jose');
const joseFactory = require('ut-bus/jose');

const codec = (mle, port) => function rabbitCodec({prefix}) {
    return {
        encode: async(object, $meta, context, log) => {
            const options = {};
            if ($meta.mtid === 'request') {
                const trace = Buffer.alloc(24, (prefix || '').padEnd(24));
                uuid({}, trace.slice(8));
                $meta.trace = trace.toString('hex');
                $meta.timeout = port.timing.after(port.config.timeout);
                Object.assign(options, {
                    expiration: port.config.timeout
                });
            }
            if (typeof object === 'string') {
                Object.assign(options, {
                    contentEncoding: 'utf-8'
                });
            } else if (!Buffer.isBuffer(object)) {
                object = JSON.stringify(object);
                Object.assign(options, {
                    contentType: 'application/json',
                    contentEncoding: 'utf-8'
                });
            }

            if (mle.signEncrypt) object = await mle.signEncrypt(object);

            const {method: routingKey, mtid: type, trace: correlationId, amqp} = $meta;
            const message = [Buffer.from(object), {
                correlationId,
                type,
                routingKey,
                exchange: port.config.exchange || '',
                ...amqp,
                ...options
            }];
            if (log && log.trace) {
                log.trace({
                    $meta: {mtid: 'frame', method: 'rabbit.encode'},
                    message: message[0],
                    options: message[1],
                    log: context && context.session && context.session.log
                });
            }
            return message;
        },
        decode: async(message, $meta, context, log) => {
            if (log && log.trace) {
                log.trace({
                    $meta: {mtid: 'frame', method: 'rabbit.decode'},
                    message: message[0],
                    options: message[1],
                    log: context && context.session && context.session.log
                });
            }

            if (mle.decryptVerify) message[0] = await mle.decryptVerify(message[0]);

            const [
                msg,
                {
                    type: mtid,
                    correlationId: trace,
                    routingKey: method = port.config.destination + '/exec',
                    ...amqp
                }
            ] = message;
            Object.assign($meta, {
                mtid,
                trace,
                method: method.includes('/') ? method : `${port.config.destination}/${method}`,
                amqp
            });
            return (amqp.contentType || amqp.contentEncoding)
                ? (string => amqp.contentType === 'application/json' ? JSON.parse(string) : string)(msg.toString(amqp.contentEncoding || 'utf-8'))
                : msg;
        }
    };
};

module.exports = function({registerErrors}) {
    const mle = {};
    return class RabbitPort extends require('ut-port-tcp')(...arguments) {
        get defaults() {
            return function defaults() {
                return {
                    type: 'rabbit',
                    listen: false,
                    host: '127.0.0.1',
                    port: 5672,
                    socketTimeOut: 0,
                    timeout: 15000,
                    maxReceiveBuffer: -1,
                    connection: {
                        queue: {
                            reply: {}
                        }
                    },
                    client: stream,
                    format: {
                        prefix: 'ut',
                        codec: codec(mle, this)
                    }
                };
            };
        }

        get schema() {
            return {
                type: 'object',
                properties: {
                    destination: {
                        type: 'string',
                        minLength: 1
                    },
                    exchange: {
                        type: 'string'
                    },
                    connection: {
                        type: 'object',
                        properties: {
                            protocol: {
                                type: 'string',
                                enum: ['amqp', 'amqps']
                            },
                            vhost: {
                                type: 'string'
                            },
                            username: {
                                type: 'string'
                            },
                            password: {
                                type: 'string'
                            },
                            ssl: {
                                type: 'object',
                                properties: {
                                    cert: {
                                        type: 'string'
                                    },
                                    key: {
                                        type: 'string'
                                    },
                                    passphrase: {
                                        type: 'string'
                                    }
                                }
                            },
                            exchange: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        enum: ['fanout', 'direct']
                                    },
                                    options: {
                                        type: 'object'
                                    }
                                }
                            },
                            queue: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string'
                                    },
                                    bind: {
                                        oneOf: [{
                                            type: 'string'
                                        }, {
                                            type: 'object',
                                            properties: {
                                                exchange: {
                                                    type: 'string'
                                                },
                                                pattern: {
                                                    type: 'string'
                                                }
                                            }
                                        }]
                                    }
                                }
                            }
                        }
                    }
                },
                required: ['connection', 'destination']
            };
        }

        get uiSchema() {
            return {
                connection: {
                    password: {
                        'ui:widget': 'password'
                    },
                    ssl: {
                        passphrase: {
                            'ui:widget': 'password'
                        }
                    }
                }
            };
        }

        async init(...params) {
            const result = await super.init(...params);
            Object.assign(this.errors, registerErrors(errors));
            if (this.config.mle) {
                const { sign, encrypt, decrypt, verify, protectedHeader } = this.config.mle;
                const mlsk = await importJWK(encrypt);
                const mlek = await importJWK(verify);
                const {signEncrypt, decryptVerify} = await joseFactory({sign, encrypt: decrypt});
                mle.signEncrypt = async message => {
                    const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message);
                    const jwe = await signEncrypt(buffer, mlsk, protectedHeader, undefined, {
                        sign: {
                            serialization: 'compact'
                        },
                        encrypt: {
                            serialization: 'compact'
                        }
                    });
                    return Buffer.isBuffer(message) ? Buffer.from(jwe) : jwe;
                };
                mle.decryptVerify = async encrypted => {
                    let jwe = encrypted.toString();
                    try {
                        // try parsing in case it is general or flattened encryption
                        jwe = JSON.parse(jwe);
                    } catch (e) {
                        // might be compact encryption
                    }
                    const decrypted = JSON.stringify(await decryptVerify(jwe, mlek));
                    return Buffer.isBuffer(encrypted) ? Buffer.from(decrypted) : decrypted;
                };
            }
            return result;
        }
    };
};
