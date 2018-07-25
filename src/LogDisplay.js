import React, { Component } from 'react';
import { Item } from 'semantic-ui-react'

class LogDisplay extends Component {

  render() {
    return (
      <Item.Group items={this.props.logs} />
    );
  }
}

export default LogDisplay;
