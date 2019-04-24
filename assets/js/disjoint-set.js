// https://en.wikipedia.org/wiki/Disjoint-set_data_structure
(function(window) {
  function DisjointSet() {
    this.index_ = {};
  }

  function Node(id) {
    this.id_ = id;
    this.parent_ = this;
    this.rank_ = 0;
  }

  DisjointSet.prototype.makeSet = function(id) {
    if (!this.index_[id]) {
      let created = new Node(id);
      this.index_[id] = created;
    }
  }

  // Returns the id of the representative element of this set that (id)
  // belongs to.
  DisjointSet.prototype.find = function(id) {
    if (this.index_[id] === undefined) {
      return undefined;
    }

    let current = this.index_[id].parent_;
    while (current !== current.parent_) {
      current = current.parent_;
    }
    return current.id_;
  }
  
  DisjointSet.prototype.union  = function(x, y) {
    let xRoot = this.index_[this.find(x)];
    let yRoot = this.index_[this.find(y)];

    if (xRoot === undefined || yRoot === undefined || xRoot === yRoot) {
      // x and y already belong to the same set.
      return;
    }

    if (xRoot.rank < yRoot.rank) { // Move x into the set y is a member of.
      xRoot.parent_ = yRoot;
    } else if (yRoot.rank_ < xRoot.rank_) { // Move y into the set x is a member of.
      yRoot.parent_ = xRoot;
    } else { // Arbitrarily choose to move y into the set x is a member of.
      yRoot.parent_ = xRoot;
      xRoot.rank_++;
    }
  }

  // Returns the current number of disjoint sets.
  DisjointSet.prototype.size = function() {
    let uniqueIndices = {};
    
    Object.keys(this.index_).forEach((id) => {
      let representative = this.find(id);

      uniqueIndices[id] = true;
    });

    return Object.keys(uniqueIndices).length;
  }
  
  window.DisjointSet = DisjointSet;
})(window);