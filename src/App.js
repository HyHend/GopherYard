import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import graphData from './graphData.json';
import * as d3 from 'd3';

// This code is based on:
// - http://bl.ocks.org/sxywu/1db896c1a38d89ae71b4
// - https://github.com/facebookincubator/create-react-app
// - https://d3js.org
// - https://github.com/react-bootstrap/react-bootstrap/
// - https://codepen.io/devhamsters/pen/yMProm

// Next: - Right click menu
//       - Left click snap to grid
//       - Fix speed isue on node drag in safari
//       - Optional menu showing options such as ctrl key down

var nodeGroupColors = d3.scaleOrdinal(d3.schemeCategory20);

var force = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }).strength(0.05)) //.distance(function(d) {return d.distance;})
  .force("charge", d3.forceManyBody());

var dragstarted = (d) => {
  if (!d3.event.active) force.alphaTarget(1.0).restart();
  d.fx = d.x;
  d.fy = d.y;
};

var dragged = (d) => {
  d.fx = d3.event.sourceEvent.clientX;
  d.fy = d3.event.sourceEvent.clientY;
};

var dragended = (d) => {
  if (!d3.event.active) force.alphaTarget(0);

  // When ctrlKey was pressed, 
  // don't reset and leave node at location
  if(!d3.event.sourceEvent.ctrlKey) {
    d.fx = null;
    d.fy = null;
  }
};

var enterNode = (selection) => {
  selection.select('circle')
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  selection.select('text')
    .attr("x", (d) => 20)
    .attr("dy", ".35em");
};

var updateNode = (selection) => {
  selection.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");
};

var enterLink = (selection) => {
  selection.attr("stroke-width", (d) => 1);
};

var updateLink = (selection) => {
  selection.attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);
};

var updateGraph = (selection) => {
  selection.selectAll('.node')
    .call(updateNode);
  selection.selectAll('.link')
    .call(updateLink);
};

class Node extends Component {
  componentDidMount() {
    this.d3Node = d3.select(ReactDOM.findDOMNode(this))
      .datum(this.props.data)
      .call(enterNode);
  }

  componentDidUpdate() {
    this.d3Node.datum(this.props.data)
      .call(updateNode);
  }

  render() {
    const img = "/img/"+this.props.data.img;
    const id = this.props.data.img;
    const fill = "url(#"+id+")";
    const nodeStroke = nodeGroupColors(this.props.data.group);

    return (
      <g className='node'>
        <defs>
          <pattern id = {id} height = "100%" width = "100%" patternContentUnits = "objectBoundingBox">
              <image xlinkHref = {img} preserveAspectRatio = "none" width = "1" height = "1"/>
          </pattern>
        </defs>
        <circle r="16" fill={fill} stroke={nodeStroke}/>
        <text>{this.props.data.id}</text>
      </g>
    );
  }
}

class Link extends Component {
  componentDidMount() {
    this.d3Link = d3.select(ReactDOM.findDOMNode(this))
      .datum(this.props.data)
      .append("title")
      .text(function (d) {return d.type;})
      .call(enterLink);
  }

  componentDidUpdate() {
    this.d3Link.datum(this.props.data)
      .call(updateLink);
  }

  render() {
    return (<line className='link' />);
  }
}

class Graph extends Component {
  componentDidMount() {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this));
    force.on('tick', () => {
      // after force calculation starts, call updateGraph
      // which uses d3 to manipulate the attributes,
      // and React doesn't have to go through lifecycle on each tick
      this.d3Graph.call(updateGraph);
    });
  }

  componentDidUpdate() {
    // we should actually clone the nodes and links
    // since we're not supposed to directly mutate
    // props passed in from parent, and d3's force function
    // mutates the nodes and links array directly
    // we're bypassing that here for sake of brevity in example
    force.nodes(this.props.nodes);
    force.force("link").links(this.props.links);
    
    // start force calculations after
    // React has taken care of enter/exit of elements
    force.alphaTarget(1.0).restart();
  }

  render() {
    // use React to draw all the nodes, d3 calculates the x and y
    var nodes = this.props.nodes.map((node, key) => {
      return (<Node data={node} key={key} />);
    });
    var links = this.props.links.map((link, key) => {
      return (<Link data={link}  key={key} />);
    });

    return (
      <svg width={this.props.width} height={this.props.height}>
        <g>
          {links}
          {nodes}
        </g>
      </svg>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dimensions: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      graph: {
        nodes: [],
        links: [],
      },
    };
  }

  componentDidMount() {
    this.graphData();
    force.force("center", d3.forceCenter(this.state.dimensions.width / 2, this.state.dimensions.height / 2))
    window.addEventListener('resize', this.updateDimensions.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions.bind(this))
  }

  graphData() {
    this.setState({
      dimensions: this.state.dimensions,
      graph: graphData,
    });
  }

  updateDimensions() {
    this.setState({
      dimensions: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      graph: this.state.graph,
    });

    force.force("center", d3.forceCenter(this.state.dimensions.width / 2, this.state.dimensions.height / 2))
  }

  render() {
    return (
      <div className="App">
        <Graph nodes={this.state.graph.nodes} links={this.state.graph.links} width={this.state.dimensions.width} height={this.state.dimensions.height} />
      </div>
    );
  }
}

export default App;