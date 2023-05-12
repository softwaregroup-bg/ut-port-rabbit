const calls = [];
const common = {
    host: 'rabbit.k8s.softwaregroup-bg.com',
    port: 30672,
    destination: 'exec'
};
const bunny = {
    exchange: {
        'ut-port-rabbit-fanout': {}
    },
    queue: {
        exec: {
            bind: 'ut-port-rabbit-fanout'
        }
    }
};

require('ut-run').run({
    main: [
        () => ({
            test: () => [
                (...params) => class bugs extends require('../')(...params) {},
                (...params) => class bunny1 extends require('../')(...params) {},
                (...params) => class bunny2 extends require('../')(...params) {},
                require('ut-function.dispatch')({
                    namespace: 'exec/bugs',
                    methods: {
                        'bugs.foo.test': params => {
                            calls.push(params);
                            return ({result: params});
                        },
                        'bugs.calls.get': () => ({calls})
                    }
                }),
                ...require('./jobs')
            ]
        })
    ],
    method: 'unit',
    config: {
        implementation: 'port-rabbit',
        test: true,
        bugs: {...common, exchange: 'ut-port-rabbit-fanout'},
        bunny1: {...common, connection: bunny},
        bunny2: {...common, connection: bunny},
        utRun: {
            test: {
                jobs: 'test'
            }
        }
    }
});
