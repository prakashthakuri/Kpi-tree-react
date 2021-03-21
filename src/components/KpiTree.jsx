import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
// import FontAwesome from "react-fontawesome";

import { faPlus, faMinus, faRetweet } from '@fortawesome/free-solid-svg-icons'

import VueTree from "./VueTree";

class KpiTree extends React.Component {
  constructor(props) {
    super(props);

    this.treeContainer = React.createRef();

    this.resizeHandler = this.resizeHandler.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
    this.zoomReset = this.zoomReset.bind(this);

    this.state = {
      treeW: 1200,
      treeH: 800,
      treeConfig: {
        nodeWidth: 240,
        nodeHeight: 100,
        levelHeight: 100,
      },
      tree: {
        name: "EDITDA",
        value: { amount: "123", color: "green" },
        delta: { amount: "12%", color: "green" },
        children: [
          {
            name: "Customer Profitability",
            value: { amount: "123", color: "green" },
            delta: { amount: "12%", color: "red" },
            children: [
              {
                name: "MRR",
                value: { amount: "123", color: "orange" },
                delta: { amount: "12%", color: "green" },
                children: [
                  {
                    name: "ACV",
                    value: { amount: "123", color: "orange" },
                    delta: { amount: "12%", color: "red" },
                  },
                ],
              },
              {
                name: "Total CAC",
                value: { amount: "123", color: "green" },
                delta: { amount: "12%", color: "green" },
                children: [
                  {
                    name: "Customer Success",
                    value: { amount: "123", color: "red" },
                    delta: { amount: "12%", color: "green" },
                  },
                  {
                    name: "Sales & Marketing",
                    value: { amount: "123", color: "green" },
                    delta: { amount: "12%", color: "green" },
                  },
                ],
              },
            ],
          },
     
          {
            name: "NON-CAC related",
            value: { amount: "123", color: "green" },
            delta: { amount: "12%", color: "orange" },
            children: [
              {
                name: "R&D (excl. Support)",
                value: { amount: "123", color: "green" },
                delta: { amount: "12%", color: "green" },
              },
              {
                name: "G&A",
                value: { amount: "123", color: "green" },
                delta: { amount: "12%", color: "green" },
              },
            ],
          },
        ],
      },
    };
  }

  componentDidMount() {
    window.addEventListener("resize", this.resizeHandler);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeHandler);
  }

  resizeHandler() {
    this.setState({
      treeW: this.treeContainer.current.clientWidth,
      treeH: this.treeContainer.current.clientHeight,
    });

    this.treeRef.setTransform(this.treeW, this.treeH);
  }

  zoomIn() {
    console.log(this.treeRef);
    this.treeRef.zoomIn();
  }

  zoomOut() {
    this.treeRef.zoomOut();
  }

  zoomReset() {
    this.treeRef.restoreScale();
  }

  render() {
    const { tree, treeConfig, treeW, treeH } = this.state;

    return (
      <div>
        <h1>{this.props.msg}</h1>
        <div className="tree-container" ref={this.treeContainer}>
          <VueTree
            onRef={(ref) => {
              this.treeRef = ref;
              console.log(this.treeRef);
            }}
            style={{ width: treeW + "px", height: treeH + "px" }}
            dataset={tree}
            config={treeConfig}
            linkStyle="straight"
          ></VueTree>

          <div className="tree-toolbar">
            <div className="btn-toolbar" onClick={this.zoomIn}>
              <FontAwesomeIcon icon={faPlus} className="plus" name="plus" />
            </div>
            <div className="btn-toolbar" onClick={this.zoomReset}>
              <FontAwesomeIcon icon={faRetweet} className="retweet" name="retweet" />
            </div>
            <div className="btn-toolbar" onClick={this.zoomOut}>
              <FontAwesomeIcon icon={faMinus} className="minus" name="minus" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default KpiTree;
