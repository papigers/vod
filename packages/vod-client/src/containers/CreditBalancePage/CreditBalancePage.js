import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';
import { Link } from 'react-router-dom';

import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { ActivityItem } from 'office-ui-fabric-react/lib/ActivityItem';
import { Link as FabricLink } from 'office-ui-fabric-react/lib/Link';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';

import axios from 'utils/axios';

const BigActivityItem = styled(ActivityItem)`
  .ms-ActivityItem-activityTypeIcon,
  .ms-ActivityItem-personaContainer,
  .ms-Persona-imageArea,
  .ms-Persona-image {
    width: 40px !important;
    height: 40px !important;
  }

  .ms-ActivityItem-activityText {
    font-size: 1.2em;
  }

  .ms-ActivityItem-timeStamp {
    font-size: 0.9em;
  }

  .ms-ActivityItem-activityContent {
    height: 40px;
    margin-top: 6px;
  }
`;

const Total = styled(Flex)`
  font-size: 1.2em;
  direction: ltr;
  font-weight: 600;
  height: 100%;
  justify-content: flex-end;

  &::after {
    content: '$';
    display: inline-block;
    position: relative;
  }
`;

const Amount = styled(Total)`
  &::before {
    content: ${({ positive }) => (positive ? '"+"' : '"-"')};
    display: inline-block;
    position: relative;
  }

  font-weight: 400;
  color: ${({ theme, positive }) => (positive ? theme.palette.green : theme.palette.red)};
`;

class CreditBalancePage extends Component {
  constructor() {
    super();
    this.state = {
      report: null,
      loading: false,
      error: null,
      currentAmount: 0,
      unverifiedAmount: 0,
    };
  }
  componentDidMount() {
    this.fetchReport();
    this.loadCurrentAmount();
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

  fetchReport() {
    this.setState({ error: null, loading: true });
    axios
      .get('/transactions/report')
      .then(res =>
        this.setState({
          report: res.data,
          loading: false,
        }),
      )
      .catch(err => {
        console.log(err);
        this.setState({ error: err, loading: false });
      });
  }

  renderItemDescription(item) {
    switch (item.type) {
      case 'LOAD_CREDIT':
        return `טעינת קרדיט: ${item.amount}$`;
      case 'CREATE_SUBSCRIPTION':
        return (
          <div>
            רכישת מנוי עבור הערוץ:{' '}
            <Link to={`/channel/${item.subject.channel.id}`}>
              <FabricLink>{item.subject.channel.name}</FabricLink>
            </Link>
          </div>
        );
      default:
        return;
    }
  }

  renderReportItem(item) {
    if (item) {
      return (
        <Box>
          <BigActivityItem
            activityPersonas={[
              {
                imageUrl: `/profile/${(item.subject && item.subject.channel.id) ||
                  item.channelId}/profile.png`,
              },
            ]}
            activityDescription={this.renderItemDescription(item)}
            timeStamp={new Date(item.updatedAt).toLocaleString()}
          />
        </Box>
      );
    }
  }

  renderTotal(total) {
    return <Total alignItems="center">{total}</Total>;
  }

  renderAmount(amount) {
    var positive = amount >= 0;
    return (
      <Amount alignItems="center" positive={positive}>
        {Math.abs(amount)}
      </Amount>
    );
  }

  getReportItems() {
    const { report } = this.state;
    let total = 0;
    return report
      ? report.map(item => {
          total += item.amount;
          return {
            activity: this.renderReportItem(item),
            amount: this.renderAmount(item.amount),
            total: this.renderTotal(total),
          };
        })
      : [];
  }
  render() {
    const { error, currentAmount, unverifiedAmount } = this.state;
    return (
      <Box width={0.7} mx="auto">
        <Flex flexDirection="column" alignItems="center">
          <h1>עו"ש</h1>
          <Box mx="auto" mb={2}>
            ברשותך {currentAmount}$.
          </Box>
          {unverifiedAmount && unverifiedAmount > 0 ? (
            <Box mx="auto" mb={2}>
              ברשותך {unverifiedAmount}$ ממתינים לאישור -{' '}
              <Link to="/mgmt/my-workflows">
                <FabricLink>צפייה</FabricLink>
              </Link>
              .
            </Box>
          ) : null}
        </Flex>
        <Box>
          {error ? (
            <MessageBar messageBarType={MessageBarType.error} dismissButtonAriaLabel="סגור">
              חלה שגיאה בשליפת העובר ושב
            </MessageBar>
          ) : null}
          <DetailsList
            items={this.getReportItems().reverse()}
            selectionMode={SelectionMode.none}
            columns={[
              {
                key: 'activity',
                name: 'פעילות',
                fieldName: 'activity',
              },
              {
                key: 'amount',
                name: 'שינוי',
                fieldName: 'amount',
              },
              {
                key: 'total',
                fieldName: 'total',
                name: 'סה"כ',
              },
            ]}
          />
        </Box>
      </Box>
    );
  }
}

export default CreditBalancePage;
