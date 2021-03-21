import React from "react";
// import FontAwesome from "react-fontawesome";
import * as d3 from "d3";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown,  faCaretDown, faCaretRight, faCaretUp } from '@fortawesome/free-solid-svg-icons'


const MATCH_TRANSLATE_REGEX = /translate\((-?\d+)px, ?(-?\d+)px\)/i;
const MATCH_SCALE_REGEX = /scale\((\S*)\)/i;

const LinkStyle = {
  CURVE: "curve",
  STRAIGHT: "straight",
};

const DIRECTION = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal",
};

const DEFAULT_NODE_WIDTH = 100;
const DEFAULT_NODE_HEIGHT = 100;
const DEFAULT_LEVEL_HEIGHT = 200;

const ANIMATION_DURATION = 800;

function uuid() {
  const s = [];
  const hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
}

function rotatePoint({ x, y }) {
  return {
    x: y,
    y: x,
  };
}

class VueTree extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      d3,
      colors: "568FE1",
      nodeDataList: [],
      linkDataList: [],
      initTransformX: 0,
      initTransformY: 0,
      DIRECTION,
      currentScale: 1,
    };

    this.container = React.createRef();
    this.svg = React.createRef();
    this.domContainer = React.createRef();

    this.addUniqueKey(this.props.dataset);
  }

  componentDidMount() {
    this.init();
    this.props.onRef(this);
  }

  componentWillUnmount() {
    this.props.onRef(undefined);
  }

  initialTransformStyle() {
    return {
      transform: `scale(1) translate(${this.state.initTransformX}px, ${this.state.initTransformY}px)`,
      transformOrigin: "center",
    };
  }

  init() {
    this.draw();
    this.enableDrag();
    this.initTransform();
  }
  zoomIn() {
    const originTransformStr = this.domContainer.current.style.transform;

    let targetScale = 1 * 1.2;
    const scaleMatchResult = originTransformStr.match(MATCH_SCALE_REGEX);
    if (scaleMatchResult && scaleMatchResult.length > 0) {
      const originScale = parseFloat(scaleMatchResult[1]);
      targetScale *= originScale;
    }
    this.setScale(targetScale);
  }
  zoomOut() {
    const originTransformStr = this.domContainer.current.style.transform;

    let targetScale = 1 / 1.2;
    const scaleMatchResult = originTransformStr.match(MATCH_SCALE_REGEX);
    if (scaleMatchResult && scaleMatchResult.length > 0) {
      const originScale = parseFloat(scaleMatchResult[1]);
      targetScale = originScale / 1.2;
    }
    this.setScale(targetScale);
  }
  restoreScale() {
    this.setScale(1);
  }
  setScale(scaleNum) {
    if (typeof scaleNum !== "number") return;
    let pos = this.getTranslate();
    let translateString = `translate(${pos[0]}px, ${pos[1]}px)`;
    this.svg.current.style.transform = `scale(${scaleNum}) ` + translateString;
    this.domContainer.current.style.transform = `scale(${scaleNum}) ` + translateString;
    this.setState({
      currentScale: scaleNum,
    });
  }
  getTranslate() {
    let string = this.svg.current.style.transform;
    let match = string.match(MATCH_TRANSLATE_REGEX);
    if (match === null) {
      return [null, null];
    }
    let x = parseInt(match[1]);
    let y = parseInt(match[2]);
    return [x, y];
  }
  isVertical() {
    return this.props.direction === DIRECTION.VERTICAL;
  }
  addUniqueKey(rootNode) {
    const queue = [rootNode];
    while (queue.length !== 0) {
      const node = queue.pop();
      node._key = uuid();
      if (node.children) {
        queue.push(...node.children);
      }
    }
    return rootNode;
  }
  initTransform() {
    const containerWidth = this.container.current.offsetWidth;
    const containerHeight = this.container.current.offsetHeight;
    if (this.isVertical()) {
      this.setState({
        initTransformX: Math.floor(containerWidth / 2),
        initTransformY: Math.floor(this.props.config.nodeHeight),
      });
    } else {
      this.setState({
        initTransformX: Math.floor(this.props.config.nodeWidth),
        initTransformY: Math.floor(containerHeight / 2),
      });
    }
  }
  setTransform(width, height) {
    const containerWidth = width;
    const containerHeight = height;
    if (this.isVertical()) {
      this.setState({
        initTransformX: Math.floor(containerWidth / 2),
        initTransformY: Math.floor(this.props.config.nodeHeight),
      });
    } else {
      this.setState({
        initTransformX: Math.floor(this.props.config.nodeWidth),
        initTransformY: Math.floor(containerHeight / 2),
      });
    }
  }
  generateLinkPath(d) {
    const self = this;
    if (this.props.linkStyle === LinkStyle.CURVE) {
      const linkPath = this.isVertical() ? d3.linkVertical() : d3.linkHorizontal();
      linkPath
        .x(function (d) {
          return d.x;
        })
        .y(function (d) {
          return d.y;
        })
        .source(function (d) {
          const sourcePoint = {
            x: d.source.x,
            y: d.source.y,
          };
          return self.props.direction === self.DIRECTION.VERTICAL
            ? sourcePoint
            : rotatePoint(sourcePoint);
        })
        .target(function (d) {
          const targetPoint = {
            x: d.target.x,
            y: d.target.y,
          };
          return self.props.direction === self.DIRECTION.VERTICAL
            ? targetPoint
            : rotatePoint(targetPoint);
        });
      return linkPath(d);
    }
    if (this.props.linkStyle === LinkStyle.STRAIGHT) {
      // the link path is: source -> secondPoint -> thirdPoint -> target
      const linkPath = d3.path();
      let sourcePoint = { x: d.source.x, y: d.source.y };
      let targetPoint = { x: d.target.x, y: d.target.y };
      if (!this.isVertical()) {
        sourcePoint = rotatePoint(sourcePoint);
        targetPoint = rotatePoint(targetPoint);
      }
      const xOffset = targetPoint.x - sourcePoint.x;
      const yOffset = targetPoint.y - sourcePoint.y;
      const secondPoint = this.isVertical()
        ? { x: sourcePoint.x, y: sourcePoint.y + yOffset / 2 }
        : { x: sourcePoint.x + xOffset / 2, y: sourcePoint.y };
      const thirdPoint = this.isVertical()
        ? { x: targetPoint.x, y: sourcePoint.y + yOffset / 2 }
        : { x: sourcePoint.x + xOffset / 2, y: targetPoint.y };
      linkPath.moveTo(sourcePoint.x, sourcePoint.y);
      linkPath.lineTo(secondPoint.x, secondPoint.y);
      linkPath.lineTo(thirdPoint.x, thirdPoint.y);
      linkPath.lineTo(targetPoint.x, targetPoint.y);
      return linkPath.toString();
    }
  }

  draw() {
    const [nodeDataList, linkDataList] = this.buildTree(this.props.dataset);
    const svg = this.state.d3.select(this.svg.current);

    const self = this;
    const links = svg.selectAll(".link").data(linkDataList, (d) => {
      return `${d.source.data._key}-${d.target.data._key}`;
    });

    links
      .enter()
      .append("path")
      .style("opacity", 0)
      .transition()
      .duration(ANIMATION_DURATION)
      .ease(d3.easeCubicInOut)
      .style("opacity", 1)
      .attr("class", "link")
      .attr("d", function (d) {
        return self.generateLinkPath(d);
      });
    links
      .transition()
      .duration(ANIMATION_DURATION)
      .ease(d3.easeCubicInOut)
      .attr("d", function (d) {
        return self.generateLinkPath(d);
      });
    links
      .exit()
      .transition()
      .duration(ANIMATION_DURATION / 2)
      .ease(d3.easeCubicInOut)
      .style("opacity", 0)
      .remove();

    this.setState({
      linkDataList: linkDataList,
      nodeDataList: nodeDataList,
    });
  }
  buildTree(rootNode) {
    const treeBuilder = this.state.d3
      .tree()
      .nodeSize([this.props.config.nodeWidth, this.props.config.levelHeight]);
    const tree = treeBuilder(this.state.d3.hierarchy(rootNode));
    return [tree.descendants(), tree.links()];
  }
  enableDrag() {
    const svgElement = this.svg.current;
    const container = this.container.current;
    let startX = 0;
    let startY = 0;
    let isDrag = false;

    let mouseDownTransform = "";
    container.onmousedown = (event) => {
      mouseDownTransform = svgElement.style.transform;
      startX = event.clientX;
      startY = event.clientY;
      isDrag = true;
    };
    container.onmousemove = (event) => {
      if (!isDrag) return;
      const originTransform = mouseDownTransform;
      let originOffsetX = 0;
      let originOffsetY = 0;
      if (originTransform) {
        const result = originTransform.match(MATCH_TRANSLATE_REGEX);
        if (result !== null && result.length !== 0) {
          const [offsetX, offsetY] = result.slice(1);
          originOffsetX = parseInt(offsetX);
          originOffsetY = parseInt(offsetY);
        }
      }
      let newX =
        Math.floor((event.clientX - startX) / this.state.currentScale) + originOffsetX;
      let newY =
        Math.floor((event.clientY - startY) / this.state.currentScale) + originOffsetY;
      let transformStr = `translate(${newX}px, ${newY}px)`;
      if (originTransform) {
        transformStr = originTransform.replace(MATCH_TRANSLATE_REGEX, transformStr);
      }
      svgElement.style.transform = transformStr;
      this.domContainer.current.style.transform = transformStr;
    };

    container.onmouseup = () => {
      startX = 0;
      startY = 0;
      isDrag = false;
    };
  }
  onClickNode(index) {
    console.log(index);
    const curNode = this.state.nodeDataList[index];
    if (curNode.data.children) {
      curNode.data._children = curNode.data.children;
      curNode.data.children = null;
      curNode.data._collapsed = true;
    } else {
      curNode.data.children = curNode.data._children;
      curNode.data._children = null;
      curNode.data._collapsed = false;
    }
    this.draw();
  }
  formatDimension(dimension) {
    if (typeof dimension === "number") return `${dimension}px`;
    if (dimension.indexOf("px") !== -1) {
      return dimension;
    } else {
      return `${dimension}px`;
    }
  }
  parseDimensionNumber(dimension) {
    if (typeof dimension === "number") {
      return dimension;
    }
    return parseInt(dimension.replace("px", ""));
  }

  deltaIcon(i) { // i for icon -> not related from FontAwesomeIcon
    if (i === "red") {
      return faCaretDown
    } else if (i === "green") {
      return faCaretUp;
    } else if (i === "orange") {
      return faCaretRight;
    }

    return "";
  }
  
  render() {
    const { direction, config } = this.props;
    const { nodeDataList } = this.state;

    return (
      <div className="tree-container" ref={this.container}>
        <svg
          className="svg vue-tree"
          ref={this.svg}
          style={this.initialTransformStyle()}
        ></svg>

        <div
          className="dom-container"
          ref={this.domContainer}
          style={this.initialTransformStyle()}
        >
          <transition-group name="tree-node-item" tag="div">
            {nodeDataList.map((node, index) => (
              <div
                className="node-slot"
                key={node.data._key}
                style={{
                  left: this.formatDimension(
                    direction === DIRECTION.VERTICAL ? node.x : node.y
                  ),
                  top: this.formatDimension(
                    direction === DIRECTION.VERTICAL ? node.y : node.x
                  ),
                  width: this.formatDimension(config.nodeWidth),
                  height: this.formatDimension(config.nodeHeight),
                }}
              >
                <div className="node-item">
                  <div style={{ width: "100%" }}>
                    <div className="node-title">{node.data.name}</div>
                    {(node.data.children || node.data._collapsed) && (
                      <div
                        className="node-toggle"
                        onClick={() => this.onClickNode(index)}
                      >
                        <FontAwesomeIcon 
                            icon= {node.data._collapsed ? faChevronUp : faChevronDown}
                            name={node.data._collapsed ? "chevron-up" : "chevron-down"}
                        />
                      </div>
                    )}
                  </div>
                  <div className="node-details">
                    <div
                      className={"node-value node-details-item " + node.data.value.color}
                    >
                      {node.data.value.amount}
                    </div>
                    <div className="node-delta node-details-item">
                      <FontAwesomeIcon 
                        icon= {this.deltaIcon(node.data.delta.color)}
                        className={node.data.delta.color}
                        name={this.deltaIcon(node.data.delta.color)}
                      />
                      {node.data.delta.amount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </transition-group>
        </div>
      </div>
    );
  }
}

VueTree.defaultProps = {
  config: {
    nodeWidth: DEFAULT_NODE_WIDTH,
    nodeHeight: DEFAULT_NODE_HEIGHT,
    levelHeight: DEFAULT_LEVEL_HEIGHT,
  },
  linkStyle: LinkStyle.CURVE,
  direction: DIRECTION.VERTICAL,
};

export default VueTree;
