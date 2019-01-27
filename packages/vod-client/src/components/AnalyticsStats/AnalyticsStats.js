import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box } from 'grid-styled';
import axios from 'utils/axios';

const QuantityStat = styled(Box)`
  text-align: center;
  background-color: ${({ theme }) => theme.palette.white};
  padding: 2em;
  margin: 2em 0.5em;
  border: 2px solid;
  border-color: ${({ theme }) => theme.palette.neutralLight};
  border-radius: 4px;
  flex: 1 1 0;

  div {
    font-size: 3.5em;
    color: ${({ theme }) => theme.palette.themePrimary};
  }

  span {
    font-size: 1.5em;
  }
`;

class AnalyticsStats extends Component {
  constructor() {
    super();
    this.state = {
      data: null,
    };
  }

  componentDidMount() {
    this.getChannelStats();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedChannels !== this.props.selectedChannels) {
      this.setState({ data: null });
      this.getChannelStats();
    }
  }

  getChannelStats() {
    const channelQuery = (this.props.selectedChannels || []).join('&channel=');
    axios
      .get(`/analytics/stats?channel=${channelQuery}`)
      .then(({ data }) => this.setState({ data }))
      .catch(err => {
        console.error(err);
        this.setState({ data: null });
      });
  }

  render() {
    const { data } = this.state;
    return (
      <Fragment>
        <QuantityStat>
          <div>{(data && data.videoCount) || 0}</div>
          <span>סרטונים</span>
        </QuantityStat>
        <QuantityStat>
          <div>{(data && data.playlistCount) || 0}</div>
          <span>פלייליסטים</span>
        </QuantityStat>
        <QuantityStat>
          <div>{(data && data.followerCount) || 0}</div>
          <span>עוקבים</span>
        </QuantityStat>
        <QuantityStat>
          <div>{(data && data.viewCount) || 0}</div>
          <span>צפיות</span>
        </QuantityStat>
        <QuantityStat>
          <div>{(data && data.commentCount) || 0}</div>
          <span>תגובות</span>
        </QuantityStat>
        <QuantityStat>
          <div>{(data && data.likeCount) || 0}</div>
          <span>לייקים</span>
        </QuantityStat>
      </Fragment>
    );
  }
}

export default AnalyticsStats;
