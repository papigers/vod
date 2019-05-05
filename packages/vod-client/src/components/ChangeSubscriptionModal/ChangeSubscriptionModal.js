import React, { Component, Fragment } from 'react';
import { Box, Flex } from 'grid-styled';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Link as FabricLink } from 'office-ui-fabric-react/lib/Link';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

import QuotaPlanSelector from 'components/QuotaPlanSelector';
import QuotaPlans from 'components/QuotaPlans';
import Modal from 'components/Modal';
import axios from 'utils/axios';

const Separator = styled(Box)`
  background-color: ${({ theme }) => theme.semanticColors.bodyDivider};
`;

const SubDate = styled.div`
  font-weight: 500;
  text-align: center;
  margin: 2px auto;
  padding: 10px;
`;

const PriceTable = styled(Box)`
  display: table;
  border-collapse: collapse;
`;

const PriceBox = styled(Box)`
  display: table-row;
  position: relative;
  ${({ total, theme }) =>
    total
      ? css`
          font-size: 1.1em;
          font-weight: 600;
          border-top: 2px solid ${theme.semanticColors.bodyDivider};
        `
      : ''}

  span {
    display: table-cell;
    padding: 2px 4px;
  }

  ${({ discount, theme }) =>
    discount
      ? css`
          & > span:last-child {
            color: ${theme.palette.themePrimary};
            font-weight: 500;
          }
        `
      : ''}

  & > span:first-child {
    font-weight: 500;
    font-size: 110%;
  }
`;

const Buttons = styled(Box)`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  background: ${({ theme }) => theme.palette.bodyBackground};
  z-index: 0;
`;

class ChangeSubscriptionModal extends Component {
  constructor() {
    super();
    this.state = {
      isSubModalOpen: false,
      currentAmount: null,
      unverifiedAmount: null,
      plan: null,
      startDate: new Date(),
      loading: false,
      error: null,
    };
  }

  componentDidMount() {
    this.loadCurrentAmount();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.isSubModalOpen && this.state.isSubModalOpen) {
      this.loadCurrentAmount();
    }
  }

  loadCurrentAmount() {
    axios
      .get('/channels/balance')
      .then(({ data: { balance: currentAmount } }) => this.setState({ currentAmount }))
      .catch(err => {
        console.log(err);
        this.setState({ currentAmount: 0 });
      });
    axios
      .get('/channels/balance-unverified')
      .then(({ data: { balance: unverifiedAmount } }) => this.setState({ unverifiedAmount }))
      .catch(err => {
        console.log(err);
        this.setState({ unverifiedAmount: null });
      });
  }

  toggleSubModalOpen = () => {
    if (this.state.isSubModalOpen) {
      this.setState({
        isSubModalOpen: false,
        plan: null,
        startDate: new Date(),
      });
    } else {
      this.setState({ isSubModalOpen: true });
    }
  };
  onChangePlan = plan => this.setState({ plan });
  onSelectDate = date => this.setState({ startDate: date });
  isPlanDisabled = plan => {
    const { currentSubscription: sub } = this.props;
    return plan.price < sub.plan.price || !plan.price;
  };
  onSubmit = () => {
    this.setState({ loading: true, error: null });
    axios
      .post('/transactions/subscription', {
        plan: this.state.plan,
        channel: this.props.channelId,
      })
      .then(() => {
        this.setState({ loading: false });
        if (this.props.onSubmit) {
          this.props.onSubmit();
        }
        this.toggleSubModalOpen();
      })
      .catch(err => {
        console.log(err);
        this.setState({ error: err, loading: false });
      });
  };

  render() {
    const {
      unverifiedAmount,
      currentAmount,
      plan,
      startDate,
      isSubModalOpen,
      error,
      loading: loadingSubmit,
    } = this.state;
    const { currentSubscription, loading } = this.props;

    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);

    const subFrom = new Date(currentSubscription.from);
    const subTo = new Date(currentSubscription.to);

    const discount = Math.ceil(
      ((subTo - startDate) / (subTo - subFrom)) * currentSubscription.plan.price,
    );

    return (
      <Fragment>
        <PrimaryButton onClick={this.toggleSubModalOpen}>חידוש/שינוי מנוי</PrimaryButton>
        <Modal isOpen={isSubModalOpen} title="חידוש/שינוי מנוי" onDismiss={this.toggleSubModalOpen}>
          <Box mb={40}>
            {error ? (
              <MessageBar messageBarType={MessageBarType.error} dismissButtonAriaLabel="סגור">
                חלה שגיאה בשינוי המנוי, אנא נסה/י שנית מאוחר יותר
              </MessageBar>
            ) : null}
            <Flex flexDirection="column">
              <Flex>
                <Box>
                  <Label>מנוי נוכחי</Label>
                  <QuotaPlans
                    displayOnly
                    plans={{
                      [currentSubscription.plan.id]: {
                        ...currentSubscription.plan,
                      },
                    }}
                  />
                  <SubDate>
                    {new Date(subTo).getFullYear() - new Date(subFrom).getFullYear() >= 10
                      ? 'ללא הגבלה'
                      : `${new Date(subTo).toLocaleDateString()} - ${new Date(
                          subFrom,
                        ).toLocaleDateString()}`}
                  </SubDate>
                  <PriceBox>
                    <span>סכום ששולם:</span>
                    <span>{currentSubscription.plan.price}$</span>
                  </PriceBox>
                  <PriceBox>
                    <span>סכום שנותר:</span>
                    <span>{discount}$</span>
                  </PriceBox>
                </Box>
                <Separator width="2px" mx={2} />
                <Box>
                  <Label>מנוי חדש</Label>
                  <QuotaPlanSelector
                    selectedPlan={plan && plan.id}
                    onChangePlan={this.onChangePlan}
                    isPlanDisabled={this.isPlanDisabled}
                  />
                  <Box>
                    <SubDate>
                      {endDate.toLocaleDateString()} - {startDate.toLocaleDateString()}
                    </SubDate>
                  </Box>
                  <Flex flexDirection="column" alignItems="center">
                    <PriceTable>
                      <PriceBox>
                        <span>מחיר:</span>
                        <span>{plan ? `${plan.price}$` : 'לא נבחר מנוי'}</span>
                      </PriceBox>
                      <PriceBox discount>
                        <span>הנחה:</span>
                        <span>{discount}$-</span>
                      </PriceBox>
                      {/* <Separator width={1} py="0.8px" my="2px" /> */}
                      <PriceBox total>
                        <span>סה"כ:</span>
                        <span>{plan ? `${plan.price - discount}$` : 'לא נבחר מנוי'}</span>
                      </PriceBox>
                    </PriceTable>
                  </Flex>
                </Box>
              </Flex>
              <Separator width={1} py="1px" my="2px" />
              {unverifiedAmount && unverifiedAmount > 0 ? (
                <Box mx="auto" mb={2}>
                  ברשותך {unverifiedAmount}$ ממתינים לאישור -{' '}
                  <Link to="/mgmt/my-workflows">
                    <FabricLink>צפייה</FabricLink>
                  </Link>
                </Box>
              ) : null}
              <Flex alignItems="center" justifyContent="center">
                <Box mx={2} />
                <Flex flexDirection="column" alignItems="center">
                  <PriceTable>
                    <PriceBox>
                      <span>קרדיט:</span>
                      <span>{currentAmount}$</span>
                    </PriceBox>
                    <PriceBox discount>
                      <span>מחיר:</span>
                      <span>{plan ? `${plan.price - discount}$-` : 'לא נבחר מנוי'}</span>
                    </PriceBox>
                    {/* <Separator width={1} py="0.8px" my="2px" /> */}
                    <PriceBox total>
                      <span>קרדיט לאחר רכישה:</span>
                      <span dir="ltr">
                        {plan ? `${currentAmount - plan.price + discount}$` : `${currentAmount}$`}
                      </span>
                    </PriceBox>
                  </PriceTable>
                </Flex>
              </Flex>
            </Flex>
          </Box>
          <Buttons py={2} px={32}>
            <Flex>
              {loading || loadingSubmit ? (
                <Fragment>
                  <Spinner size={SpinnerSize.large} />
                  <Box mx={3} />
                </Fragment>
              ) : null}
              <PrimaryButton
                disabled={loading || loadingSubmit || !plan || currentAmount - plan.price < 0}
                text="אישור תשלום"
                onClick={this.onSubmit}
              />
              <Box mx={3} />
              <DefaultButton text="ביטול" onClick={this.toggleSubModalOpen} />
            </Flex>
          </Buttons>
        </Modal>
      </Fragment>
    );
  }
}

export default ChangeSubscriptionModal;
