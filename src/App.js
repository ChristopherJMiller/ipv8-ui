import React, { Component } from 'react';
import { Grid, Container, GridColumn } from 'semantic-ui-react'
import StatisticCard from './StatisticCard'
import LogDisplay from './LogDisplay'

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      coins: 0,
      coinsLoading: true,
      secret: '',
      secretLoading: true,
      URL: 'http://localhost:3000/proxy',
      mintCooldown: '',
      mintTimeUntil: '',
      mintResponseLogs: []
    }
  }

  POSTHEAD(path, head, func) {
    let request = require("request");

    request.post({url: this.state.URL + path, headers: head}, func)
  }

  PUT(path, func) {
    let request = require("request");

    request({uri: this.state.URL + path, method: 'PUT'}, func)
  }

  HEAD(path, func) {
    let request = require("request");

    request({uri: this.state.URL + path, method: 'HEAD'}, func)
  }

  POST(path, func) {
    let request = require("request");

    request({uri: this.state.URL + path, method: 'POST'}, func)
  }

  GET(path, func) {
    let request = require("request");

    request({uri: this.state.URL + path, method: 'GET'}, func)  
  }

  LOG(header, body, head) {
    let moment = require('moment')
    let item = {
      childKey: this.state.mintResponseLogs.length,
      header: header,
      description: body,
      meta: moment().format('dddd, MMMM Do YYYY, h:mm:ss a'),
      extra: head
    }
    this.setState({
      mintResponseLogs: [item, ...this.state.mintResponseLogs]
    })
  }

  getSecret = (err, res, body) => {
    this.LOG("Getting Secret", body, JSON.stringify(res.headers))
    let secret = body.substring(
      body.indexOf('Secret (store this!): ') + 22,
      body.indexOf('-') - 2
    )

    this.setState({
      secret: secret,
      secretLoading: false
    })
  }

  getCoins = () => {
    this.GET('/coins', (err, res, body) => {
      if (res.rawHeaders.length > 14) {
        this.LOG("Interesting COINS Request...", body, JSON.stringify(res.headers))
      }
      this.setState({
        coins: JSON.parse(body).coins,
        coinsLoading: false
      })
    })
  }

  async useReadyAt(time) {
    let moment = require('moment');
    const delay = require('delay');
    let md5 = require('md5');
    let readyAt = moment(time)
    this.setState({
      mintCooldown: readyAt.format()
    })
    await delay(readyAt.diff(moment()) + 1000)
    this.POSTHEAD('/mint', { 'Coins': md5(this.state.coins.toString()) }, (err, res, body) => {
      this.LOG("Mining Mint", body, JSON.stringify(res.headers))
      this.setState({
        mintCooldown: ''
      })
      this.asyncMintHandler();
    })
  }

  getReadyAt() {
    this.POSTHEAD('/mint', { 'Maximum': 5 }, (err, res, body) => {
      this.LOG("Getting readyAt", body, JSON.stringify(res.headers))
      if (JSON.parse(body).hasOwnProperty('coins')) {
        this.getReadyAt()
      } else {
        this.PUT('/doubleNextMint', (err, he, mintStatus) => {
          let status = JSON.parse(mintStatus)
          if (status.status != "nothingToDo") {
            this.LOG('Double Mint Found Something To Do', mintStatus, JSON.stringify(he.headers))
            this.HEAD('/doubleNextMint', (err, hex, minted) => {
              this.LOG('Double Mint Did Task', minted, JSON.stringify(hex.headers))
            })
          }
          this.useReadyAt(JSON.parse(body).readyAt)
        })
      }
    })
  }

  async asyncMintHandler() {
    let readyAtStamp = this.getReadyAt(); 
  }

  componentDidMount() {
    let moment = require('moment');

    this.POST('/startgame', this.getSecret)
    this.getCoins()
    this.asyncMintHandler()
    setInterval(() => {
      this.getCoins();
      this.setState({
        mintTimeUntil: moment(this.state.mintCooldown).diff(moment(), 'seconds')
      })
    }, 1000);

    setInterval(() => {
      this.GET('/coins', (err, res, body) => {
        this.LOG("Interval Coin Check...", body, JSON.stringify(res.headers))
        this.setState({
          coins: JSON.parse(body).coins,
          coinsLoading: false
        })
      })
    }, 10000);
  }

  render() {
    let moment = require('moment');

    return (
      <Container>
        <Grid columns={3}>
          <Grid.Row>
            <Grid.Column>
              <StatisticCard label='Secret' value={this.state.secret} loading={this.state.secretLoading} />
            </Grid.Column>
            <Grid.Column>
             <StatisticCard label='Coins' value={this.state.coins} loading={this.state.coinsLoading} />
            </Grid.Column>

            <Grid.Column>
             <StatisticCard label='Mint Cooldown' value={moment(this.state.mintCooldown).format('h:mm:ss a')} />
             <StatisticCard label='Time Until Mine' value={this.state.mintTimeUntil} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <LogDisplay logs={this.state.mintResponseLogs} />
      </Container>
    );
  }
}

export default App;
