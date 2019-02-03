import React, { Component } from 'react';
import styled from 'styled-components';

import { ldapAxios } from 'utils/axios';

import { CompactPeoplePicker } from 'office-ui-fabric-react/lib/Pickers';
import { Label } from 'office-ui-fabric-react/lib/Label';

const PickerContainer = styled.div`
  .ms-BasePicker {
    background-color: ${({ theme }) => theme.palette.white};
  }

  .ms-BasePicker-selectedItems {
    display: ${({ selectedItems }) => (selectedItems.length ? 'flex' : 'none')};
    flex-direction: column;
    align-items: start;
    background-color: ${({ theme }) => theme.palette.white};
    border: 1px solid;
    border-color: ${({ theme }) => theme.palette.black};
    padding: 6px;
    margin-top: 4px;

    .ms-PickerPersona-container {
      margin: 4px 0;
    }
  }
`;

const suggestionProps = {
  suggestionsHeaderText: 'תוצאות חיפוש',
  noResultsFoundText: 'אין תוצאות',
  resultsFooter: 'אין תוצאות',
  loadingText: 'טוען...',
  suggestionsContainerAriaLabel: 'תוצאות חיפוש',
  resultsMaximumNumber: 10,
};

class PeoplePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPicker: 1,
      currentSelectedItems: [],
    };
  }

  componentDidMount() {
    if (this.props.value && this.props.value.length) {
      this.propsADLookup();
    }
  }

  componentDidUpdate(prevProps) {
    if (
      (this.props.value &&
        this.props.value.length &&
        this.props.value.length !== (prevProps.value && prevProps.value.length)) ||
      (this.props.value &&
        this.props.value.length &&
        this.props.value.length !==
          (this.state.currentSelectedItems && this.state.currentSelectedItems.length))
    ) {
      this.propsADLookup();
    }
  }

  propsADLookup() {
    Promise.all(
      this.props.value.map(
        people =>
          new Promise((resolve, reject) => {
            ldapAxios
              .post(`/search/${people.type === 'AD_GROUP' ? 'group' : 'user'}`, {
                filter: people.id,
              })
              .then(({ data: { results } }) => {
                if (results.length) {
                  const obj = this.reformatResults(results, [])[0];
                  resolve(obj);
                }
                resolve(null);
              })
              .catch(reject);
          }),
      ),
    ).then(results => {
      const selected = results.filter(res => !!res);
      this.setState({ currentSelectedItems: selected });
      this.onChange(selected);
    });
  }

  render() {
    return (
      <PickerContainer
        className={this.props.className}
        selectedItems={this.state.currentSelectedItems}
      >
        <Label>{this.props.label}</Label>
        <CompactPeoplePicker
          disabled={this.props.disabled}
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

  onChange = currentSelectedItems => {
    if (this.props.onChange) {
      this.props.onChange(
        currentSelectedItems.map(item => ({
          id: item.secondaryText,
          type: item.type,
        })),
      );
    }
    this.setState({ currentSelectedItems });
  };

  renderFooterText = () => {
    return <div>אין תוצאות</div>;
  };

  reformatResults = (results, selected) => {
    return results
      .map(res => {
        if (res.objectClass.indexOf('user') !== -1) {
          return {
            text: res.displayName || res.sAMAccountName,
            secondaryText: res.sAMAccountName,
            imageUrl: '/images/user.svg',
            type: 'USER',
          };
        } else if (res.objectClass.indexOf('group') !== -1) {
          return {
            text: res.displayName || res.cn,
            secondaryText: res.dn,
            imageUrl: '/images/group.svg',
            type: 'AD_GROUP',
          };
        }
        return null;
      })
      .filter(res => {
        if (!res) {
          return false;
        }
        if (!selected) {
          return true;
        }
        const index = selected.findIndex(u => {
          return u.secondaryText === res.secondaryText;
        });
        return index === -1;
      });
  };

  onFilterChanged = (filter, currentSelected, limitResults) => {
    if (filter) {
      return new Promise((resolve, reject) => {
        ldapAxios
          .post('/search', {
            filter,
          })
          .then(({ data: { results } }) => {
            const reformatted = this.reformatResults(results, currentSelected);
            const limited = limitResults ? reformatted.slice(0, limitResults) : reformatted;
            resolve(limited);
          })
          .catch(reject);
      });
    } else {
      return [];
    }
  };
}

export default PeoplePicker;
