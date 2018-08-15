import React, { Component } from 'react';
import styled from 'styled-components';
import { ListPeoplePicker } from 'office-ui-fabric-react/lib/Pickers';
import { Label } from 'office-ui-fabric-react/lib/Label';

const PickerContainer = styled.div`
  .ms-BasePicker {
    background-color: ${({theme}) => theme.palette.white};
  }

  .ms-BasePicker-selectedItems {
    display: ${({selectedItems}) => selectedItems.length ? 'flex' : 'none'};
    flex-direction: column;
    align-items: start;
    background-color: ${({theme}) => theme.palette.white};
    border: 1px solid;
    border-color: ${({theme}) => theme.palette.black};
    padding: 6px;
    margin-top: 4px;

    .ms-PickerPersona-container {
      margin: 4px 0;
    }
  }
`

const suggestionProps = {
  suggestionsHeaderText: 'תוצאות חיפוש',
  noResultsFoundText: 'אין תוצאות',
  resultsFooter: 'אין תוצאות f',
  loadingText: 'טוען...',
  suggestionsContainerAriaLabel: 'תוצאות חיפוש',
  resultsMaximumNumber: 10,
};

const mockPersons = [{
  text: 'גרשון ח פפיאשוילי',
  imageUrl: 'https://scontent.fhfa1-1.fna.fbcdn.net/v/t1.0-1/p480x480/36404826_10212689636864924_812286978346188800_n.jpg?_nc_cat=0&oh=f7b5d42c81a822f2a2e642abb2fafe4c&oe=5C0E4A2A',
  secondaryText: 's7591665', 
}, {
  text: 'שגיא לוי',
  imageUrl: '/images/user.svg',
  secondaryText: 's7123112',
}, {
  text: 'תשתיות ליבה',
  imageUrl: '/images/group.svg',
  secondaryText: 'קבוצה',
}]

class PeoplePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPicker: 1,
      currentSelectedItems: [],
    };
  }

  render() {
    return (
      <PickerContainer className={this.props.className} selectedItems={this.state.currentSelectedItems}>
        <Label>{this.props.label}</Label>
        <ListPeoplePicker
          onResolveSuggestions={this.onFilterChanged}
          getTextFromItem={this.getTextFromItem}
          selectedItems={this.state.currentSelectedItems}
          onChange={this.onChange}
          pickerSuggestionsProps={suggestionProps}
          resolveDelay={300}
        />
      </PickerContainer>
    );
  }

  getTextFromItem(persona) {
    return persona.text;
  }

  onChange = (currentSelectedItems) => {
    if (this.props.onChange) {
      this.props.onChange(currentSelectedItems);
    }
    this.setState({ currentSelectedItems });
  }

  renderFooterText = () => {
    return (
      <div>אין תוצאות</div>
    );
  };

  onFilterChanged = (filterText, currentSelected, limitResults) => {
    if (filterText) {
      return new Promise(resolve => {
        let filteredPersonas = mockPersons.filter(p => {
          return p.text.indexOf(filterText) !== -1 &&
            currentSelected.findIndex(sel => sel.text === p.text) === -1;
        });
        filteredPersonas = limitResults ? filteredPersonas.splice(0, limitResults) : filteredPersonas;
        resolve(filteredPersonas);
      });
    }
    else {
      return [];
    }
  };
}

export default PeoplePicker;
