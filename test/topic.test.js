require('./run')({
    exchange: 'ut-port-rabbit-topic',
    type: 'topic',
    pattern: 'bugs.*.*'
});
