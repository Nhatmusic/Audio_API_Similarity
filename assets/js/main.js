// setup init variables
var mfcc = [];
var rms = 0;
var featureType = 'mfcc';
var featureType2 = 'rms';
var count = 0;
var origin_data1 = [];
var marginleft = 50;
var matrixgap = 400;
var durations = 8;
var windowsize = 8192;
var totaldata = [];
var url=[];
var count_position=0;
var Meyda = require('meyda');

//get file directory
window.onload=function(){
    document.getElementById("filepicker").addEventListener("change", function(event) {
    let output = document.getElementById("listing");
    let files = event.target.files;
    for (i=0;i<files.length;i++){
        url.push("./assets/sound/"+files[i].name)
    }
        getData(url[0], 0)
}, false);
}


    function getData(a, index) {
    //get audio label
        var labelholder1=[];
        var labelholder2=[];
        audio_label=[];
        for (i=0;i<url.length;i++){
            labelholder1.push(url[i].split("/"))
            labelholder2.push(labelholder1[i][3].split("."))
            audio_label.push(labelholder2[i][0])
        }

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
            audioData = request.response;
            //decode the audio data from array buffer and stored to AudioBufferSourceNode
            audioCtx.decodeAudioData(audioData, function (buffer) {
                //store data to buffer source node
                source.buffer = buffer;
                //find the duration of the audio in second after decoding
                var duration1 = 0;
                duration1 = source.buffer.duration;

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

                //Using offline audio context to render audio data
                offlineCtx.startRendering();

                //After complete rendering, performing the following steps
                offlineCtx.oncomplete = function (e) {
                    //copy the data generated from Meyda Analyzer 1
                    var matrix1 = [];
                    //origin_data1 is generated from function show1 of Meyda Analyzer 1
                    var matrix1 = origin_data1;
                    var matrix11 = [];
                    //Create self_similarity data based on origin_data by calculate Euclidean distance between each pair of data point of origin_data
                    var matrix11 = predata(matrix1,index);
                    //draw self_similarity matrix1
                    drawmatrix(matrix11, index, hop, buf, dur, url[index]);
                    ++index;
                    if (index < url.length) {
                        getData(url[index], index)
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



//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function show1(features) {

    mfcc = features[featureType];
    rms = features[featureType2];
    if (rms != 0) {
        origin_data1.push(mfcc)
    }
}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function drawmatrix(self_similarity_data, index, hop, buffer, duration, songname) {
    //scale the self_similarity data value to draw
    var CSM22 = d3.scaleLinear()
        .domain([math.min(self_similarity_data), math.max(self_similarity_data)])
        .range([1, 0]);

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
    console.log("I am calculating the distance");
    if (index == (url.length-1)) {
        var totalscore = [];
        for (i = 0; i < totaldata.length - 1; i++) {
            var scorefinal = [];
            for (j = i + 1; j < totaldata.length; j++) {
                scorefinal.push(comparescore(totaldata[i], totaldata[j]))
            }
            totalscore.push(scorefinal)
        }
        chart_display(totalscore);
        network_diagram(totalscore,totaldata)
    }

    //Define the position to draw self_similarity matrix on canvas
    var position = 1;

    if (index < 15) {
        ctx.putImageData(imgData, index * (matrixgap) + marginleft, 150);
    } else {
        index = index%15;
        if(index==0) {
            count_position++
        }
        position = count_position*(position * 8);
        ctx.putImageData(imgData, (index) * (matrixgap) + marginleft, 500*(count_position))
        console.log("i count"+count_position)

    }

    //label the matrix by name, hopsize, buffersize, duration
    ctx.font = "20px Arial";
    ctx.fillText("Audio: " + songname, index * (matrixgap) + marginleft, 50 * position);
    ctx.fillText("Hopsize: " + hop.toFixed(0), index * (matrixgap) + marginleft, 50 * position + 30);
    ctx.fillText("Buffersize: " + buffer, index * (matrixgap) + marginleft, 50 * position + 60);
    ctx.fillText("Duration: " + duration.toFixed(2), index * (matrixgap) + marginleft, 50 * position + 90);
    console.log("I am drawing")
    //reset the origin_data from Meyda Analyzer for next use
    origin_data1 = [];
}

//function to process the origin_data to self_similarity data by comparing euclidean distance of every pair of data point
function predata(origin_data,index) {

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
            data2.push(euclideanDistance(normalized_data[i], normalized_data[j]))
        }
        self_similarity_data.push(data2);
    }
    self_similarity_data.index = index;
    totaldata.push(self_similarity_data)
    return self_similarity_data;
}


function euclideanDistance(a, b) {
    var sum = 0;
    if (a.length == b.length) {

       sum = distance(a,b);
        //if 2 vector does not have the same data lenthg, fill 0 to the rest of smaller dimension vector
    } else if (a.length < b.length) {
        a = a.concat(Array(b.length - a.length).fill(0))
       sum = distance(a,b);

    } else {
        b = b.concat(Array(a.length - b.length).fill(0))

        sum = distance(a,b)

    }
    return sum
}

//Create Cross similarity Matrix from 2 SSM data
function comparescore(selfmatrix1, selfmatrix2) {

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

    var margin = {top: 50, right: 0, bottom: 100, left: 50}
    var width = 1000 - margin.left - margin.right;
    var height = 1000 - margin.top - margin.bottom;
    var gridSize = 20;
    var colors = colorbrewer.RdBu[9];
    var cellSize = 10
    var legendElementWidth=20
    var dataset = distance_score_data;
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
        .style("position", "absolute")
        .style("visibility", "hidden");
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + 800 + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var scale = d3.scale.linear().domain([math.min(dataset), math.max(dataset)]).range([0, 1])

    var colorScale = d3.scale.quantize()
        .domain([0, 1])
        .range(colors)

    var row_label=[];
    var draw = svg.selectAll("g")
        .data(dataset)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(${i * gridSize}, ${i * (gridSize)})`)
        .selectAll("rect")
        .data(function (row, rownumber) {
            row_label = rownumber;
            return row.map(d => {
                return {label: label[rownumber], value: d}
            });
        })
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return i * gridSize;
        })
        .attr("y", 0)
        .attr("height", 10)
        .attr("width", 10)
        .attr("transform", "translate(55,20)")
        .attr("class", ".tooltip")
        .style("fill", "green")
        .on('mouseover', function (d, i) {
            if (d != null) {
                tooltip.html('<div class="heatmap_tooltip">' + d.label[i] + ": " + d.value.toFixed(2) + '</div>');
                tooltip.style("visibility", "visible");
            } else
                tooltip.style("visibility", "hidden");
        })
        .on('mouseout', function () {
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (d, i) {
            tooltip.style("top", (d3.event.pageY - 55) + "px").style("left", (d3.event.pageX - 60) + "px");
        })
        .transition().duration(500)
        .style("fill", function (d) {
            return colorScale(scale(d.value));
        });

    //create legend bar to show the level of each chroma feature in color. Domain of chroma  [0,1]
    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform",
            "translate(" + -10 + " ," +
            (-20) + ")")
        .selectAll(".legendElement")
        .data([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
        .enter().append("g")
        .attr("class", "legendElement");

    legend.append("rect")
        .attr("x", function(d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 20)
        .attr("class", "cellLegend bordered")
        .attr("width", legendElementWidth)
        .attr("height", cellSize / 2)
        .style("fill", function(d, i) {
            return colors[i];

        });

    legend.append("text")
        .attr("class", "mono legendElement")
        .text(function(d) {
            return "≥" + Math.round(d * 100) / 100;
        })
        .attr("x", function(d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 20 + cellSize)
        .attr("font-size","5px");

}


function network_diagram(distance_data, self_similarity_data) {
    var width = 800,
        height = 800;
    var colors = colorbrewer.Spectral[9];
    var dataset = self_similarity_data;
    var scale = d3.scale.linear().domain([math.min(dataset), math.max(dataset)]).range([1, 0]);
    var colorScale = d3.scale.quantize()
        .domain([1, 0])
        .range(colors);

    //set color for node group
    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(150)
        .size([width, height]);


    var x = d3.scale.linear()
        .domain([0, math.max(distance_data)])
        .range([450, 280])
        .clamp(true);

    var brush = d3.svg.brush()
        .y(x)
        .extent([0, 0]);

    var svg = d3.select("#network").append("svg")
        .attr("width", width)
        .attr("height", height);

        // .append("g");

    // var audio_image = svg.selectAll('g').data(totaldata).enter()
    //     .append("g")
    //     .attr("transform", function (song,i){ if (i<5) {return `translate(${i*200},${0})`}
    //     else return `translate(${(i-5)*200},${200})` })
    //     // .attr("id", function (d,i){return "song"+ i})
    //     .attr("class","song")
    //
    // var draw = audio_image.selectAll("g")
    //     .data(data=>data)
    //     .enter()
    //     .append("g")
    //     .attr("transform", (d, i) => `translate(${ 0}, ${i/2 })`)
    //     .selectAll("rect")
    //     .data(function (d) {
    //         return d
    //     })
    //     .enter()
    //     .append("rect")
    //     .attr("x", function (d, i) {
    //         return i/2;
    //     })
    //     .attr("y", 0)
    //     .attr("height", 2)
    //     .attr("width", 2)
    //     .attr("transform", "translate(20,50)")
    //     .style("fill", function (d) {
    //         return d3.hsl(257*scale(d),1,0.5).hex(0);
    //     });



    var links_g = svg.append("g");

    var nodes_g = svg.append("g");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + (50) + ",0)")
        .call(d3.svg.axis()
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




    var slider = svg.append("g")
        .attr("class", "slider")
        .call(brush);

    slider.selectAll(".extent,.resize")
        .remove();

    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(" + (50) + ",0)")
        .attr("r", 5);


    svg.append("text")
        .attr("x", 170)
        .attr("y", 250)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .style("opacity", 0.5)
        .text("Euclidean Distance Threshold");


    var nodes = totaldata;
    nodes.forEach((d,i)=>{
        d.name = audio_label[i];
        d.url = url[i]
    })
    console.log(nodes);
    // for (i = 0; i < audio_label.length; i++) {
    //
    //     nodes.push({"name": audio_label[i],
    //                 "url":  url[i]})
    // }

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


    function brushed() {
        var value = brush.extent()[0];
        console.log(value)

        if (d3.event.sourceEvent) {
            value = x.invert(d3.mouse(this)[1]);
            brush.extent([value, value]);
        }
        handle.attr("cy", x(value));
        var threshold = value;

        var thresholded_links = links.filter(function (d) {
            return (d.value <= threshold);
        });

        force
            .links(thresholded_links);

        var link = links_g.selectAll(".link")
            .data(thresholded_links, function (d) {
                return d.i;
            });

        link.enter().append("line")
            .attr("class", "link")
            .style("stroke-width", function (d) {
                return Math.sqrt(d.value);
            });

        link.exit().remove();

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

            node.attr("cx", function (d) {
                return d.x;
            })
                .attr("cy", function (d) {
                    return d.y;
                });
            d3.selectAll(".song")[0].forEach((g,index)=>{
                d3.select(g).attr('transform',`translate(${(nodes[index].x)-20},${(nodes[index].y)-60})`)
            })
            text.attr("x", function (d) {
                return d.x;
            })
                .attr("y", function (d) {
                    return d.y;
                });
        });

        force.start();

    }

    force
        .nodes(nodes);

    var node = nodes_g.selectAll(".node")
        .data(nodes).enter()
        .append("g")
        // .attr("transform", function (song,i){ if (i<5) {return `translate(${i*200},${0})`}
        // else return `translate(${(i-5)*200},${200})` })
        // .attr("id", function (d,i){return "song"+ i})
        .attr("class","song")
        .call(force.drag)
        .selectAll("g")
        .data(data=>data)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(${ 0}, ${i/2 })`)
        .selectAll("rect")
        .data(function (d) {
            return d
        })
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return i/2;
        })
        .attr("y", 0)
        .attr("height", 2)
        .attr("width", 2)
        .attr("transform", "translate(20,50)")
        .style("fill", function (d) {
            return d3.hsl(257*scale(d),1,0.5).hex(0);
        });



    var text = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("dx", 0)
        .attr("dy", "-1.2em")
        .attr("font-size", "10px")
        .text(function (d) {
            return d.name
        })
        .on("click", function(d){
            // Play audio on click
            let audioElement;
            if (this.getElementsByTagName("audio").length === 0) {
                // Create audio object from source url
                audioElement = new Audio(d.url);
                // Preload audio to improve response times
                audioElement.preload = "auto";
                // Cache audio for later use to improve performance
                this.appendChild(audioElement);
                // Play the audio
                audioElement.play();
            } else {
                // Get saved audio element
                audioElement = this.getElementsByTagName("audio")[0];
                if (isPlaying(audioElement)) {
                    // Pause if it is playing
                    audioElement.pause();
                } else {
                    // Play if not already playing
                    audioElement.play();
                }
            }

            function isPlaying(audio) {
                return audio
                    && audio.currentTime > 0  // Audio has started playing
                    && !audio.paused          // Audio playback is not paused
                    && !audio.ended           // Audio playback is not ended
                    && audio.readyState >= 3; // Audio data is available and ready for playback
            }
        });

    brush.on("brush", brushed);

    slider
        .call(brush.extent([0, 0]))
        .call(brush.event);


}




