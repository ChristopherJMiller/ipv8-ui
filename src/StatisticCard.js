import React, { Component } from 'react';
import { Dimmer, Loader, Card, Statistic } from 'semantic-ui-react'

class StatisticCard extends Component {

  render() {
    return (
      <Card>
        <Dimmer active={this.props.loading}>
          <Loader />
        </Dimmer>
        
        <Statistic size='mini' label={this.props.label} value={this.props.value} />
      </Card>
    );
  }
}

export default StatisticCard;
