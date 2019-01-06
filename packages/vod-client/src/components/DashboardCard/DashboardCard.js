import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { IconButton } from 'office-ui-fabric-react/lib/Button';

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

const CardDropdown = styled(Dropdown)`
  max-width: 300px;
`;

const DropdownOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: center;
  height: 100%;
  overflow: hidden;

  .ms-Dropdown-item:hover &,
  .ms-Dropdown-item:hover & .ms-Persona-primaryText {
    color: ${({ theme }) => theme.palette.themePrimary};
  }

  i {
    margin-left: 8px;
  }
`;

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
      expanded: true,
    };
  }

  componentDidUpdate(prevProps) {
    const prevChannels = (prevProps.channelSelector && prevProps.channelSelector.channels) || [];
    const currChannels = (this.props.channelSelector && this.props.channelSelector.channels) || [];
    if (prevChannels.length !== currChannels.length) {
      this.setState({ selectedChannels: [currChannels[0] && currChannels[0].id] });
    }
  }

  onToggleExpanded = () => this.setState({ expanded: !this.state.expanded });

  onRenderChannelTitle = item => this.onRenderChannelOption(item, 'title');

  onRenderChannelOption = (item, type) => {
    const option = item[0] || item;
    const {
      channelSelector: { multiSelect, allSelect, channels },
    } = this.props;

    if (type === 'title' && multiSelect) {
      if (allSelect && item.length === channels.length + 1) {
        console.log('got here');
        return <DropdownOption>כל הערוצים בניהולי</DropdownOption>;
      }
      return (
        <DropdownOption>
          <Flex>
            {item.map(option => (
              <Persona
                imageUrl={`/profile/${option.key}/profile.png`}
                text={option.text}
                size={PersonaSize.size24}
                secondaryText={option.key}
              />
            ))}
          </Flex>
        </DropdownOption>
      );
    }
    return (
      <DropdownOption>
        <Box mr={multiSelect && type !== 'title' ? '2' : 0}>
          {option.key === 'all' ? (
            'כל הערוצים בניהולי'
          ) : (
            <Persona
              imageUrl={`/profile/${option.key}/profile.png`}
              text={option.text}
              size={type === 'title' ? PersonaSize.size24 : PersonaSize.size40}
              secondaryText={option.key === 'all' ? null : option.key}
            />
          )}
        </Box>
      </DropdownOption>
    );
  };

  onChannelChange = (e, item) => {
    const { channelSelector } = this.props;
    if (channelSelector.multiSelect) {
      let channels = this.state.selectedChannels;
      if (item.key === 'all') {
        if (item.selected) {
          this.setState({
            selectedChannels: ['all'].concat(channelSelector.channels.map(ch => ch.id)),
          });
        } else {
          this.setState({ selectedChannels: [channelSelector.channels[0].id] });
        }
        return;
      }
      if (item.selected) {
        if (channelSelector.allSelect && channels.length + 1 === channelSelector.channels.length) {
          this.setState({
            selectedChannels: ['all'].concat(channelSelector.channels.map(ch => ch.id)),
          });
        } else {
          this.setState({ selectedChannels: channels.concat([item.key]) });
        }
      } else if (channels.length > 1) {
        this.setState({ selectedChannels: channels.filter(ch => ch !== item.key && ch !== 'all') });
      }
    } else {
      this.setState({ selectedChannels: [item.key] });
    }
  };

  render() {
    const { title, children, channelSelector, ...props } = this.props;
    const { selectedChannels, expanded } = this.state;
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
            {channelSelector && channelSelector.channels ? (
              <CardDropdown
                label="ערוץ:"
                selectedKeys={channelSelector.multiSelect ? selectedChannels : selectedChannels[0]}
                selectedKey={channelSelector.multiSelect ? selectedChannels : selectedChannels[0]}
                onChange={this.onChannelChange}
                multiSelect={channelSelector.multiSelect}
                onRenderTitle={this.onRenderChannelTitle}
                onRenderOption={this.onRenderChannelOption}
                options={[
                  ...(channelSelector.multiSelect && channelSelector.allSelect
                    ? [
                        { key: 'all', text: 'כל הערוצים בניהולי' },
                        { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
                      ]
                    : []),
                  ...channelSelector.channels.map(({ id: key, name: text, ...data }) => ({
                    key,
                    text,
                    ...data,
                  })),
                ]}
              />
            ) : null}
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
