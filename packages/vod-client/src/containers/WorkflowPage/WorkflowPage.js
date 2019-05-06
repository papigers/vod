import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';
import { Link } from 'react-router-dom';
import { transparentize } from 'polished';
import { createStructuredSelector } from 'reselect';
import { Helmet } from 'react-helmet';

import createReduxContainer from 'utils/createReduxContainer';

import { makeSelectUser } from 'containers/Root/selectors';

import { Link as FabricLink } from 'office-ui-fabric-react/lib/Link';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { ActivityItem } from 'office-ui-fabric-react/lib/ActivityItem';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

import axios from 'utils/axios';
import ChannelRow from 'containers/ChannelRow';
import QuotaPlans from '../../components/QuotaPlans';

const LoadingSpinner = styled(Spinner)`
  transform: translate(0, 100%);

  .ms-Spinner-circle {
    border-width: 7px;
    width: 100px;
    height: 100px;
  }

  .ms-Spinner-label {
    font-size: 1.3em;
  }
`;

const MiniButton = styled(FabricLink)`
  font-size: 0.85em;
  height: 100%;
  display: block;
`;

const ItemLabel = styled(Label).attrs({
  className: 'ms-fontSize-l',
})`
  text-align: center;
`;

const TableRow = styled(Flex)`
  justify-content: flex-start;
  align-items: normal;
  border: 2px solid ${({ theme }) => theme.semanticColors.variantBorder};

  &:hover {
    background-color: ${({ theme }) => transparentize(0.9, theme.palette.themeTertiary)};
  }

  & > div {
    padding: 10px 16px;
    flex: 1 0 0;
    display: flex;
    align-items: center;
    font-size: 1.15em;
  }

  & > div:first-child {
    justify-content: center;
    flex: 0 0 28%;
    border-left: 2px solid ${({ theme }) => theme.semanticColors.variantBorder};
    background-color: ${({ theme }) => transparentize(0.75, theme.palette.neutralLight)};
  }

  & + & {
    border-top: 0;
  }
`;

const ButtonRow = styled(Flex)`
  & > * + * {
    margin-right: 4px;
  }
`;

class WorkflowPage extends Component {
  constructor() {
    super();
    this.state = {
      workflow: null,
      canApprove: false,
      loading: true,
      loadingAction: false,
      error: null,
      message: '',
      historyExpanded: false,
    };
  }

  componentDidMount() {
    this.getWorkflow();
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      this.getWorkflow();
    }
  }

  toggleHistoryExpand = () => this.setState({ historyExpanded: !this.state.historyExpanded });

  onChangeWorkflowMessage = (e, message) => this.setState({ message });

  workflowAction = action => {
    const { message } = this.state;
    this.setState({ loadingAction: true, error: null, message: '' });
    axios
      .put(`/workflows/${this.props.match.params.id}/${action}`, {
        message,
      })
      .then(() => this.getWorkflow())
      .catch(error => this.setState({ error, loadingAction: false }));
  };

  approveWorkflow = () => this.workflowAction('approve');
  rejectWorkflow = () => this.workflowAction('reject');
  cancelWorkflow = () => this.workflowAction('cancel');
  resubmitWorkflow = () => this.workflowAction('resubmit');

  getWorkflow() {
    const { id } = this.props.match.params;
    this.setState({ loading: true, loadingAction: false, error: null, canApprove: false });
    axios
      .get(`/workflows/${id}`)
      .then(({ data }) => {
        this.setState({ loading: false, workflow: data });
        axios.get(`/workflows/${id}/can/approve`).then(({ data }) => {
          this.setState({ canApprove: data });
        });
      })
      .catch(e => {
        console.error(e);
        this.setState({ loading: false });
      });
  }

  renderHeader() {
    const { workflow } = this.state;
    let header = '';
    switch (workflow.type) {
      case 'CREATE_CHANNEL':
        header = 'יצירת ערוץ';
        break;
      case 'LOAD_CREDIT':
        header = `טעינת קרדיט`;
        break;
      default:
    }
    return <h1 className="ms-font-su">בקשה ל{header}</h1>;
  }

  renderWorkflowState() {
    const { workflow } = this.state;
    let state = '';
    switch (workflow.state) {
      case 'IN_PROGRESS':
        state = 'ממתין לאישור';
        break;
      case 'APPROVED':
        state = 'אושר';
        break;
      case 'CANCELED':
        state = 'בוטל ע"י המשתמש';
        break;
      case 'REJECTED':
        state = 'נדחה';
        break;
      case 'TIMEOUT':
        state = 'פג תוקף';
        break;
      default:
    }
    return state;
  }

  renderWorkflowStep() {
    const { workflow } = this.state;
    const maxStep = workflow.steps.reduce((maxStep, currStep) =>
      currStep.step > maxStep.step ? currStep : maxStep,
    );
    switch (maxStep.name) {
      case 'KABAM':
        return 'קב"ם';
      case 'KETER':
        return 'כת"ר';
      default:
        return '?';
    }
  }

  renderWorkflowHistory() {
    const { workflow, historyExpanded } = this.state;
    let lastStep = null;
    return (
      <Flex flexDirection="column">
        {workflow.steps.map((step, i) => {
          let action = '';
          let description = null;
          let name = '';
          let suffix = '';
          let persona = null;
          const responder = step.responder || workflow.requester;
          switch (step.name) {
            case 'KABAM':
              name = 'קב"ם';
              break;
            case 'KETER':
              name = 'כת"ר';
              break;
            default:
              name = 'shit';
          }
          switch (step.state) {
            case 'CANCELED':
              action = 'ביטל';
              break;
            case 'APPROVED':
              action = `(${name}) אישר`;
              suffix = ` - ${
                i === workflow.steps.length - 1 ? 'הבקשה הסתיימה' : workflow.steps[i + 1].comment
              }`;
              break;
            case 'REJECTED':
              action = `(${name}) דחה`;
              break;
            case 'IN_PROGRESS':
              action = 'הגיש';
              if (i > 0) {
                action = 'הגיש מחדש';
              }
              break;
            default:
          }
          switch (step.state) {
            case 'TIMEOUT':
              description = 'הבקשה פגה תוקף';
              break;
            default:
              persona = {
                imageUrl: `/profile/${responder.id}/profile.png`,
              };
              description = (
                <Fragment>
                  <Link to={`/channels/${responder.id}`}>
                    <FabricLink>{responder.name}</FabricLink>
                  </Link>
                  <span>
                    {' '}
                    {action} את הבקשה{suffix}
                  </span>
                </Fragment>
              );
          }

          if (lastStep && lastStep.state === 'APPROVED') {
            lastStep = step;
            return null;
          }
          lastStep = step;

          return (
            <Box my={1} key={i}>
              <ActivityItem
                isCompact={!historyExpanded}
                activityDescription={description}
                activityPersonas={[persona]}
                comments={step.comment}
                timeStamp={new Date(step.updatedAt).toLocaleString()}
              />
            </Box>
          );
        })}
      </Flex>
    );
  }

  render() {
    const { user } = this.props;
    const {
      workflow,
      historyExpanded,
      message,
      loading,
      loadingAction,
      error,
      canApprove,
    } = this.state;

    const actionDisabled = loading || loadingAction;

    const canCancel =
      user &&
      user.id &&
      workflow &&
      workflow.requester &&
      workflow.state === 'IN_PROGRESS' &&
      user.id === workflow.requester.id;
    const canResubmit =
      user &&
      user.id &&
      workflow &&
      workflow.requester &&
      (workflow.state === 'CANCELED' || workflow.state === 'REJECTED') &&
      user.id === workflow.requester.id;

    const canAction = canResubmit || canCancel || canApprove;

    return (
      <Flex justifyContent="center">
        <Helmet>
          <title>VOD - בקשות לאישור</title>
        </Helmet>
        <Box mb={4} width={0.9}>
          {loading && !workflow ? (
            <LoadingSpinner label="טוען..." size={SpinnerSize.large} />
          ) : (
            <Fragment>
              {workflow && this.renderHeader()}
              <Flex>
                <Box flex="1 0 0">
                  {workflow && workflow.channel ? (
                    <TableRow>
                      <div>
                        <ItemLabel>ערוץ</ItemLabel>
                      </div>
                      <Flex alignItems="center" justifyContent="space-between">
                        {workflow && workflow.channel && (
                          <ChannelRow channel={workflow.channel} displayOnly />
                        )}
                        {workflow && workflow.subscription && (
                          <QuotaPlans
                            displayOnly
                            plans={{
                              [workflow.subscription.plan.id]: {
                                ...workflow.subscription.plan,
                              },
                            }}
                          />
                        )}
                      </Flex>
                    </TableRow>
                  ) : null}
                  {workflow && workflow.transaction && workflow.transaction.amount ? (
                    <TableRow>
                      <div>
                        <ItemLabel>סכום</ItemLabel>
                      </div>
                      <div>{workflow.transaction.amount}$</div>
                    </TableRow>
                  ) : null}
                  {workflow && workflow.transaction && workflow.transaction.emf ? (
                    <TableRow>
                      <div>
                        <ItemLabel>EMF</ItemLabel>
                      </div>
                      <div>{workflow.transaction.emf}</div>
                    </TableRow>
                  ) : null}
                  <TableRow>
                    <div>
                      <ItemLabel>סטאטוס הבקשה</ItemLabel>
                    </div>
                    <div>{workflow && this.renderWorkflowState()}</div>
                  </TableRow>
                  {workflow && workflow.state !== 'APPROVED' && (
                    <TableRow>
                      <div>
                        <ItemLabel>שלב הבקשה</ItemLabel>
                      </div>
                      <div>{this.renderWorkflowStep()}</div>
                    </TableRow>
                  )}
                  <TableRow>
                    <div>
                      <ItemLabel>מגיש הבקשה</ItemLabel>
                    </div>
                    <div>
                      {workflow && workflow.requester && (
                        <ChannelRow size={70} channel={workflow.requester} displayOnly />
                      )}
                    </div>
                  </TableRow>
                  <TableRow>
                    <div>
                      <ItemLabel>תאריך הגשת בקשה</ItemLabel>
                    </div>
                    <div>
                      {workflow &&
                        workflow.createdAt &&
                        new Date(workflow.createdAt).toLocaleString()}
                    </div>
                  </TableRow>
                  <TableRow>
                    <div>
                      <ItemLabel>תאריך עדכון בקשה</ItemLabel>
                    </div>
                    <div>
                      {workflow &&
                        workflow.updatedAt &&
                        new Date(workflow.updatedAt).toLocaleString()}
                    </div>
                  </TableRow>
                  <TableRow>
                    <div>
                      <ItemLabel>היסטוריה</ItemLabel>
                    </div>
                    <div>
                      <Box flex="1 0 0">
                        {workflow && workflow.steps && this.renderWorkflowHistory()}
                      </Box>
                      <MiniButton onClick={this.toggleHistoryExpand}>
                        {historyExpanded ? 'צמצם' : 'הרחב'}
                      </MiniButton>
                    </div>
                  </TableRow>
                </Box>
                <Box mx={2} />
                <Box width={0.35}>
                  {canAction && (
                    <Fragment>
                      {error && (
                        <MessageBar
                          messageBarType={MessageBarType.error}
                          dismissButtonAriaLabel="סגור"
                        >
                          הפעולה נכשלה. אנא נסה/י שנית מאוחר יותר.
                        </MessageBar>
                      )}
                      <TextField
                        onChange={this.onChangeWorkflowMessage}
                        value={message}
                        label="הודעה"
                        disabled={actionDisabled}
                        multiline
                        rows={4}
                      />
                      <Box my={2}>
                        <ButtonRow>
                          {canApprove && (
                            <DefaultButton
                              disabled={actionDisabled}
                              onClick={this.approveWorkflow}
                              text="אשר בקשה"
                              primary
                            />
                          )}
                          {canApprove && (
                            <DefaultButton
                              disabled={actionDisabled}
                              onClick={this.rejectWorkflow}
                              text="דחה בקשה"
                            />
                          )}
                          {canResubmit && (
                            <DefaultButton
                              disabled={actionDisabled}
                              onClick={this.resubmitWorkflow}
                              text="הגש בקשה מחדש"
                              primary
                            />
                          )}
                          {canCancel && (
                            <DefaultButton
                              disabled={actionDisabled}
                              onClick={this.cancelWorkflow}
                              text="בטל בקשה"
                            />
                          )}
                        </ButtonRow>
                      </Box>
                    </Fragment>
                  )}
                </Box>
              </Flex>
            </Fragment>
          )}
        </Box>
      </Flex>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(WorkflowPage, mapStateToProps);
