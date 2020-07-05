import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';

const DropdownOption = styled.div`
  /* display: flex; */
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

const VideoCoin = styled(Box)`
  height: 100%;
  display: flex;
  align-items: center;

  img {
    width: 120%;
  }
`;

class VideoSelector extends Component {
  constructor(props) {
    super();
    this.state = {
      selected: props.selected || (props.multiSelect ? [] : null),
    };
  }

  setSelectedKeys = selected => {
    if (this.props.onChange) {
      this.props.onChange(Array.isArray(selected) ? selected.filter(v => v !== 'all') : selected);
    }
    this.setState({ selected });
  };

  onChange = (e, item) => {
    const { allSelect, multiSelect, videos } = this.props;
    if (multiSelect) {
      let selected = this.getSelectedKeys();
      if (item.key === 'all') {
        if (item.selected) {
          return this.setSelectedKeys(['all'].concat(videos.map(v => v.id)));
        }
        return this.setSelectedKeys([videos[0].id]);
      }
      if (item.selected) {
        if (allSelect && selected.length + 1 === videos.length) {
          return this.setSelectedKeys(['all'].concat(videos.map(v => v.id)));
        }
        return this.setSelectedKeys(selected.concat([item.key]));
      } else if (selected.length > 1) {
        return this.setSelectedKeys(selected.filter(v => v !== item.key && v !== 'all'));
      }
    } else {
      return this.setSelectedKeys(item.key);
    }
  };

  onRenderVideoCoin = props => {
    const { imageAlt, imageUrl } = props;
    return (
      <VideoCoin width={1}>
        <img src={imageUrl} alt={imageAlt} />
      </VideoCoin>
    );
  };

  onRenderChannelTitle = item => this.onRenderChannelOption(item, 'title');

  onRenderChannelOption = (item, type) => {
    const option = item[0] || item;
    const { multiSelect, allSelect, videos } = this.props;

    if (type === 'title' && multiSelect) {
      if (allSelect && item.length === videos.length + 1) {
        return <DropdownOption>כל הסרטונים</DropdownOption>;
      }
      return (
        <DropdownOption>
          <Flex>
            {item.map(option => (
              <Persona
                imageUrl={`${window._env_.REACT_APP_STREAMER_HOSTNAME}/${option.key}/thumbnail.png`}
                text={option.text}
                size={PersonaSize.size24}
                secondaryText={option.key}
                onRenderCoin={this.onRenderVideoCoin}
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
            'כל הסרטונים'
          ) : (
            <Persona
              imageUrl={`${window._env_.REACT_APP_STREAMER_HOSTNAME}/${option.key}/thumbnail.png`}
              text={option.text}
              size={type === 'title' ? PersonaSize.size24 : PersonaSize.size40}
              secondaryText={option.key === 'all' ? null : option.key}
              onRenderCoin={this.onRenderVideoCoin}
            />
          )}
        </Box>
      </DropdownOption>
    );
  };

  getSelectedKeys() {
    if (this.props.selected !== undefined && this.props.selected !== null) {
      if (
        Array.isArray(this.props.selected) &&
        this.props.selected.length === this.props.videos.length
      ) {
        return ['all'].concat(this.props.selected);
      }
      return this.props.selected;
    }
    return this.state.selected;
  }

  render() {
    const { label, className, multiSelect, allSelect, videos } = this.props;
    const selected = this.getSelectedKeys();

    const dropdownProps = multiSelect
      ? {
          selectedKeys: selected,
          multiSelect: true,
        }
      : {
          selectedKey: Array.isArray(selected) ? selected[0] : selected,
        };

    return (
      <Dropdown
        className={className}
        label={label || 'סרטון:'}
        onChange={this.onChange}
        onRenderTitle={this.onRenderChannelTitle}
        onRenderOption={this.onRenderChannelOption}
        options={[
          ...(allSelect
            ? [
                { key: 'all', text: 'כל הסרטונים' },
                { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
              ]
            : []),
          ...videos.map(({ id: key, name: text, ...data }) => ({
            key,
            text,
            ...data,
          })),
        ]}
        {...dropdownProps}
      />
    );
  }
}

export default VideoSelector;
