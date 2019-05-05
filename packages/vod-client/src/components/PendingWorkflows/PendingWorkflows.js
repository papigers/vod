import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { Box } from 'grid-styled';
import { withRouter } from 'react-router';

import { Selection } from 'office-ui-fabric-react/lib/Selection';
import { ScrollablePane, ScrollbarVisibility } from 'office-ui-fabric-react/lib/ScrollablePane';
import { SelectionMode, CheckboxVisibility } from 'office-ui-fabric-react/lib/DetailsList';
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';

import workflowColumns from './columns';
import axios from 'utils/axios';

const List = styled(ShimmeredDetailsList)`
  ${({ compact, enableShimmer }) =>
    enableShimmer && compact
      ? css`
          & .ms-List-cell:nth-child(n + 6) {
            display: none;
          }
        `
      : css([])}
  ${({ theme }) =>
    theme.name === 'dark'
      ? css`
          & .ms-List::after {
            background-image: linear-gradient(
              transparent 30%,
              rgba(18, 18, 18, 0.4) 65%,
              rgb(18, 18, 18) 100%
            );
          }
        `
      : css([])}
`;

class SubmittedWorkflows extends Component {
  constructor() {
    super();
    this.state = {
      workflowList: [],
      selection: new Selection({ onSelectionChanged: this.onSelectionChanged }),
      selectionDetails: [],
      loading: true,
    };
  }

  componentDidMount() {
    this.fetchMyRequestedWorkflows();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.type !== this.props.type || prevProps.minimal !== this.props.minimal) {
      this.fetchMyRequestedWorkflows();
    }
  }

  fetchMyRequestedWorkflows = () => {
    let req = '/workflows';
    if (this.props.minimal) {
      req += '&limit=5';
    }
    this.setState({
      workflowList: [],
      loading: true,
    });
    axios
      .get(req)
      .then(({ data }) => {
        this.setState({
          workflowList: data,
          loading: false,
        });
      })
      .catch(err => {
        this.setState({ loading: false });
        console.error(err);
      });
  };

  onSelectionChanged = () => {
    const selection = this.state.selection.getSelection();
    if (selection.length) {
      this.props.history.push(`/mgmt/workflows/${selection[0].id}`);
    }
  };

  getItemList() {
    const { workflowList: itemsList } = this.state;
    const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };

    if (!itemsList.length) {
      return [];
    }

    return itemsList.map(item => {
      let name = '';
      switch (item.type) {
        case 'CREATE_CHANNEL':
          name = `יצירת ערוץ: ${item.channel.id} (מנוי: ${item.subscription.plan.name})`;
          break;
        case 'LOAD_CREDIT':
          name = `טעינת קרדיט: ${item.transaction.amount}$`;
          break;
        default:
      }

      let state = '';
      switch (item.lastStep.state) {
        case 'IN_PROGRESS':
          state = 'ממתין לאישור - ';
          switch (item.lastStep.name) {
            case 'KABAM':
              state += 'קב"ם';
              break;
            case 'KETER':
              state += 'כת"ר';
              break;
            default:
              state += 'shit';
          }
          break;
        case 'APPROVED':
          state = 'אושר';
          break;
        case 'REJECTED':
          state = 'נדחה';
          break;
        case 'TIMEOUT':
          state = 'פג תוקף';
          break;
        case 'CANCELED':
          state = 'בוטל ע"י המשתמש';
          break;
        default:
      }

      return {
        id: item.id,
        name,
        state,
        requester: (
          <Persona
            text={item.requester.name}
            imageUrl={`/profile/${item.requester.id}/profile.png`}
            size={PersonaSize.size10}
          />
        ),
        comment: item.lastStep.comment,
        createdAt: new Date(item.createdAt).toLocaleDateString('hebrew', options),
        updatedAt: new Date(item.updatedAt).toLocaleDateString('hebrew', options),
      };
    });
  }

  render() {
    const { selection, loading } = this.state;
    const { minimal, className } = this.props;

    let columns = workflowColumns;
    if (!this.props.minimal) {
      columns = columns.map(col => ({
        ...col,
        minWidth: col.minWidth * 1.5,
        maxWidth: col.maxWidth * 2,
      }));
    }

    return (
      <div
        style={{ position: 'relative', flexGrow: 1, flexShrink: 0, width: '100%' }}
        className={className}
      >
        <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
          <Box>
            <List
              setKey="workflows"
              items={this.getItemList()}
              columns={columns}
              selection={selection}
              compact={minimal}
              checkboxVisibility={CheckboxVisibility.hidden}
              ariaLabelForSelectionColumn="לחץ לבחירה"
              selectionMode={SelectionMode.single}
              enableShimmer={loading}
              listProps={{ renderedWindowsAhead: 1, renderedWindowsBehind: 1 }}
            />
          </Box>
        </ScrollablePane>
      </div>
    );
  }
}

export default withRouter(SubmittedWorkflows);
