import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import axios from 'utils/axios';

const LargeSpinner = styled(Spinner)`
  .ms-Spinner-circle {
    width: 60px;
    height: 60px;
    border-width: 6px;
  }

  .ms-Spinner-label {
    font-size: 1.2em;
    direction: ltr;
  }
`;

const SlidingBox = styled(Box)`
  max-height: ${({ show }) => (show ? '60px' : 0)};
  transition: max-height 300ms ease-in-out;
  overflow: hidden;

  label {
    text-align: center;
  }
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

const PLAN_ICONS = {
  free: 'Unknown',
  test: 'TestBeakerSolid',
  1: 'EmojiDisappointed',
  2: 'EmojiNeutral',
  5: 'Emoji2',
  10: 'Emoji',
};

const stringifySize = size => {
  if (size >= 1024) {
    return `${size / 1024} GB`;
  }
  return `${size} MB`;
};

class QuotaPlanSelector extends Component {
  constructor() {
    super();
    this.state = {
      plans: {},
      loading: true,
    };
  }

  componentDidMount() {
    axios.get('/channels/plans').then(({ data }) => {
      const plans = {};
      data.forEach(plan => {
        plans[plan.id] = plan;
      });
      this.setState({ plans, loading: false });
    });
  }

  onRenderQuotaField = (props, render) => <QuotaField {...props}>{render(props)}</QuotaField>;

  onRenderQuotaLabel = props => {
    const saving = Math.floor(BASE_PRICE - props.price / (props.size / 1024));
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
    const { plans } = this.state;
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
      }))
      .sort((plan1, plan2) => plan1.price - plan2.price);
  }

  onChangePlan = (e, { key: id }) => {
    if (this.props.onChangePlan) {
      this.props.onChangePlan(this.state.plans[id]);
    }
  };

  render() {
    const { plans, loading } = this.state;
    const { onChangeEMF, emf, selectedPlan } = this.props;
    return (
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        <SlidingBox mb={10} show={selectedPlan && plans[selectedPlan].price !== 0}>
          <TextField
            label="מזהה אישור העברה"
            required
            placeholder="מס' EMF"
            value={emf}
            onChange={onChangeEMF}
          />
        </SlidingBox>
        {loading ? (
          <LargeSpinner size={SpinnerSize.large} label="...טוען מנויים" />
        ) : (
          <QuotaPicker
            selectedKey={selectedPlan}
            onChange={this.onChangePlan}
            options={this.reformatPlans()}
          />
        )}
      </Flex>
    );
  }
}

export default QuotaPlanSelector;
