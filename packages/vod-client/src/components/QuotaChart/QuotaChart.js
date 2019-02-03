import React, { Component } from 'react';
import { Pie, PieChart, Sector, Tooltip } from 'recharts';
import styled, { withTheme } from 'styled-components';
import { Box } from 'grid-styled';

import axios from 'utils/axios';

const TooltipContainer = styled(Box)`
  background-color: ${({ theme }) => theme.palette.white};
  border: 1px solid ${({ theme }) => theme.palette.neutralLight};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);

  span {
    color: ${({ theme }) => theme.palette.themePrimary};
    font-weight: normal;
  }

  & > div {
    font-weight: 200;

    &.current_value {
      &,
      span {
        font-weight: bold;
      }
    }

    transition: font-wight 300ms ease-in-out;
  }
`;

class QuotaChart extends Component {
  constructor() {
    super();
    this.state = {
      activeIndex: 0,
      data: null,
    };
  }

  componentDidMount() {
    this.getChannelQuota();
  }

  componentWillUnmount() {
    clearTimeout(this.resetTimeout);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedChannels !== this.props.selectedChannels) {
      this.setState({ data: null });
      this.getChannelQuota();
    }
  }

  getChannelQuota() {
    axios
      .get(`/analytics/quota/channel?id=${this.props.selectedChannels}`)
      .then(({ data }) => this.setState({ data }))
      .catch(err => {
        console.error(err);
        this.setState({ data: null });
      });
  }

  onPieEnter = (item, activeIndex) => {
    clearTimeout(this.resetTimeout);
    if (!this.animating) {
      this.setState({ activeIndex });
    }
  };

  onPieLeave = () => {
    if (!this.animating) {
      this.setState({ activeIndex: 0 });
    }
  };

  startAnimation = () => {
    this.animating = true;
  };
  endAnimation = () => {
    this.animating = false;
  };

  renderActiveShape = props => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    const total = Math.round(value / percent);

    return (
      <g>
        <text
          direction="rtl"
          x={cx}
          y={cy}
          dy={-6}
          textAnchor="middle"
          fill={this.props.theme.palette.themePrimary}
          fontWeight={600}
        >
          סה"כ:
        </text>
        <text x={cx} y={cy} dy={14} textAnchor="middle">
          {this.stringifySize(total)}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fontWeight={600}
          fill={fill}
          direction="ltr"
        >
          {this.stringifySize(value)}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
          direction="ltr"
        >
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  renderTooltip = props => {
    const total = props.data.reduce((sum, val) => sum + val.value, 0);
    return (
      <TooltipContainer p={10} dir="rtl">
        {props.data.map(d => {
          const percent = d.value / total;
          const current = d.name === (props.payload[0] && props.payload[0].name);
          return (
            <div className={current ? 'current_value' : null}>
              <span>{d.name}:</span>
              <div dir="ltr">
                {this.stringifySize(d.value)} ({(percent * 100).toFixed(2)}%)
              </div>
            </div>
          );
        })}
      </TooltipContainer>
    );
  };

  formatData() {
    const { theme } = this.props;
    return (
      this.state.data && [
        { name: 'בשימוש', value: +this.state.data.used, fill: theme.palette.themePrimary },
        { name: 'פנוי', value: +this.state.data.free, fill: theme.palette.neutralTertiary },
      ]
    );
  }

  stringifySize(size) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (size === 0) {
      return '0 Byte';
    }
    var i = parseInt(Math.floor(Math.log(size) / Math.log(1024)), 10);
    return Math.round((size / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  render() {
    const data = this.formatData();

    return (
      <PieChart width={400} height={220}>
        {data ? (
          <Pie
            dataKey="value"
            activeIndex={this.state.activeIndex}
            activeShape={this.renderActiveShape}
            data={data}
            cx={'50%'}
            cy={'50%'}
            innerRadius={40}
            outerRadius={75}
            startAngle={30}
            endAngle={390}
            stroke="transparent"
            cursor="pointer"
            onMouseEnter={this.onPieEnter}
            onMouseLeave={this.onPieLeave}
            onAnimationStart={this.startAnimation}
            onAnimationEnd={this.endAnimation}
          />
        ) : null}
        {data ? <Tooltip content={this.renderTooltip} data={data} /> : null}
      </PieChart>
    );
  }
}

export default withTheme(QuotaChart);
