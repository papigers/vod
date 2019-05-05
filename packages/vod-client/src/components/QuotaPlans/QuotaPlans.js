import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { Box } from 'grid-styled';

import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup';

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

  .ms-ChoiceField-labelWrapper {
    flex-grow: 1;
    max-width: none !important;
  }

  .ms-ChoiceField input[type='radio']:not(:checked):not(:disabled) + div > label:not(:hover) {
    border-color: ${({ theme }) => theme.palette.neutralQuaternaryAlt};
  }

  .ms-ChoiceField input[type='radio']:disabled + div .ms-ChoiceField-labelWrapper {
    opacity: 0.35;
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

  ${({ displayOnly }) =>
    displayOnly
      ? css`
          .ms-ChoiceField label {
            cursor: default;
          }

          .ms-ChoiceField-field::before,
          .ms-ChoiceField-field::after {
            display: none;
          }
        `
      : css([])}
`;

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

const stringifySize = size => {
  if (size >= 1024) {
    return `${size / 1024} GB`;
  }
  return `${size} MB`;
};

const BASE_PRICE = 499;

const PLAN_ICONS = {
  free: 'Unknown',
  test: 'TestBeakerSolid',
  personal: 'Contact',
  1: 'EmojiDisappointed',
  2: 'EmojiNeutral',
  5: 'Emoji2',
  10: 'Emoji',
};

class QuotaPlans extends Component {
  onRenderQuotaField = (props, render) => <QuotaField {...props}>{render(props)}</QuotaField>;

  onRenderQuotaLabel = props => {
    const saving = Math.floor(
      (BASE_PRICE - props.price / (props.size / 1024)) * (props.size / 1024),
    );
    return (
      <div>
        <QuotaSize p={2}>{stringifySize(props.size)}</QuotaSize>
        <div>{props.price ? `${props.price}$ / לשנה` : 'חינם'}</div>
        {props.price && saving ? <QuotaSaving>{saving}$ חיסכון!</QuotaSaving> : null}
        {props.videos ? (
          <QuotaSaving>
            {props.videos === 1 ? 'עד סרטון אחד' : `עד ${props.videos} סרטונים`}
          </QuotaSaving>
        ) : null}
      </div>
    );
  };

  reformatPlans() {
    const { plans, isPlanDisabled } = this.props;
    return Object.keys(plans)
      .map(planId => ({
        key: planId,
        description: plans[planId].name,
        iconProps: { iconName: PLAN_ICONS[planId] },
        size: plans[planId].sizeQuota,
        videos: plans[planId].videoQuota,
        price: plans[planId].price,
        onRenderField: this.onRenderQuotaField,
        onRenderLabel: this.onRenderQuotaLabel,
        disabled: isPlanDisabled ? isPlanDisabled(plans[planId]) : false,
      }))
      .sort((plan1, plan2) => plan1.price - plan2.price);
  }

  render() {
    const { selectedPlan, onChangePlan, displayOnly } = this.props;

    return (
      <QuotaPicker
        selectedKey={selectedPlan}
        onChange={onChangePlan}
        options={this.reformatPlans()}
        displayOnly={displayOnly}
      />
    );
  }
}

export default QuotaPlans;
