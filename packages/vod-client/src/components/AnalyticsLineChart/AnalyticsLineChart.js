import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';
import { transparentize, mix } from 'polished';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

import axios from 'utils/axios';

const Container = styled(ResponsiveContainer)`
  background: ${({ theme }) => transparentize(0.7, theme.palette.white)};
`;

const TooltipContent = styled.div`
  padding: 10px;
  border: 1px solid
    ${({ theme }) => mix(0.2, theme.palette.black, theme.semanticColors.variantBorder)};
  background-color: ${({ theme }) => theme.semanticColors.bodyBackground};

  p {
    padding: 0;
  }

  span {
    color: ${({ theme }) => theme.palette.themePrimary};
  }
`;

class AnalyticsLineChart extends Component {
  constructor() {
    super();
    this.state = { data: null };
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.selectedChannels.length !== prevProps.selectedChannels.length ||
      this.props.selectedVideo !== prevProps.selectedVideo ||
      this.props.selectedTab !== prevProps.selectedTab
    ) {
      this.loadData();
    }
  }

  loadData() {
    const { selectedVideos, selectedChannels, selectedTab } = this.props;
    const channelQuery = (selectedChannels || []).join('&channel=');
    console.log(this.props);
    this.setState({ data: null }, () => {
      axios
        .get(
          `/analytics/exposure?video=${selectedVideos}&type=${
            selectedTab.key
          }&channel=${channelQuery}`,
        )
        .then(({ data }) => this.setState({ data }))
        .catch(err => {
          console.error(err);
          this.setState({ data: null });
        });
    });
  }

  renderTooltip = props => {
    return (
      <TooltipContent>
        {`${props.label}: `}
        {props.payload.map(d => (
          <span>
            {d.payload.value} {this.props.selectedTab.label}
          </span>
        ))}
      </TooltipContent>
    );
  };

  formatData() {
    if (this.state.data) {
      return this.state.data.map(d => ({
        date: new Date(d.date).toLocaleDateString(),
        value: d.value,
      }));
    }
    const now = new Date();
    now.setMilliseconds(0);
    now.setSeconds(0);
    now.setMinutes(0);
    now.setHours(0);
    return [0, 1, 2, 3, 4, 5].reverse().map(num => {
      const date = new Date(now);
      date.setDate(date.getDate() - 14 * num);
      return {
        value: 0,
        date,
      };
    });
  }

  getPaddedYDomain(data) {
    const min = 0;
    const max = data.reduce((max, curr) => Math.max(max, curr.value), 0);
    return [min, Math.round(max * 1.2 + 1)];
  }

  render() {
    const { theme } = this.props;
    const data = this.formatData(this.state.data);

    return (
      <Container width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.themePrimary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.themePrimary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            axisLine={{ stroke: theme.palette.black, strokeWidth: 2 }}
            tickLine={{ stroke: theme.palette.black }}
            tick={{ fill: theme.palette.black }}
            dataKey="date"
          />
          <YAxis
            axisLine={{ stroke: theme.palette.black, strokeWidth: 2 }}
            tickLine={{ stroke: theme.palette.black }}
            tick={{ fill: theme.palette.black }}
            domain={this.getPaddedYDomain(data)}
          />
          <Tooltip content={this.renderTooltip} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme.palette.themeDark}
            strokeWidth={2}
            fill="url(#lineGradient)"
            fillOpacity={1}
          />
        </AreaChart>
      </Container>
    );
  }
}

export default withTheme(AnalyticsLineChart);
