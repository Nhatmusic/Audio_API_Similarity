// setup init variables
var mfcc = [];
var rms = 0;
var featureType = 'mfcc';
var featureType2 = 'rms';
var origin_data1 = [];
var total_origin_data=[];
var windowsize = 4096;
var total_self_similarity_data = [];
var durations = 4 ;
var audio_label = [];
var all_canvas_image = [];
var audio_statistic = [];
var data_min=[];
var perplexity_value;
var iterations_value;

//get file directory
window.onload = function () {
    d3.select("#loader").style("display", "none");
    document.getElementById("filepicker").addEventListener("change", function (event) {
        let files = event.target.files;
        fileContent = [];
        for (i = 0; i < files.length; i++) {
            audio_label.push(files[i].name)
            fileContent.push(URL.createObjectURL(files[i]));
        }
        getData(fileContent[0], 0)
    }, false);

}

//set up configuration for t-sne
// function getinputduration(value) {
//     return durations = parseInt(value);
// }
var get_durations = document.getElementById("duration")
get_durations.onchange = function () {
    durations=parseInt(this.value)
    console.log(durations)
}
var perplexity = document.getElementById("myRange1");
var iterations = document.getElementById("myRange2");
var output_perplexity = document.getElementById("perplexity_output");
var output_iterations = document.getElementById("iteration_output");
perplexity_value=perplexity.value;
iterations_value=iterations.value

    perplexity.oninput = function() {
    output_perplexity.value= this.value;
    perplexity_value = this.value;
}

iterations.oninput = function() {
    output_iterations.value = this.value;
    iterations_value = this.value;
}



function getData(a, index) {
    //Create audioContext to decode the audio data later
    var audioCtx = new AudioContext();
    //Create source as a buffer source node which contains the audio data after decoding
    var source = audioCtx.createBufferSource();
    //use XMLHttpRequest to load audio track
    var request = new XMLHttpRequest();
    //Open audio file
    request.open('GET', a, true);
    //The response is a JavaScript ArrayBuffer containing binary data.
    request.responseType = 'arraybuffer';
    //return the audio data to audioData variable type arraybuffer
    request.onload = function () {
        d3.select("#loader").style("display", "block");
        audioData = request.response;
        //decode the audio data from array buffer and stored to AudioBufferSourceNode
        audioCtx.decodeAudioData(audioData, function (buffer) {
            //store data to buffer source node
            source.buffer = buffer;
            //find the duration of the audio in second after decoding
            var duration1 = 0;
            duration1 = source.buffer.duration;
            if (duration1 > durations) {
                fileContent.splice(index, 1)
                audio_label.splice(index, 1)
                if (index == fileContent.length) {
                    var index1 = 0
                    //draw self_similarity matrix1
                    drawmatrix(total_self_similarity_data[index1], index1);
                } else {
                    getData(fileContent[index], index)
                }
            } else {
                //create offline audio context to render the decoding audio data then use the offline audio context and another audio buffer source node as inputs to Meyda Analyzer
                var offlineCtx = new OfflineAudioContext(1, 44100 * duration1, 44100);
                //create buffer source node which is used in Meyda Analyzer
                var source11 = offlineCtx.createBufferSource();
                //store the audio data to the buffer source node again
                source11.buffer = buffer;
                //connect the source node to offline audio context then go to Meyda Analyzer
                source11.connect(offlineCtx.destination);
                //start the buffer source node
                source11.start();
                //Create Meyda analyzer and set up the parameter
                meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
                    'audioContext': offlineCtx,
                    'source': source11,
                    'melBands': 26,
                    'sampleRate': 44100,
                    'bufferSize': windowsize,
                    'hopSize': windowsize / (durations / duration1),
                    'numberOfMFCCCoefficients': 20,
                    'featureExtractors': [featureType, featureType2],
                    'callback': show1
                });
                //start Meyda Analyzer
                meydaAnalyzer1.start();
                var hop = Meyda.hopSize;
                var buf = Meyda.bufferSize;
                var dur = duration1;
                audio_statistic.push({duration: dur, bufferSize: buf, hopSize: hop})
                //Using offline audio context to render audio data
                offlineCtx.startRendering();
                //After complete rendering, performing the following steps
                offlineCtx.oncomplete = function (e) {
                    //copy the data generated from Meyda Analyzer 1
                    var matrix1 = [];
                    var mean_data=[];
                    //origin_data1 is generated from function show1 of Meyda Analyzer 1
                    var matrix1 = origin_data1;
                     total_origin_data.push(origin_data1)
                    //Create self_similarity data based on origin_data by calculate Euclidean distance between each pair of data point of origin_data
                    var matrix11 = [];
                    var matrix11 = predata(matrix1, index);
                    ++index;
                    if (index < fileContent.length) {
                        origin_data1 = [];
                        getData(fileContent[index], index)
                    } else if (index == fileContent.length) {
                        var index1 = 0
                        //draw self_similarity matrix1
                        drawmatrix(total_self_similarity_data[index1], index1);
                    }
                }
            }
        }).catch(function (err) {
            console.log('Rendering failed: ' + err);
            // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
        });
    };
    request.send();
    return 0;
}
 function data_preprocess(origin_data){
    if (origin_data.length%2!=0) {
        origin_data=origin_data.slice(0,origin_data.length-1)
    }
        const reducer = (accumulator, currentValue) => math.add(accumulator, currentValue);
        var mean = [];
        var standardeviation = [];
        var mean_std = [];
        var difference1 = [];
        var difference2 = []
        var t_sne_data = [];
        var t_sne_data_extra = [];
        var origin_data_unzip = []
        origin_data_unzip = _.unzip(origin_data);
        origin_data_unzip.forEach(function (d) {
            mean.push(math.mean(d));
            standardeviation.push(math.std(d))
        })
     var std_difference1=[];
        var std_difference2=[];
        for (i=0; i< origin_data_unzip.length; i++) {
            for (k = 0; k < origin_data_unzip[0].length; k += 2) {
                std_difference1.push(math.subtract(origin_data_unzip[i][k],origin_data_unzip[i][k+1]))
            }
            std_difference2.push(math.std(std_difference1));
            // console.log(std_difference2)
        }
        mean_std=mean.concat(standardeviation)
        for (i = 0; i < origin_data.length; i += 2) {
            difference1.push(nj.subtract(origin_data[i], origin_data[i + 1]).tolist());
        }
        difference2 = difference1.reduce(reducer)

    t_sne_data_extra=mean_std.concat(difference2);

     // return t_sne_data= t_sne_data_extra.concat(std_difference2)
     return t_sne_data_extra;
        console.log("tala:" +t_sne_data)
 }

//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function show1(features) {
    mfcc = features[featureType];
    rms = features[featureType2];
    if (rms != 0) {
        origin_data1.push(mfcc)
    }
}

//function to process the origin_data to self_similarity data by comparing euclidean distance of every pair of data point
function predata(origin_data, index) {
    console.log('pre')
    // data normalization
    var normalized_data = [];
    for (var i = 0; i < origin_data.length; i++) {
        var data1 = [];
        var average = math.mean(origin_data[i]);
        for (var j = 0; j < origin_data[0].length; j++) {
            data1.push((origin_data[i][j] - average) / math.norm(origin_data[i][j] - average));
        }
        normalized_data.push(data1);
    }
    //calculate euclidean distance between two mfcc vector->create self similarity matrix
    var self_similarity_data = [];
    for (var i = 0; i < normalized_data.length; i++) {
        var data2 = [];
        for (var j = 0; j < normalized_data.length; j++) {
            // data2.push(euclideanDistance(normalized_data[i], normalized_data[j]))
            data2.push(math.multiply(normalized_data[i], normalized_data[j]) / (math.norm(normalized_data[i]) * math.norm(normalized_data[j])));
        }
        self_similarity_data.push(data2);
    }
    self_similarity_data.index = index;
    total_self_similarity_data.push(self_similarity_data)
    return self_similarity_data;
}

function euclideanDistance(a, b) {
    var sum = 0;
    if (a.length == b.length) {

        sum = distance(a, b);
        //if 2 vector does not have the same data lenthg, fill 0 to the rest of smaller dimension vector
    } else if (a.length < b.length) {
        a = a.concat(Array(b.length - a.length).fill(0))
        sum = distance(a, b);

    } else {
        b = b.concat(Array(a.length - b.length).fill(0))

        sum = distance(a, b)

    }
    return sum
}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function drawmatrix(self_similarity_data, index1) {
    console.log('draw')
    //scale the self_similarity data value to draw
    var CSM22 = d3.scale.linear()
        .domain([math.min(total_self_similarity_data), math.max(total_self_similarity_data)])
        .range([0, 1]);
    var scaled_self_similarity_data = [];
    for (var i = 0; i < self_similarity_data.length; i++) {
        var CSM44 = [];
        for (var j = 0; j < self_similarity_data[0].length; j++) {
            CSM44.push(CSM22(self_similarity_data[i][j]))
        }
        scaled_self_similarity_data.push(CSM44);
    }
    //Create color data from scaled_self_similarity_data
    var color_data = [];
    for (var i = 0; i < scaled_self_similarity_data.length; i++) {
        var data3 = [];
        for (var j = 0; j < scaled_self_similarity_data[0].length; j++) {
            //get R G B value after convert scaled self similarity data to HSL color scale
            data3.push(d3.rgb(d3.hsl(scaled_self_similarity_data[i][j] * 257, 1, 0.5)));
        }
        color_data.push(data3);
    }
    var c = document.getElementById("myCanvas");
    c.width = color_data.length;
    c.height = color_data.length;
    var ctx = c.getContext("2d");
    // define the size of image
    var imgData = ctx.createImageData(color_data[0].length, color_data.length);
    //draw each pixel, one pixel contain 4 values (R G B A),
    for (var i = 0; i < color_data.length; i++) {
        for (var j = 0; j < color_data[0].length; j++) {
            //each step is 4, the next pixel value have index in position 4 5 6 7,
            var pos = (i * color_data[0].length + j) * 4;
            imgData.data[pos + 0] = color_data[i][j].r;
            imgData.data[pos + 1] = color_data[i][j].g;
            imgData.data[pos + 2] = color_data[i][j].b;
            imgData.data[pos + 3] = 255;
        }
    }
    //define where to put the image in canvas
    ctx.putImageData(imgData, 0, 0);
    //save canvas to png image then call back to use in network diagram
    var imagedata = c.toDataURL("image/png").replace("image/png", "image/octet-stream");
    all_canvas_image.push(imagedata);

    //clear canvas everytime draw matrix
    ctx.clearRect(0, 0, 100, 100);
    ++index1;
    if (index1 < fileContent.length) {

        drawmatrix(total_self_similarity_data[index1], index1)
    }
    console.log("I am calculating the distance");
    if (index1 == (fileContent.length - 1)) {
        alert('Song Loading Completed')
        d3.select("#loader").style("display", "none");
        drawLegend()
    }

}

function calculate_tsne(){
    var total_pre_process_data=[];
    total_origin_data.forEach(d=>{
        total_pre_process_data.push(data_preprocess(d))});
    data_min=total_pre_process_data;
    fileContent.forEach((d,i)=>{
    data_min[i].url=d;
    data_min[i].info=audio_statistic[i];
        })
    getcluster(data_min)
    // startWorker(total_pre_process_data,Initial_Scatterplot,getcluster)
    startWorker({dataset:total_pre_process_data,
        epsilon: 10,        // epsilon is learning rate (10 = default)
        perplexity: perplexity_value,    // roughly how many neighbors each point influences (30 = default)
        iterations: iterations_value})

}

//initiate scatter plot for tsne
const width = 450, height = 350,
    margin = {left: 20, top: 20, right: 20, bottom: 20},
    contentWidth = width - margin.left - margin.right,
    contentHeight = height - margin.top - margin.bottom;

const svg = d3.select("#theGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const scatterplot = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.right})`)
    .attr("id", "snodes");

div = d3.select("body").append("div")
    .attr("class", "tooltip_circle")
    .style("opacity", 0);

// Draw a scatterplot from the given t-SNE data
function Initial_Scatterplot(tsne_data) {
        UpdateDataTSNE(tsne_data);      // Update our clu with the given t-SNE data
        _Draw_Scatterplot(data_min);    // Draw the scatterplot with the updated data
    }

// Update the data with the given t-SNE result
function UpdateDataTSNE(data) {

        data.forEach(function(d, i) {
            data_min[i].x = d[0];  // Add the t-SNE x result to the dataset
            data_min[i].y = d[1];  // Add the t-SNE y result to the dataset
            data_min[i].label=audio_label[i];

        });
        // getcluster(data_min)

    }
    // Draw a scatterplot from the given data
function _Draw_Scatterplot(data){

        const xScale = d3.scale.linear()
            .domain(getExtent(data, "x"))
            .range([0, contentWidth]);
        const yScale = d3.scale.linear()
            .domain(getExtent(data, "y"))
            .range([0, contentHeight]);

        UpdateNodes(data);

        function UpdateNodes(data) {
            var colors = d3.scale.category20();
            const radius = 3;
            const opacity = "0.75";
            const selection = scatterplot.selectAll(".compute").data(data);
            //Exit
            selection.exit().remove();
            //Enter
            const newElements = selection.enter()
                .append('circle')
                .attr("class", "compute")
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", radius)
                .style("opacity", opacity)
                .style("fill", function(d){
                    return colors(d.group)
                })
                .on("click", function (d) {
                    PlayAudio(this, d)
                })

                .on("mouseover", function(d) {
                    MouseOvertooltip(d);
                    d3.select(this)     // Does work
                        .attr("r", radius * 2);
                    // d3.select(this)
                    //     .append("title")
                    //     .text(function(d) { return d.label
                    //     })

                })
                .on("mouseout", function(d) {
                    div.style("opacity", 0);
                    /*d3.select(this)   // Doesn't Work
                    .select("circle")
                        .remove();*/
                    d3.select(this)     // Does work
                        .attr("r", radius);
                    d3.select(this)
                        .select("text")
                        .remove();
                });
            //Update
            selection
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y)).attr("r", 3);
        }
    }

function getExtent(data, key) {
    return d3.extent(data.map(d => d[key]));
}

function MouseOvertooltip(d) {
    div.transition()
        .duration(200)
        .style("opacity", .9);
    div.html("Label: " + d.label + "<br/>" +
        "Durations: " + d.info.duration.toFixed(2) + "<br/>" +
        "BufferSize: " + d.info.bufferSize.toFixed(2) + "<br/>" +
        "HopSize: " + d.info.hopSize.toFixed(2) + "<br/>");
}

// Get a set of cluster centroids based on the given data
function getcluster(data){
     let clusterSet = [];
    let centroids = [];

    //give number of clusters we want
    clusters.k(7);

    //number of iterations (higher number gives more time to converge), defaults to 1000
    clusters.iterations(750);

    //data from which to identify clusters, defaults to []
    clusters.data(data);

    clusterSet = clusters.clusters();
    for (i=0; i<clusterSet.length;i++){
        for (j=0; j<data_min.length; j++) {
            clusterSet[i].points.includes(data_min[j]) ? data_min[j].group=i:0;
        }
    }
    console.log(clusterSet)
    // clusterSet.forEach(function(d){ // Save the centroids of each cluster
    //     return centroids.push(d.centroid)
    // });

}

function calculate_Euclidean() {

    var totalscore = [];
    for (i = 0; i < total_self_similarity_data.length - 1; i++) {
        var scorefinal = [];
        for (j = i + 1; j < total_self_similarity_data.length; j++) {
            //Calculate distance based on Euclidean Distance
            scorefinal.push(comparescore_Euclidean(total_self_similarity_data[i], total_self_similarity_data[j]))
        }
        totalscore.push(scorefinal)
    }
    //Display distance pair in heatmap
    chart_display(totalscore);
    //Display distance in network diagram
    network_diagram(totalscore)


}

function calculate_SmithWaterman() {
    d3.select("#loader").style("display", "block");
    var totalscore = [];
    for (h = 0; h < total_self_similarity_data.length - 1; h++) {
        var scorefinal = [];
        for (k = h + 1; k < total_self_similarity_data.length; k++) {
            var result;
            result = comparescore_SmithWaterman(total_self_similarity_data[h], total_self_similarity_data[k])
            //Calculate distance based on SmithWaterman
            scorefinal.push(SmithWaterman(result[0], result[1]))
        }
        totalscore.push(scorefinal)
    }
    //Display distance pair in heatmap
    update_heatmap(totalscore);
    //Display distance in network diagram
    draw_slider(totalscore)
    d3.select("#loader").style("display", "none");
}

function comparescore_SmithWaterman(selfmatrix1, selfmatrix2) {
    var crossscore = [];
    var crossscore2 = [];

    //get distance of all pair between each datapoint of matrix1 and matrix2
    for (var i = 0; i < selfmatrix1.length; i++) {
        var crossimilarity_matrix = [];
        for (var j = 0; j < selfmatrix2.length; j++) {
            crossimilarity_matrix.push(euclideanDistance(selfmatrix1[i], selfmatrix2[j]))
        }
        crossscore.push(crossimilarity_matrix);
        crossscore2 = crossscore.slice();
    }
    return [crossscore, crossscore2];
}

function SmithWaterman(cross_similarity, crossimilarity_for_binary) {
    //Create Cross similarity Matrix from 2 SSM data
    function sortrow(cross_similarity) {
        //sort the row of cross similarity matrix then take the k*row.length point
        rowsort = [];
        for (var i = 0; i < cross_similarity.length; i++) {
            rowsort.push(cross_similarity[i].sort(function (cross_similarity, b) {
                return cross_similarity - b;
            }))
        }
        rowsortmin = [];
        number = 0;
        number = math.round(cross_similarity.length * 0.5)

        for (var i = 0; i < rowsort.length; i++) {
            rowsortmin.push(rowsort[i][number])
        }
    }


    function sortcol(cross_similarity) {
        //sort the column
        column = [];
        column = _.unzip(cross_similarity)
        sortcolumn = [];
        for (var i = 0; i < column.length; i++) {
            sortcolumn.push(column[i].sort(function (cross_similarity, b) {
                return cross_similarity - b;
            }))
        }
        number = 0;
        number = math.round(cross_similarity[0].length * 0.5)

        sortcolumnmin = [];
        for (var i = 0; i < sortcolumn.length; i++) {
            sortcolumnmin.push(sortcolumn[i][number])
        }
    }

    //draw binary matrix
    function drawbinarymatrix(crossimilarity_for_binary) {
        for (var i = 0; i < crossimilarity_for_binary.length; i++) {
            for (var j = 0; j < crossimilarity_for_binary[0].length; j++) {
                if (crossimilarity_for_binary[i][j] < math.min(rowsortmin[i], sortcolumnmin[j])) {
                    crossimilarity_for_binary[i][j] = 0;
                } else {
                    crossimilarity_for_binary[i][j] = 1;
                }
            }
        }
        return crossimilarity_for_binary;
    }

    function Delta(a, b) {
        gapOpening = -0.5;
        gapExtension = -0.7;
        if (b > 0) {
            return 0;
        } else if (b == 0 && a > 0) {
            return gapOpening;
        } else {
            return gapExtension;
        }
    }

    function Match(i) {
        matchScore = 1;
        mismatchScore = -1;

        if (i == 1) {
            return mismatchScore
        } else {
            return matchScore
        }
    }

    function score(crossimilarity_for_binary) {
        // N = crossimilarity.length[0]+1
        // M = crossimilarity.length[1]+1
        //math.zeros(math.size(A))

        arr = Array(crossimilarity_for_binary.length + 1).fill(Array(crossimilarity_for_binary[0].length + 1));
        D = math.zeros(math.size(arr))
        maxD = 0;
        for (i = 3; i < D.length; i++) {
            for (j = 3; j < D[0].length; j++) {
                MS = Match(crossimilarity_for_binary[i - 1][j - 1])
                //H_(i-1, j-1) + S_(i-1, j-1) + delta(S_(i-2,j-2), S_(i-1, j-1))
                d1 = D[i - 1][j - 1] + MS + Delta(crossimilarity_for_binary[i - 2][j - 2], crossimilarity_for_binary[i - 1][j - 1])
                //H_(i-2, j-1) + S_(i-1, j-1) + delta(S_(i-3, j-2), S_(i-1, j-1))
                d2 = D[i - 2][j - 1] + MS + Delta(crossimilarity_for_binary[i - 3][j - 2], crossimilarity_for_binary[i - 1][j - 1])
                //H_(i-1, j-2) + S_(i-1, j-1) + delta(S_(i-2, j-3), S_(i-1, j-1))
                dd3 = D[i - 1][j - 2] + MS + Delta(crossimilarity_for_binary[i - 2][j - 3], crossimilarity_for_binary[i - 1][j - 1])
                D[i][j] = math.max(d1, d2, dd3, 0)
            }
        }
        return math.max(D);
    }

    sortrow(cross_similarity);
    sortcol(cross_similarity);
    drawbinarymatrix(crossimilarity_for_binary);

    return score(crossimilarity_for_binary)

}

// Create Cross similarity Matrix from 2 SSM data
function comparescore_Euclidean(selfmatrix1, selfmatrix2) {
    var crossscore = [];
    //get distance of all pair between each datapoint of matrix1 and matrix2
    for (var i = 0; i < selfmatrix1.length; i++) {
        var crossimilarity_matrix = [];
        for (var j = 0; j < selfmatrix2.length; j++) {
            crossimilarity_matrix.push(euclideanDistance(selfmatrix1[i], selfmatrix2[j]))
        }
        crossscore.push(crossimilarity_matrix)
    }
    //get the min distance of each pair of datapoint of matrix 1 to all datapoint of matrix 2
    var ssmcompare = [];
    for (var i = 0; i < crossscore.length; i++) {
        ssmcompare.push(math.min(crossscore[i]))

    }
    //define the distance between two matrix by get the median distance of all pair
    return math.median(ssmcompare);
}

//display matrix of distance in svg rect with bipolar color
function chart_display(distance_score_data) {
    var margin = {top: 50, right: 0, bottom: 50, left: 50}
    var width = 450 - margin.left - margin.right;
    var height = 1000 - margin.top - margin.bottom;
    var gridSize = 20;
    var colors = colorbrewer.Spectral[9];
    var dataset = distance_score_data;
    var zoom = d3.behavior.zoom()
        .scaleExtent([-10, 10])
        .on("zoom", zoomed);

    function zoomed() {
        heat_map.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
    //create label for each pair
    var label = [];
    for (i = 0; i < audio_label.length - 1; i++) {
        var label1 = [];
        for (j = i + 1; j < audio_label.length; j++) {
            label1.push(audio_label[i] + ":" + audio_label[j])
        }
        label.push(label1)
    }
    var tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden");

     heat_map = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(zoom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.left + ")");
    draw_heatmap()
    function draw_heatmap() {
        var scale = d3.scale.linear().domain([math.min(dataset), math.max(dataset)]).range([0, 1])
        var colorScale = d3.scale.quantize()
            .domain([0, 1])
            .range(colors)
        var row_label_index = [];
        var active_value;
        var draw = heat_map.selectAll("g")
            .data(dataset);
        draw.enter()
            .append("g")
            .attr("transform", (d, i) => `translate(${(i + 5) * ((gridSize) - 5)}, ${(i + 3) * ((gridSize) - 5)})`)
        var drawrect = draw.selectAll("rect")
            .data(function (row, rownumber) {
                row_label_index = rownumber;
                return row.map(d => {
                    return {label: label[rownumber], value: d}
                });
            });

        drawrect.enter()
            .append("rect")
            .attr("x", function (d, i) {
                return i * (gridSize - 5);
            })
            .attr("y", 0)
            .attr("height", 8)
            .attr("width", 8)
            // .attr("transform", "translate(55,20)")
            .attr("class", "rectheatmap")
            .style("fill", "green")
            .on('mouseover', function (d) {
                active_value = d.value;
                d3.selectAll(".link")
                    .attr("stroke", function (d) {
                        return (d.value == active_value) ? 'black' : colorScale(scale(d.value))
                    })
                    .attr("stroke-width", function (d) {
                        return (d.value == active_value) ? (3 * (d.value)) : Math.sqrt(d.value)
                    });
                if (d != null) {
                    // tooltip.html('<div class="tooltip">' + d.label[i] + ": " + d.value.toFixed(2) + '</div>');
                    tooltip.html(d.value.toFixed(2));
                    tooltip.style("visibility", "visible");
                    tooltip.style("top", (d3.event.pageY - 220) + "px").style("left", (d3.event.pageX - 450) + "px");
                } else
                    tooltip.style("visibility", "hidden");
            })
            .on('mouseout', function () {
                tooltip.style("visibility", "hidden");
                d3.selectAll(".link")
                    .attr("stroke", function (d) {
                        return colorScale(scale(d.value))
                    })
                    .attr("stroke-width", function (d) {
                        return Math.sqrt(d.value)
                    });
            })
            .transition().duration(500)
            .style("fill", function (d) {
                return colorScale(scale(d.value));
            });
        draw.exit().remove();
        var row_label = audio_label.slice(0, audio_label.length - 1);
        var col_label = audio_label.slice(1, audio_label.length);
        var rowLabels = heat_map.append("g")
            .selectAll(".rowLabelg")
            .data(row_label);

        rowLabels.enter()
            .append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", function (d, i) {
                return i * 15;
            })
            .attr("y", function (d, i) {
                return i * (gridSize - 5);
            })
            .attr("font-size", "8px")
            .style("text-anchor", "end")
            .attr("transform", "translate(" + 62 + ",52)")
            .attr("class", function (d, i) {
                return "rowLabel mono r" + i;
            })
            .on("mouseover", function (d) {
                d3.select(this).classed("text-hover", true);
                d3.select(this).transition().duration(200).attr("font-size", "15px");
            })
            .on("mouseout", function (d) {
                d3.select(this).classed("text-hover", false);
                d3.select(this).transition().duration(200).attr("font-size", "8px");
            });
        rowLabels.exit().remove();

        var colLabels = heat_map.append("g")
            .selectAll(".colLabelg")
            .data(col_label);

        colLabels.enter()
            .append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", 5)
            .attr("y", function (d, i) {
                return i * (gridSize - 5);
            })
            .attr("font-size", "8px")
            .style("text-anchor", "left")
            .attr("transform", "translate(" + 80 + ",48) rotate(270)")
            .attr("class", function (d, i) {
                return "colLabel mono c" + i;
            })
            .on("mouseover", function (d) {
                d3.select(this).classed("text-hover", true);
                d3.select(this).transition().duration(200).attr("font-size", "15px");
            })
            .on("mouseout", function (d) {
                d3.select(this).classed("text-hover", false);
                d3.select(this).transition().duration(200).attr("font-size", "8px");
            });
        colLabels.exit().remove();
    }
}

function update_heatmap(dataset){
    var tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden");
    var scale = d3.scale.linear().domain([math.min(dataset), math.max(dataset)]).range([0, 1])
    var colors = colorbrewer.Spectral[9];
    var colorScale = d3.scale.quantize()
        .domain([0, 1])
        .range(colors)
    var draw = heat_map.selectAll("g")
        .data(dataset);
    draw.enter()
        .append("g")
        .attr("transform", (d, i) => `translate(${(i + 5) * ((gridSize) - 5)}, ${(i + 3) * ((gridSize) - 5)})`)
    var drawrect = draw.selectAll("rect")
        .data(function (row, rownumber) {
            row_label_index = rownumber;
            return row.map(d => {
                return {value: d}
            });
        })
        .style("fill", "green")
        .on('mouseover', function (d) {
            active_value = d.value;
            d3.selectAll(".link")
                .attr("stroke", function (d) {
                    return (d.value == active_value) ? 'black' : colorScale(scale(d.value))
                })
                .attr("stroke-width", function (d) {
                    return (d.value == active_value) ? (3 * (d.value)) : Math.sqrt(d.value)
                });
            if (d != null) {
                // tooltip.html('<div class="tooltip">' + d.label[i] + ": " + d.value.toFixed(2) + '</div>');
                tooltip.html(d.value.toFixed(2));
                tooltip.style("visibility", "visible");
                tooltip.style("top", (d3.event.pageY-220) + "px").style("left", (d3.event.pageX - 450) + "px");
            } else
                tooltip.style("visibility", "hidden");
        })
        .on('mouseout', function () {
            tooltip.style("visibility", "hidden");
            d3.selectAll(".link")
                .attr("stroke", function (d) {
                    return colorScale(scale(d.value))
                })
                .attr("stroke-width", function (d) {
                    return Math.sqrt(d.value)
                });
        })
        .transition().duration(500)
        .style("fill", function (d) {
            return colorScale(scale(d.value));
        });

}

function drawLegend(){
    var colors = colorbrewer.Spectral[9];
    var cellSize = 10
    var legendElementWidth = 40
    var control1 = d3.select("#controller").append("svg")
        .attr("width", 450)
        .attr("height", 100)
        .attr("transform", "translate(450,10)");

    //create legend bar to show the level of each chroma feature in color. Domain of chroma  [0,1]
    var legend = control1.append("g")
        .attr("class", "legend")
        .attr("transform",
            "translate(0,25)")
        .selectAll(".legendElement")
        .data([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);

    legend.enter().append("g")
        .attr("class", "legendElement");



    legend.append("rect")
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 20)
        .attr("class", "cellLegend bordered")
        .attr("width", legendElementWidth)
        .attr("height", cellSize)
        .style("fill", function (d, i) {
            return colors[i];

        });

    legend.append("text")
        .attr("class", "mono legendElement")
        .text(function (d) {
            return ">" + Math.round(d * 100) / 100;
        })
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 40)
        .attr("font-size", "12px");
    legend.exit().remove();

    control1.append("text")
        .text("Similarity")
        .attr("x", 0)
        .attr("y", 32)
        .attr("font-family", "Times New Roman")
        .attr("font-size", "15px");

    control1.append("text")
        .text("Dissimilarity")
        .attr("x", 320)
        .attr("y", 32)
        .attr("font-family", "Times New Roman")
        .attr("font-size", "15px");
}

function network_diagram(distance_data) {
    d3.select("#loader").style("display", "block");

        var width = 450,
            height = 1100;
        var colors = colorbrewer.Spectral[9];
        var dataset = distance_data;
        var scale = d3.scale.linear().domain([math.min(dataset), math.max(dataset)]).range([0, 1])
        var colorScale = d3.scale.quantize()
            .domain([0, 1])
            .range(colors)
        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(150)
            .size([width, height]);
        var x = d3.scale.linear()
            .domain([0, math.max(distance_data)])
            .range([280, 450])
            .clamp(true);
        var brush = d3.svg.brush()
            .y(x)
            .extent([0, 0]);
    var zoom = d3.behavior.zoom()
        .scaleExtent([-20, 10])
        .on("zoom", zoomed);

    var svg = d3.select("#network").append("svg")
            .attr("width", width)
            .attr("height", height)
             .attr("pointer-events", "all")
        .append('svg:g')
            .call(zoom)
        .append('svg:g');

    function zoomed() {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
         links_g = svg.append("g").attr("transform", "translate(-100,-350)");

        var nodes_g = svg.append("g").attr("transform", "translate(-100,-350)");
     control2 = d3.select("#controller").append("svg")
        .attr("width", 300)
        .attr("height", 80)
        .attr("transform", "translate(-300,0)");
        slider_tick= control2.append("g")
        .attr("transform", "translate(-200,30) rotate(270)")
        .attr("class", "x axis");
        slider_tick.call(d3.svg.axis()
            .scale(x)
            .orient("left")
            .tickFormat(function (d) {
                return d;
            })
            .tickSize(0)
            .tickPadding(12))
        .select(".domain")
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo");

    var slider = control2.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(-160,0),rotate(270)")
        .call(brush);

    slider.selectAll(".extent,.resize")
        .remove();

    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(" + (-30) + ",-40)")
        .attr("r", 5);

    control2.append("text")
        .attr("x", 50)
        .attr("y", 110)
        .attr("text-anchor", "end")
        .attr("font-size", "15px")
        .text("Distance Threshold")
        .attr("transform", "translate(160,-90)");

        var nodes = total_self_similarity_data;
        nodes.forEach((d, i) => {
            d.name = audio_label[i];
            d.url = fileContent[i];
            d.image = all_canvas_image[i];
        })

        force
            .nodes(nodes);

        var links = [];
        var link2 = [];
        for (i = 0; i < audio_label.length - 1; i++) {
            var link1 = [];
            for (j = i + 1; j < audio_label.length; j++) {
                link1.push({"source": i, "target": j})
            }
            link2.push(link1)
        }
        data1 = d3.merge(distance_data);
        links = d3.merge(link2);
        links.forEach(function (d, i) {
            d.value = data1[i];
        });
        links.forEach(function (d, i) {
            d.i = i;
        });

        var node = nodes_g.selectAll(".node")
            .data(nodes);

         node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);
        node.exit().remove();


        node.append('svg:image')
            .attr('xlink:href', function (d) {
                return d.image;
            })
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 25)
            .attr('height', 25)
            .on("click", function (d) {
                PlayAudio(this, d)
            });

        var text = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes);

            text.enter().append("text")
            .attr("dx", 0)
            .attr("dy", "-1.2em")
            .attr("font-size", "10px")
            .text(function (d) {
                return d.name;
            })
            .attr("transform", "translate(-120,-350)")
            .on("click", function (d) {
                PlayAudio(this, d)
            });
        text.exit().remove();

        brush.on("brush", brushed);
        slider
            .call(brush.extent([0, 0]))
            .call(brush.event);

        function brushed() {

            var value = brush.extent()[0];

            if (d3.event.sourceEvent) {
                value = x.invert(d3.mouse(this)[1]);
                brush.extent([value, value]);
            }
            handle.attr("cy", x(value));
            var threshold = value;

            var thresholded_links = links.filter(function (d) {

                return (d.value <= threshold);
            });
            console.log(thresholded_links)

            var array_data = [];

            thresholded_links.forEach(
                function (d) {
                    array_data.push(d.value)
                    d3.selectAll("rect").classed("displayrect", function (d) {
                            return array_data.includes(d.value) == true ? true : false;
                        }
                    )
                }
            )

            force
                .links(thresholded_links);

            var active_value;
            var link = links_g.selectAll(".link")
                .data(thresholded_links, function (d) {
                    return d.i;
                });
            link.exit().remove();
            link.enter().append("line")
                .attr("class", "link")
                .attr("stroke-width", function (d) {
                    if (d.value<0.1){
                        return 1
                    }
                    else {
                        return Math.sqrt(d.value);
                    }
                })
                .attr("stroke", function (d) {
                    return colorScale(scale(d.value))
                })
                .on('mouseover', function (d) {
                    active_value = d.value;
                    d3.selectAll('.rectheatmap')
                        .transition().duration(1000).attr("width", function (d) {
                        return d.value == active_value ? '15' : 8
                    }).attr("height", function (d) {
                        return d.value == active_value ? '15' : 8
                    })
                })
                .on('mouseout', function () {
                    d3.selectAll(".rectheatmap").transition().duration(1000).attr("width", function (d) {
                        return 8
                    }).attr("height", function (d) {
                        return 8
                    })
                });



            force.on("tick", function () {
                link.attr("x1", function (d) {
                    return d.source.x;
                })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });

                node.attr("transform", function (d) {
                    return `translate(${d.x - 12},${d.y - 6})`
                });
                text.attr("x", function (d) {
                    return d.x;
                })
                    .attr("y", function (d) {
                        return d.y;
                    });
            });
            force.start();
        }

    d3.select("#loader").style("display", "none");
}
function PlayAudio(thisElement, d) {
    // Play audio on click
    let audioElement;
    if (thisElement.getElementsByTagName("audio").length === 0) {
        // Create audio object from source url
        audioElement = new Audio(d.url);
        // Preload audio to improve response times
        audioElement.preload = "auto";
        // Cache audio for later use to improve performance
        thisElement.appendChild(audioElement);
        // Play the audio
        audioElement.play();
    } else {
        // Get saved audio element
        audioElement = thisElement.getElementsByTagName("audio")[0];
        if (audioElement.isPlaying()) {
            // Pause if it is playing
            audioElement.stop();
        } else {
            // Play if not already playing
            audioElement.play();
        }
    }
}
Audio.prototype.isPlaying = function () {
    return this
        && this.currentTime > 0  // Audio has started playing
        && !this.paused          // Audio playback is not paused
        && !this.ended           // Audio playback is not ended
        && this.readyState >= 3; // Audio data is available and ready for playback
};

Audio.prototype.stop = function () {
    // Pause the playback
    this.pause();
    // Reset the playback time marker
    this.currentTime = 0;
};
function draw_slider(dataset){

    var colors = colorbrewer.Spectral[9];
    var colorScale = d3.scale.quantize()
        .domain([0, 1])
        .range(colors)
    var scale = d3.scale.linear().domain([math.min(dataset), math.max(dataset)]).range([0, 1])
    var x = d3.scale.linear()
        .domain([0, math.max(dataset)])
        .range([280, 450])
        .clamp(true);

    slider_tick.call(d3.svg.axis()
        .scale(x)
        .orient("left")
        .tickFormat(function (d) {
            return d;
        })
        .tickSize(0)
        .tickPadding(12))
        .select(".domain")
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo");

    var update_link=links_g.selectAll('.link')
        .attr("stroke-width", function (d) {
            if (d.value < 0.1){
                return 1
            }
            else
            return Math.sqrt(d.value);
        })
        .attr("stroke", function (d) {
            return colorScale(scale(d.value))
        })
        .on('mouseover', function (d) {
            active_value = d.value;
            d3.selectAll('.rectheatmap')
                .transition().duration(1000).attr("width", function (d) {
                return d.value == active_value ? '15' : 8
            }).attr("height", function (d) {
                return d.value == active_value ? '15' : 8
            })
        })
        .on('mouseout', function () {
            d3.selectAll(".rectheatmap").transition().duration(1000).attr("width", function (d) {
                return 8
            }).attr("height", function (d) {
                return 8
            })
        });
}


