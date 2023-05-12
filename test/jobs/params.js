module.exports = function test() {
    return {
        params: function(test, bus, run) {
            return run(test, bus, [{
                method: 'bugs.foo.test',
                params: {
                    test: 1
                },
                result(result, assert) {
                    assert.match({result: {test: 1}}, result, 'result');
                }
            }, {
                method: 'bugs.calls.get',
                params: {},
                result(result, assert) {
                    assert.comment(result);
                    assert.same(result.calls.length, 2, 'expect 2 calls');
                }
            }]);
        }
    };
};
