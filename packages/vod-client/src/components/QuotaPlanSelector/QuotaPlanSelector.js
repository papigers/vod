import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex } from 'grid-styled';

import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import axios from 'utils/axios';
import QuotaPlans from '../QuotaPlans';

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

  onChangePlan = (e, { key: id }) => {
    if (this.props.onChangePlan) {
      this.props.onChangePlan(this.state.plans[id]);
    }
  };

  render() {
    const { plans, loading } = this.state;
    const { displayOnly, selectedPlan, isPlanDisabled } = this.props;
    return (
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        {loading ? (
          <LargeSpinner size={SpinnerSize.large} label="...טוען מנויים" />
        ) : (
          <QuotaPlans
            isPlanDisabled={isPlanDisabled}
            plans={plans}
            onChangePlan={this.onChangePlan}
            selectedPlan={selectedPlan}
            displayOnly={displayOnly}
          />
        )}
      </Flex>
    );
  }
}

export default QuotaPlanSelector;
