import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';

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

class ChannelSelector extends Component {
  constructor(props) {
    super();
    this.state = {
      selected: props.selected || (props.multiSelect ? [] : null),
    };
  }

  setSelectedKeys = selected => {
    if (this.props.onChange) {
      this.props.onChange(Array.isArray(selected) ? selected.filter(ch => ch !== 'all') : selected);
    }
    this.setState({ selected });
  };

  onChange = (e, item) => {
    const { allSelect, multiSelect, channels } = this.props;
    if (multiSelect) {
      let selected = this.getSelectedKeys();
      if (item.key === 'all') {
        if (item.selected) {
          return this.setSelectedKeys(['all'].concat(channels.map(ch => ch.id)));
        }
        return this.setSelectedKeys([channels[0].id]);
      }
      if (item.selected) {
        if (allSelect && selected.length + 1 === channels.length) {
          return this.setSelectedKeys(['all'].concat(channels.map(ch => ch.id)));
        }
        return this.setSelectedKeys(selected.concat([item.key]));
      } else if (selected.length > 1) {
        return this.setSelectedKeys(selected.filter(ch => ch !== item.key && ch !== 'all'));
      }
    } else {
      return this.setSelectedKeys(item.key);
    }
  };

  onRenderChannelTitle = item => this.onRenderChannelOption(item, 'title');

  onRenderChannelOption = (item, type) => {
    const option = item[0] || item;
    const { multiSelect, allSelect, channels } = this.props;

    if (type === 'title' && multiSelect) {
      if (allSelect && item.length === channels.length + 1) {
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

  getSelectedKeys() {
    if (this.props.selected !== undefined && this.props.selected !== null) {
      if (
        Array.isArray(this.props.selected) &&
        this.props.selected.length === this.props.channels.length
      ) {
        return ['all'].concat(this.props.selected);
      }
      return this.props.selected;
    }
    return this.state.selected;
  }

  render() {
    const { label, className, multiSelect, allSelect, channels } = this.props;
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
        label={label || 'ערוץ:'}
        onChange={this.onChange}
        onRenderTitle={this.onRenderChannelTitle}
        onRenderOption={this.onRenderChannelOption}
        options={[
          ...(multiSelect && allSelect
            ? [
                { key: 'all', text: 'כל הערוצים בניהולי' },
                { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
              ]
            : []),
          ...channels.map(({ id: key, name: text, ...data }) => ({
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

export default ChannelSelector;
