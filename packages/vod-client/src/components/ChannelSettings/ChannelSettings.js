import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';

import axios from 'utils/axios';
import PeoplePicker from 'components/PeoplePicker';
import QuotaPlans from 'components/QuotaPlans';
import ChangeSubscriptionModal from 'components/ChangeSubscriptionModal';

const DropdownContainer = styled.div`
  max-width: 250px;
`;

const DropdownOption = styled.div`
  display: flex;
  align-items: center;
  height: 100%;

  .ms-Dropdown-item:hover &,
  .ms-Dropdown-item:hover & .ms-Persona-primaryText {
    color: ${({ theme }) => theme.palette.themePrimary};
  }

  i {
    margin-left: 8px;
  }
`;

const Buttons = styled(Box)`
  bottom: 0;
  right: 0;
  width: 100%;
  background: ${({ theme }) => theme.palette.bodyBackground};
  z-index: 0;
`;

const ErrorMsg = styled(Box)`
  color: #e90000;
  text-align: center;
  font-weight: 600;
  font-size: 1.1em;
`;

const SuccessMsg = styled(Box)`
  color: #008000;
  text-align: center;
  font-weight: 600;
  font-size: 1.1em;
`;

const SubDate = styled.div`
  font-weight: 500;
  text-align: center;
  margin: 6px auto;
`;

class ChannelSettings extends Component {
  constructor(props) {
    super();
    this.state = {
      id: '',
      name: '',
      description: '',
      privacy: 'PUBLIC',
      viewACL: [],
      manageACL: [],
      subscription: null,
      personal: false,
      profile: null,
      cover: null,
      error: null,
      done: null,
    };
  }

  componentDidMount() {
    this.fetchACL();
    this.fetchSubscription();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.id !== prevState.id) {
      this.fetchACL();
      this.fetchSubscription();
    }
  }

  static getDerivedStateFromProps(props, state, reset = false) {
    const propsId = props.channel.id;
    if (reset || !state.id || state.id !== propsId) {
      return {
        id: propsId,
        name: props.channel.name,
        description: props.channel.description,
        personal: props.channel.personal,
        profile: {
          preview: `/profile/${propsId}/profile.png`,
          file: null,
        },
        cover: {
          preview: `/profile/${propsId}/cover.png`,
          file: null,
        },
        loading: true,
        error: null,
      };
    }
    return null;
  }

  resetForm = () => {
    this.setState(ChannelSettings.getDerivedStateFromProps(this.props, this.state, true));
    this.fetchACL();
  };

  onRenderPrivacyOption = item => {
    const option = item[0] || item;

    return (
      <DropdownOption>
        {option.data && option.data.icon && (
          <Icon iconName={option.data.icon} aria-hidden="true" title={option.text} />
        )}
        <span>{option.text}</span>
      </DropdownOption>
    );
  };

  readFileIntoState = (input, field) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e =>
        this.setState({
          [field]: {
            preview: e.target.result,
            file: input.files[0],
          },
        });
      reader.readAsDataURL(input.files[0]);
    }
  };

  fetchACL = () => {
    axios
      .get(`channels/${this.state.id}/permissions`)
      .then(({ data }) => {
        this.setState({
          viewACL: data.viewACL,
          privacy: data.viewACL.length ? 'PRIVATE' : 'PUBLIC',
          manageACL: data.manageACL,
        });
      })
      .catch(err => {
        console.error(err);
      });
  };

  fetchSubscription = () => {
    axios
      .get(`channels/${this.state.id}/subscription`)
      .then(({ data }) => {
        this.setState({
          subscription: data.subscription,
        });
      })
      .catch(err => {
        console.error(err);
      });
  };

  formatACL = acls => {
    return acls;
  };

  onChangeName = ({ target }) => this.setState({ name: target.value });
  onChangeDescription = ({ target }) => this.setState({ description: target.value });
  onChangePrivacy = (e, { key: privacy }) => {
    this.setState({ privacy });
  };
  onChangeViewACL = acls => this.setState({ viewACL: this.formatACL(acls) });
  onChangeManageACL = acls => this.setState({ manageACL: this.formatACL(acls) });

  setError(error) {
    this.setState({ error }, () => {
      if (error) {
        ReactDOM.findDOMNode(this).parentNode.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      }
    });
  }

  validate() {
    const { name, id, privacy } = this.state;

    if (!name) {
      this.setError('חובה להזין שם ערוץ');
      return false;
    }
    if (!id) {
      this.setError('חובה להזין מזהה ערוץ');
      return false;
    }
    if (!privacy) {
      this.setError('חובה להזין גישה לערוץ');
      return false;
    }
    return true;
  }

  onSubmit = () => {
    this.setError(null);
    if (this.validate()) {
      const user = this.props.user;
      const { id, name, description, privacy, viewACL, manageACL } = this.state;

      const channel = {
        id,
        name,
        description,
        privacy,
        viewACL,
        manageACL,
      };
      axios
        .put(`/channels/${id}`, {
          user,
          id,
          channel,
        })
        // .then(response => {
        //   return axios.post(`channels/images/${id}`, data, {
        //     headers: { 'Content-Type': 'multipart/form-data' },
        //   });
        // })
        .then(() => {
          this.setState({
            done: 'הערוץ התעדכן בהצלחה',
          });
        })
        .catch(error => {
          this.setError('עלתה שגיאה בעריכת הערוץ');
        });
    }
  };

  render() {
    const {
      id,
      name,
      description,
      privacy,
      viewACL,
      manageACL,
      error,
      done,
      personal,
      subscription,
    } = this.state;

    return (
      <Box width={0.9}>
        <Flex>
          <Box width={0.2} my={3}>
            {!!subscription && (
              <Flex flexDirection="column" alignItems="center">
                <QuotaPlans
                  displayOnly
                  plans={{
                    [subscription.plan.id]: {
                      ...subscription.plan,
                    },
                  }}
                />
                <SubDate>
                  {new Date(subscription.to).getFullYear() -
                    new Date(subscription.from).getFullYear() >=
                  10
                    ? 'ללא הגבלה'
                    : `${new Date(subscription.to).toLocaleDateString()} - ${new Date(
                        subscription.from,
                      ).toLocaleDateString()}`}
                </SubDate>
                {!personal && (
                  <ChangeSubscriptionModal
                    currentSubscription={subscription}
                    channelId={id}
                    onSubmit={this.fetchSubscription}
                  />
                )}
              </Flex>
            )}
          </Box>
          <Box mx={2} />
          <Box my={2} flex="1 0 0">
            <form onSubmit={this.onSubmit}>
              {error && <ErrorMsg width={1}>{error}</ErrorMsg>}
              {done && <SuccessMsg width={1}>{done}</SuccessMsg>}
              {personal === false ? (
                <TextField
                  label="שם הערוץ"
                  required
                  placeholder='לדוגמה: אג"ף התקשוב'
                  value={name}
                  onChange={this.onChangeName}
                />
              ) : null}
              <DropdownContainer>
                <Dropdown
                  required
                  label="גישה"
                  selectedKey={privacy}
                  onChange={this.onChangePrivacy}
                  onRenderTitle={this.onRenderPrivacyOption}
                  onRenderOption={this.onRenderPrivacyOption}
                  placeholder="בחר/י גישה לערוץ"
                  options={[
                    { key: 'PUBLIC', text: 'ציבורי', data: { icon: 'Group' } },
                    { key: 'PRIVATE', text: 'פרטי', data: { icon: 'Contact' } },
                  ]}
                />
              </DropdownContainer>
              {privacy !== 'PUBLIC' ? (
                <PeoplePicker
                  label="הרשאות צפייה"
                  onChange={this.onChangeViewACL}
                  value={viewACL}
                />
              ) : null}
              {personal === false ? (
                <PeoplePicker
                  label="הרשאות ניהול"
                  onChange={this.onChangeManageACL}
                  value={manageACL}
                />
              ) : null}
              <TextField
                label="תיאור"
                required
                multiline
                autoAdjustHeight
                value={description}
                onChange={this.onChangeDescription}
              />
              <Buttons py={2} px={32}>
                <Flex>
                  <PrimaryButton text="שמור" onClick={this.onSubmit} />
                  <Box mx={3} />
                  <DefaultButton text="אפס" onClick={this.resetForm} />
                </Flex>
              </Buttons>
            </form>
          </Box>
        </Flex>
      </Box>
    );
  }
}

export default withRouter(ChannelSettings);
