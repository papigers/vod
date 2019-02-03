import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup';

const QuotaSize = styled(Box)`
  direction: ltr;
  font-size: 20px;
`;

const QuotaSaving = styled.div`
  margin: 0 -5px;
  margin-top: 5px;
  padding: 6px 10px;
  background: ${({ theme }) => theme.palette.themeLight};
  font-size: 12px;
`;

const QuotaField = styled.div`
  position: relative;

  &::before {
    content: ${({ description }) => `"${description}"`};
    top: 20px;
    left: 0;
    right: 0;
    position: absolute;
    display: block;
    color: #fff;
    width: 100%;
    z-index: 1;
    font-size: 16px;
    text-align: center;
  }
`;

const QuotaPicker = styled(ChoiceGroup)`
  .ms-ChoiceField {
    margin: 4px 6px;

    &:first-child {
      margin-right: 0;
    }
  }

  .ms-ChoiceFieldGroup-flexContainer {
    justify-content: center;
  }

  .ms-ChoiceField label {
    min-height: 200px;
    width: 110px;
    box-sizing: border-box;
    justify-content: flex-start;
    padding-top: 0;
  }

  .ms-ChoiceField input[type='radio']:not(:checked) + div > label:not(:hover) {
    border-color: ${({ theme }) => theme.palette.neutralQuaternaryAlt};
  }

  .ms-ChoiceField-innerField {
    width: 100%;
    padding-top: 50px;
    padding-bottom: 40px;
    background-color: ${({ theme }) => theme.palette.themeSecondary};
    color: #fff;
    margin-bottom: -12px;

    &::before {
      display: block;
      content: '';
      background: ${({ theme }) => theme.palette.neutralLighter};
      height: 20px;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      border-top-left-radius: 80%;
      border-top-right-radius: 80%;
    }
  }

  .ms-ChoiceField-field::before,
  .ms-ChoiceField-field::after {
    z-index: 1;
  }

  .ms-ChoiceField-labelWrapper {
    flex-grow: 1;
    max-width: none !important;
  }
`;

// .ms-ChoiceField-field::before,
// .ms-ChoiceField-field::after {
//   display: none;
// }

const BASE_PRICE = 499;

class QuotaPlanSelector extends Component {
  onRenderQuotaField = (props, render) => <QuotaField {...props}>{render(props)}</QuotaField>;

  onRenderQuotaLabel = props => {
    const size = +props.size.match(/^([0-9]+)\s*[MGT]B$/)[1];
    const saving = size * BASE_PRICE - props.price;
    return (
      <div>
        <QuotaSize p={2}>{props.size}</QuotaSize>
        <div>{props.price ? `${props.price}$ / לשנה` : 'חינם'}</div>
        {props.price && saving ? <QuotaSaving>{saving}$ חיסכון!</QuotaSaving> : null}
        {!props.price ? <QuotaSaving>עד סרטון אחד</QuotaSaving> : null}
      </div>
    );
  };

  render() {
    const { onChangePlan, onChangeEMF, emf, selectedPlan } = this.props;
    return (
      <Flex>
        <QuotaPicker
          selectedKey={selectedPlan}
          onChange={onChangePlan}
          options={[
            { key: 'free', description: 'ניסיון', iconProps: { iconName: 'Unknown' }, size: '100 MB', price: 0 },
            { key: '1', description: 'ערוץ הילדים', iconProps: { iconName: 'EmojiDisappointed' }, size: '1 GB', price: 499 },
            { key: '2', description: 'קולנוע ישראלי', iconProps: { iconName: 'EmojiNeutral' }, size: '2 GB', price: 899 },
            { key: '5', description: 'HBO', iconProps: { iconName: 'Emoji2' }, size: '5 GB', price: 2249 },
            { key: '10', description: 'אוסקר', iconProps: { iconName: 'Emoji' }, size: '10 GB', price: 3999 },
          ].map(opt => ({
            ...opt,
            onRenderField: this.onRenderQuotaField,
            onRenderLabel: this.onRenderQuotaLabel,
          }))}
        />
        <Box mx={2} />
        {selectedPlan !== 'free' ? (
          <TextField
            label="מזהה אישור העברה"
            required
            placeholder="מס' EMF"
            value={emf}
            onChange={onChangeEMF}
          />
        ) : null}
      </Flex>
    );
  }
}

export default QuotaPlanSelector;
