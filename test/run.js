module.exports = ({
    calls = 2,
    exchange,
    type = undefined,
    queue = undefined,
    pattern = undefined,
    mle = undefined
}) => {
    const allCalls = [];
    const common = {
        host: 'rabbit.k8s.softwaregroup-bg.com',
        port: 30672,
        mle,
        destination: 'exec'
    };
    const bunny = {
        exchange: {
            [exchange]: {type}
        },
        queue: {
            exec: {
                name: queue,
                bind: {
                    exchange,
                    pattern
                }
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
                                allCalls.push(params);
                                return ({result: params});
                            },
                            'bugs.calls.get': () => ({calls: allCalls})
                        }
                    }),
                    ...require('./jobs')
                ]
            })
        ],
        method: 'unit',
        config: {
            implementation: 'port-rabbit',
            test: {
                calls
            },
            bugs: {...common, exchange},
            bunny1: {...common, connection: bunny},
            bunny2: {...common, connection: bunny},
            utRun: {
                test: {
                    jobs: 'test'
                }
            }
        }
    });
};
