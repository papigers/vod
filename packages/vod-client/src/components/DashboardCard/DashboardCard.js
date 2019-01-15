import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { IconButton } from 'office-ui-fabric-react/lib/Button';
import { Pivot, PivotItem, PivotLinkSize, PivotLinkFormat } from 'office-ui-fabric-react/lib/Pivot';

import ChannelSelector from 'components/ChannelSelector';
import VideoSelector from 'components/VideoSelector';

const Card = styled(Box)`
  background-color: ${({ theme }) => theme.palette.neutralLighterAlt};
  border: 1px solid;
  border-color: ${({ theme }) => theme.palette.neutralLight};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 2px 4px rgba(0, 0, 0, 0.23);
  }
`;

const ExapndCardButton = styled(IconButton)`
  position: absolute;
  top: 10px;
  right: 10px;
  transform: rotate(${({ expanded }) => (expanded ? 180 : 0)}deg);
  transition: transform 300ms ease-in-out;
`;

const Title = styled.h3`
  text-align: center;
  font-size: 1.6em;
  display: inline-block;
  border-bottom: 3px solid;
  border-bottom-color: ${({ theme }) => theme.palette.themeSecondary};
  position: relative;
  right: 50%;
  transform: translateX(50%);
  margin: 0.2em auto;
`;

const CardChannelSelector = styled(ChannelSelector)`
  width: 300px;
`;

const CardVideoSelector = props => <CardChannelSelector {...props} as={VideoSelector} />;

const SlidingOptions = styled(Box)`
  overflow: hidden;
  max-height: ${({ expanded }) => (expanded ? '100px' : 0)};
  transition: max-height 500ms ease-in-out;
`;

const FlexGrow = styled(Flex)`
  height: 100%;
`;

class DashboardCard extends Component {
  constructor(props) {
    super();
    const channel = ((props.channelSelector && props.channelSelector.channels) || [])[0];
    this.state = {
      selectedChannels: [channel && channel.id],
      selectedVideos: 'all',
      expanded: true,
    };
  }

  componentDidUpdate(prevProps) {
    const prevChannels = (prevProps.channelSelector && prevProps.channelSelector.channels) || [];
    const currChannels = (this.props.channelSelector && this.props.channelSelector.channels) || [];
    if (prevChannels.length !== currChannels.length) {
      this.setState({
        selectedChannels: [currChannels[0] && currChannels[0].id],
        selectedVideos: [],
      });
    }
  }

  onToggleExpanded = () => this.setState({ expanded: !this.state.expanded });

  onChannelChange = selectedChannels => this.setState({ selectedChannels });
  onVideoChange = selectedVideos => this.setState({ selectedVideos });
  onTabChange = selectedTab => this.setState({ selectedTab });

  render() {
    const { title, children, channelSelector, videoSelector, tabs, ...props } = this.props;
    const { selectedChannels, selectedVideos, selectedTab, expanded } = this.state;
    return (
      <Card px="1em" m={2} {...props}>
        <Box my="0.6em">
          <Title>{this.props.title}</Title>
          <ExapndCardButton
            iconProps={{ iconName: 'ChevronDownSmall' }}
            title="אפשרויות"
            onClick={this.onToggleExpanded}
            expanded={expanded}
          />
          <SlidingOptions expanded={expanded}>
            <Flex alignItems="flex-end">
              {tabs && tabs.length ? (
                <Box flex="1 0 0">
                  <Pivot
                    linkSize={PivotLinkSize.large}
                    selectedKey={selectedTab}
                    onLinkClick={this.onTabChange}
                    headersOnly
                    linkFormat={PivotLinkFormat.tabs}
                  >
                    {tabs.map(tab => (
                      <PivotItem linkText={tab.label} itemKey={tab.key} />
                    ))}
                  </Pivot>
                </Box>
              ) : null}
              <Box mx={2} />
              <Flex alignItems="flex-end">
                {channelSelector && channelSelector.channels ? (
                  <CardChannelSelector
                    selected={selectedChannels}
                    onChange={this.onChannelChange}
                    {...channelSelector}
                  />
                ) : null}
                <Box mx={2} />
                {videoSelector && videoSelector.videos ? (
                  <CardVideoSelector
                    selected={selectedVideos}
                    onChange={this.onVideoChange}
                    {...videoSelector}
                  />
                ) : null}
              </Flex>
            </Flex>
          </SlidingOptions>
        </Box>
        <FlexGrow alignItems="center" justifyContent="center">
          {this.props.children}
        </FlexGrow>
      </Card>
    );
  }
}

export default DashboardCard;
