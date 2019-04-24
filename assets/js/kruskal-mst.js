// See https://en.wikipedia.org/wiki/Kruskal%27s_algorithm\
// Depends on DisjointSet.
(function(window) {
  window.mst = function(graph) {
    let vertices = graph.nodes,
    edges = graph.links.slice(0),
    selectedEdges = [],
    forest = new DisjointSet();

    // Each vertex begins "disconnected" and isolated from all the others.
    vertices.forEach((vertex) => {
      forest.makeSet(vertex.id);
    });

    // Sort edges in descending order of weight. We will pop edges beginning
    // from the end of the array.
    edges.sort((a, b) => {
      return -(a.weight - b.weight);
    });

    while(edges.length && forest.size() > 1) {
      let edge = edges.pop();

      if (forest.find(edge.source) !== forest.find(edge.target)) {
        forest.union(edge.source, edge.target);
        selectedEdges.push(edge);
      }
    }

    return {
      nodes: vertices,
      links: selectedEdges
    }
  }
})(window);