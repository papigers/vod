import React, { Component } from 'react';
import styled from 'styled-components';

import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { TagPicker as Picker } from 'office-ui-fabric-react/lib/Pickers';
import { Label } from 'office-ui-fabric-react/lib/Label';

const TagItem = styled.div`
  position: relative;
  outline: transparent;
  box-sizing: content-box;
  flex-shrink: 1;
  margin: 2px;
  height: 26px;
  line-height: 26px;
  cursor: default;
  user-select: none;
  display: flex;
  flex-wrap: nowrap;
  max-width: 300px;
  background: ${({theme, selected}) => selected ? theme.palette.neutralQuaternary : theme.palette.neutralLighter};

  &:hover {
    background: ${({theme, selected}) => selected ? theme.palette.neutralQuaternaryAlt : theme.palette.neutralLight};
  }
`;

const TagItemText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 30px;
  margin: 0 8px;
`;

const TagItemClose = styled.span`
  cursor: pointer;
  color: #d0d0d0;
  font-size: 12px;
  display: inline-block;
  text-align: center;
  vertical-align: top;
  width: 30px;
  height: 100%;
  flex-shrink: 0;
`;

const StyledPicker = styled(Picker)`
  & .ms-BasePicker-text > span {
    display: flex;
  }
`;

class TagPicker extends Component {

  constructor() {
    super();
    this.state = {
      selected: [],
    };
  }

  componentDidMount() {
    const { tags } = this.props;
    const selected = [];
    if (tags) {
      tags.forEach(tag => {
        selected.push({ name: tag.tag, key: tag.tag });
      });
      this.setState({selected:selected});
    }
  }
  
  addItem = (item) => {
    if (this.state.selected.findIndex(sel => sel.key === item.key) === -1) {
      this.setState({ selected: this.state.selected.concat([item])}, this.onChange);
    }
  }

  onInputChange = (val) => {
    if (val.indexOf(' ') !== -1 && val.trim().length) {
      const tag = val.split(' ')[0];
      this.addItem({ name: tag, key: tag });
      return '';
    }
    return val.trim();
  }

  onResolveSuggestions = (tag) => {
    if (this.state.selected.findIndex(sel => sel.key === tag) !== -1) {
      return [];
    }
    return tag ? [{ key: tag, name: tag }] : [];
  }

  onChange = () => {
    if (this.props.onChange) {
      this.props.onChange(this.state.selected.map(tag => tag.name));
    }
  }

  removeItem = item => {
    this.setState({
      selected: this.state.selected.filter(sel => sel.key !== item.key),
    }, this.onChange);
  }

  onRenderItem = (item) => (
    <TagItem {...item.props}>
      <TagItemText>
        {item.item.name}
      </TagItemText>
      {!item.disabled ? (
        <TagItemClose onClick={() => this.removeItem(item.item)}>
          <Icon iconName="cancel" />
        </TagItemClose>
      ) : null}
    </TagItem>
  );
  
  render() {
    return (
      <div className={this.props.className}>
        <Label>{this.props.label}</Label>
        <StyledPicker
          pickerSuggestionsProps={{
            noResultsFoundText: 'תיוג קיים'
          }}
          getTextFromItem={item => item.name}
          selectedItems={this.state.selected}
          onInputChange={this.onInputChange}
          onItemSelected={this.addItem}
          onResolveSuggestions={this.onResolveSuggestions}
          onRenderItem={this.onRenderItem}
        />
      </div>
    );
  }
}

export default TagPicker;
