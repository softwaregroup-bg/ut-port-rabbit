module.exports = function test({config: {calls = 2}}) {
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
                    assert.same(result.calls.length, calls, `expect ${calls} calls`);
                }
            }]);
        }
    };
};
