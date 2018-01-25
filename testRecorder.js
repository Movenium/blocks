

module.exports.saveRecordingToFile = (state, response, blockListToTest) => {

    if (!tools.get(state, "_recording")) return;

    if (!blockListToTest) throw new Error("Only support type for test recording is yml for now");

    const stream = fs.createWriteStream(tools.get(state, "_recording"));

    if (!state._recorded) state._recorded = {};

    state._recorded.response = response;

    if (tools.get(state, 'event')) state._recorded.event = tools.get(state, 'event');

    const testarray = [
        {
            "data > _recorded": {data: tools.get(state, "_recorded")}
        },
        {
            "data > event": {
                "data": "$_recorded.event"
            }
        },
        blockListToTest,
        {
            "test": {
                "default": "$_recorded.response"
            }
        }
    ];


    stream.once('open', function(fd) {
        stream.write(JSON.stringify(testarray));
        stream.end();
    });
}