import React, { Component } from 'react';
import { Pie, PieChart, Sector, Tooltip } from 'recharts';
import styled, { withTheme } from 'styled-components';
import { Box } from 'grid-styled';

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
    };
  }

  componentWillUnmount() {
    clearTimeout(this.resetTimeout);
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
          {total} GB
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
          {value} GB
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
                {d.value} GB ({(percent * 100).toFixed(2)}%)
              </div>
            </div>
          );
        })}
      </TooltipContainer>
    );
  };

  render() {
    const { theme } = this.props;
    const data = [
      { name: 'בשימוש', value: 1234, fill: theme.palette.themePrimary },
      { name: 'פנוי', value: 5000, fill: theme.palette.black },
    ];

    return (
      <PieChart width={400} height={220}>
        <Pie
          dataKey="value"
          activeIndex={this.state.activeIndex}
          activeShape={this.renderActiveShape}
          data={data}
          cx={'50%'}
          cy={'50%'}
          innerRadius={40}
          outerRadius={80}
          stroke="transparent"
          cursor="pointer"
          onMouseEnter={this.onPieEnter}
          onMouseLeave={this.onPieLeave}
          onAnimationStart={this.startAnimation}
          onAnimationEnd={this.endAnimation}
        />
        <Tooltip content={this.renderTooltip} data={data} />
      </PieChart>
    );
  }
}

export default withTheme(QuotaChart);
