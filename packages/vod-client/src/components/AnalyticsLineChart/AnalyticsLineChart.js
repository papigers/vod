import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';
import { transparentize, mix } from 'polished';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

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

const data = [
  { date: 'Page A', value: 2400 },
  { date: 'Page B', value: 1398 },
  { date: 'Page C', value: 9800 },
  { date: 'Page D', value: 3908 },
  { date: 'Page E', value: 4800 },
  { date: 'Page F', value: 3800 },
  { date: 'Page G', value: 4300 },
];

class AnalyticsLineChart extends Component {
  renderTooltip(props) {
    console.log(props);
    return (
      <TooltipContent>
        {`${props.label}: `}
        {props.payload.map(d => (
          <span>{d.payload.value}</span>
        ))}
      </TooltipContent>
    );
  }

  render() {
    const { theme } = this.props;

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
