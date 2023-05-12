require('./run')({
    exchange: 'ut-port-rabbit-balance',
    queue: 'ut-port-rabbit-balance-queue',
    calls: 1
});
