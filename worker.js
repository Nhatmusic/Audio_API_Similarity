importScripts("./assets/js/tsne.js");
onmessage = function(e){
    const inputs = e.data;
    inputs.dim = 2; // dimensionality of the embedding (2 = default)
    const tsne = new tsnejs.tSNE(inputs); // create a tSNE instance
    tsne.initDataRaw(inputs.dataset);

    let Log_TSNE = function(iteration) {
        // noinspection JSConstructorReturnsPrimitive
        return "Data Size: " + inputs.dataset.length +
            "<br>Learning Rate: " + inputs.epsilon +
            "<br>Perplexity: " + inputs.perplexity +
            "<br>Iteration: " + iteration;
    };
    for(var k = 0; k < inputs.iterations; k++) {
        tsne.step(); // every time you call this, solution gets better
        Updated_TSNE(tsne.getSolution(),Log_TSNE(k+1));
    }

// Tell the worker container in the main thread that the TSNE solution has been updated
    function Updated_TSNE(tsneOutput, strMessage) {
        postMessage({status:"TSNE_Updated", content:tsneOutput, logMessage:strMessage});
    }
    // postMessage(tsne.getSolution());
}
