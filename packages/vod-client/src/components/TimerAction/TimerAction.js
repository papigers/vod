import React, { Component } from 'react';
import styled, { withTheme } from 'styled-components';
import { Box } from 'grid-styled';
import { Circle } from 'rc-progress';

const Contianer = styled(Box)`
  position: relative;
`;

const CenterContent = styled.div`
  && {
    position: absolute;
  }

  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

class TimerAction extends Component {
  constructor() {
    super();
    this.state = {
      currTime: 0,
    };
  }

  componentDidMount() {
    this.setTimer();
  }

  componentDidUpdate(prevProps) {
    if (this.props.time !== prevProps.time) {
      this.setTimer();
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.timerFrame);
  }

  timerStep = ts => {
    if (!this.start) {
      this.start = ts;
    }
    const newTime = ts - this.start;
    this.setState({
      currTime: newTime,
    });
    if (newTime < this.props.time * 1000) {
      this.timerFrame = requestAnimationFrame(this.timerStep);
    } else {
      this.timerFrame = null;
      if (this.props.onTimeEnd) {
        this.props.onTimeEnd();
      }
    }
  };

  setTimer() {
    cancelAnimationFrame(this.timerFrame);
    this.timerFrame = null;
    this.setState({ currTime: 0 });
    this.start = null;
    if (this.props.time) {
      this.timerFrame = requestAnimationFrame(this.timerStep);
    }
  }

  render() {
    const { theme, children, time } = this.props;
    const percent = (this.state.currTime / (time * 1000)) * 100;
    return (
      <Contianer width="80px" my="4">
        <CenterContent>{children}</CenterContent>
        <Circle
          percent={percent}
          strokeLinecap="butt"
          trailWidth="10"
          strokeWidth="11"
          trailColor="#fff"
          strokeColor={theme.palette.themePrimary}
        />
      </Contianer>
    );
  }
}

export default withTheme(TimerAction);
