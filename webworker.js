let w;
function startWorker(data){
    if(typeof(Worker)!== "undefined"){
        if(w===undefined){
            w = new Worker('worker.js');
            w.postMessage(data);
            console.log(data)
        }
        w.onmessage = function (event){
            if (event.data.status === "alert") {
                alert(event.data.content);
            } else if (event.data.status === "TSNE_Updated") {
                Initial_Scatterplot(event.data.content)
                d3.select("#textDiv").html(event.data.logMessage);
            }
        };
    }
    else{
        throw "Browser doesn't support web worker";
    }
}
