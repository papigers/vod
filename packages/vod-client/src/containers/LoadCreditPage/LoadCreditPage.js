import React, { Component } from 'react';
import { Box, Flex } from 'grid-styled';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import { SpinButton } from 'office-ui-fabric-react/lib/SpinButton';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Button } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Link as FabricLink } from 'office-ui-fabric-react/lib/Link';

import QuotaPlanSelector from 'components/QuotaPlanSelector';
import axios from 'utils/axios';

const Header = styled.h1`
  text-align: center;
  font-size: 2.2em;
`;

const CenterLabel = styled.div`
  text-align: center;
  font-size: 1.2em;
  margin: 5px 0;
`;

const TableBill = styled(Box)`
  border-collapse: collapse;
`;

const RowBill = styled.div`
  display: table-row;
  font-size: 1.1em;

  & > div {
    display: table-cell;
    padding: 2px 0;
    padding-left: 10px;
  }

  & > div:first-child {
    font-weight: 600;
  }

  ${({ theme, divider }) =>
    divider
      ? css`
          border-top: 2px solid ${theme.semanticColors.bodyDivider};
        `
      : ''}
`;

const AmountInput = styled(SpinButton)`
  margin: 3px 0;
  max-width: 100px;
`;

class LoadCreditPage extends Component {
  constructor() {
    super();
    this.state = {
      currentAmount: 0,
      loadAmount: 0,
      unverifiedAmount: null,
      emf: null,
      loadingBalance: false,
      loading: false,
    };
  }

  componentDidMount() {
    this.loadCurrentAmount();
  }

  componentDidUpdate() {
    // this.loadCurrentAmount();
  }

  loadCurrentAmount() {
    this.setState({ loadingBalance: true });
    axios
      .get('/channels/balance')
      .then(({ data: { balance: currentAmount } }) =>
        this.setState({ currentAmount, loadingBalance: false }),
      )
      .catch(err => {
        console.log(err);
        this.setState({ currentAmount: 0, loadingBalance: false });
      });
    axios
      .get('/channels/balance-unverified')
      .then(({ data: { balance: unverifiedAmount } }) => this.setState({ unverifiedAmount }))
      .catch(err => {
        console.log(err);
        this.setState({ unverifiedAmount: null });
      });
  }

  onSubmit = () => {
    this.setState({ loading: true });
    axios
      .post('/transactions', {
        emf: this.state.emf,
        amount: this.state.loadAmount,
      })
      .then(() => {
        this.setState({ loading: false });
        this.loadCurrentAmount();
      })
      .catch(err => {
        console.log(err);
        this.setState({ loading: false });
      })
      .finally(() => this.setState({ emf: null, amount: 0 }));
  };

  removeSuffix(value) {
    return value.match(/.*\$$/) ? value.substr(0, value.length - 1) : value;
  }

  onValidate = value => {
    const noSuf = this.removeSuffix(value);
    if (noSuf.trim().length === 0 || isNaN(+noSuf)) {
      this.setState({ loadAmount: 0 });
      return '0$';
    }

    this.setState({ loadAmount: +noSuf });
    return `${noSuf}$`;
  };
  onIncrement = value => {
    const noSuf = this.removeSuffix(value);
    this.setState({ loadAmount: +noSuf + 1 });
    return `${+noSuf + 1}$`;
  };
  onDecrement = value => {
    const noSuf = this.removeSuffix(value);
    this.setState({ loadAmount: +noSuf - 1 });
    return `${+noSuf - 1}$`;
  };
  onChangeEMF = ({ target: { value: emf } }) => this.setState({ emf });

  render() {
    const {
      loading,
      loadingBalance,
      unverifiedAmount,
      loadAmount,
      currentAmount,
      emf,
    } = this.state;

    return (
      <Box width={0.95} mx="auto">
        <Header>טעינת קרדיט</Header>
        <CenterLabel>
          הטעינה תתבצע רק לאחר תהליך אישורים המוודא כי מזהה אישור ההעברה תואם לסכום שהוזן.
        </CenterLabel>
        <Box my="2">
          <CenterLabel> לנוחיותך, להלן מחירון המנויים:</CenterLabel>
          <QuotaPlanSelector displayOnly />
        </Box>
        <Box my="3">
          {!!unverifiedAmount && unverifiedAmount > 0 ? (
            <CenterLabel>
              ברשותך {unverifiedAmount}$ ממתינים לאישור -{' '}
              <Link to="/mgmt/my-workflows">
                <FabricLink>צפייה</FabricLink>
              </Link>
            </CenterLabel>
          ) : null}
          <Box my={3} />
          <form onSubmit={this.onSubmit}>
            <Flex justifyContent="center" alignItems="center">
              {loadingBalance ? (
                <Spinner size={SpinnerSize.large} label="טוען יתרה..." />
              ) : (
                <TableBill>
                  <RowBill>
                    <div>יתרה נוכחית:</div>
                    <div>{currentAmount}$</div>
                  </RowBill>
                  <RowBill>
                    <div>קרדיט לקנייה:</div>
                    <div>
                      <AmountInput
                        value={`${loadAmount}$`}
                        onIncrement={this.onIncrement}
                        onDecrement={this.onDecrement}
                        onValidate={this.onValidate}
                      />
                    </div>
                  </RowBill>
                  <RowBill divider>
                    <div>יתרה סופית:</div>
                    <div>{+currentAmount + loadAmount}$</div>
                  </RowBill>
                </TableBill>
              )}
              <Box mx="2" />
              <Box>
                <TextField
                  label="מזהה אישור העברה"
                  required
                  placeholder="מס' EMF"
                  value={emf}
                  onChange={this.onChangeEMF}
                />
              </Box>
            </Flex>
            <Box my={3}>
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                {loading ? <Spinner size={SpinnerSize.large} /> : null}
                <Box my={1} />
                <Button
                  onClick={this.onSubmit}
                  text="אישור טעינה"
                  primary
                  disabled={!emf || !loadAmount || loading || loadingBalance}
                />
              </Flex>
            </Box>
          </form>
        </Box>
      </Box>
    );
  }
}

export default LoadCreditPage;
