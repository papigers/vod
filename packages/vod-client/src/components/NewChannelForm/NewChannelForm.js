import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import axios from 'utils/axios';
import PeoplePicker from 'components/PeoplePicker';
import ChannelCoverImage from 'components/ChannelCoverImage';
import ChannelProfileImage from 'components/ChannelProfileImage';

const DropdownContainer = styled.div`
  max-width: 250px;
`;

const Form = styled.form`
  margin-bottom: 40px;

  .ms-BasePicker {
    max-width: 350px;
  }

  .ms-TextField {
    width: 250px;

    &.ms-TextField--multiline {
      min-width: 350px;
    }
  }
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
  position: absolute;
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

class NewChannelForm extends Component {
  constructor(props) {
    super();
    this.state = {
      name: '',
      id: '',
      description: '',
      privacy: 'PUBLIC',
      viewACL: [],
      manageACL: [],
      profile: null,
      cover: null,
      error: null,
      loading: false,
    };
  }

  componentDidMount() {
    this.setState({
      viewACL: this.formatACL(this.state.viewACL, 'view'),
      manageACL: this.formatACL(this.state.manageACL, 'manage'),
    });
  }

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

  formatACL = (acls, type) => {
    const withoutSelf = acls.filter(
      acl => !!acl && (acl.type === 'USER' && acl.id !== this.props.user.id),
    );
    if (type === 'view') {
      return withoutSelf;
    }
    return withoutSelf.concat([this.getCurrentUser()]);
  };

  onChangeName = ({ target }) => this.setState({ name: target.value });
  onChangeId = ({ target }) => this.setState({ id: target.value });
  onChangeDescription = ({ target }) => this.setState({ description: target.value });
  onChangePrivacy = (e, { key: privacy }) => this.setState({ privacy });
  onChangeProfile = profile => this.setState({ profile });
  onMoveProfile = position => this.setState({ profilePosition: position });
  onChangeCover = cover => this.setState({ cover });
  onMoveCover = position => this.setState({ coverPosition: position });
  onChangeViewACL = acls => this.setState({ viewACL: this.formatACL(acls, 'view') });
  onChangeManageACL = acls => this.setState({ manageACL: this.formatACL(acls, 'manage') });

  setError(error) {
    this.setState({ error, loading: false }, () => {
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
    this.setState({ loading: true });
    if (this.validate()) {
      const { name, id, profile, cover, privacy, description, viewACL, manageACL } = this.state;

      const data = new FormData();
      let filePromise = Promise.resolve();
      let workflowId = '';
      if (profile) {
        filePromise = filePromise
          .then(() => fetch(profile))
          .then(img => img.blob())
          .then(blob => data.append('profile', blob));
      }
      if (cover) {
        filePromise = filePromise
          .then(() => fetch(cover))
          .then(img => img.blob())
          .then(blob => data.append('cover', blob));
      }
      // Form type
      data.set('formType', 'create');
      axios
        .post('/channels', {
          id,
          name,
          description,
          viewACL,
          manageACL: this.formatACL(manageACL, 'manage'),
          privacy,
        })
        .then(res => {
          workflowId = res.data;
          return filePromise;
        })
        .then(() => {
          return axios.post(`channels/images/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        })
        .then(() => {
          setTimeout(() => {
            this.props.onDismiss();
            if (this.props.onSubmit) {
              this.props.onSubmit();
            }
            this.props.history.push(`/mgmt/workflows/${workflowId}`);
          }, 3000);
        })
        .catch(error => {
          console.error(error);
          if (error.response && error.response.data && error.response.data.error) {
            return this.setError(error.response.data.error);
          }
          this.setError('עלתה שגיאה ביצירת הערוץ');
        });
    }
  };

  getCurrentUser() {
    return {
      id: this.props.user.id,
      type: 'USER',
    };
  }

  onRenderCoin = props => (
    <ChannelProfileImage
      editable
      size={props.size}
      src={props.imageUrl}
      onFileChange={this.onChangeProfile}
      onEditImage={this.onMoveProfile}
    />
  );

  render() {
    const {
      name,
      id,
      profile,
      cover,
      privacy,
      description,
      error,
      viewACL,
      manageACL,
      loading,
    } = this.state;

    return (
      <Form onSubmit={this.onSubmit}>
        <Flex>
          <Box flex="3 1 0">
            {error && <ErrorMsg width={1}>{error}</ErrorMsg>}
            <Box pb={2} width="100%">
              <ChannelCoverImage
                src={cover}
                editable
                onFileChange={this.onChangeCover}
                onEditImage={this.onMoveCover}
              />
            </Box>
            <Flex>
              <Box>
                <TextField
                  label="מזהה הערוץ"
                  required
                  placeholder="לדוגמה: tikshuv"
                  value={id}
                  onChange={this.onChangeId}
                />
                <TextField
                  label="שם הערוץ"
                  required
                  placeholder='לדוגמה: אג"ף התקשוב'
                  value={name}
                  onChange={this.onChangeName}
                />
                <TextField
                  label="תיאור"
                  required
                  multiline
                  autoAdjustHeight
                  value={description}
                  onChange={this.onChangeDescription}
                />
              </Box>
              <Box mx={3} />
              <Box>
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
                <PeoplePicker
                  label="הרשאות ניהול"
                  onChange={this.onChangeManageACL}
                  value={manageACL}
                />
              </Box>
              <Box mx={3} />

              <Persona
                imageUrl={profile || '/images/user.svg'}
                primaryText={name}
                secondaryText={description}
                size={PersonaSize.size72}
                onRenderCoin={this.onRenderCoin}
              />
            </Flex>
          </Box>
          <Box mx={2} />
          <Box flex="0 1 0" />
        </Flex>
        <Buttons py={2} px={32}>
          <Flex>
            {loading ? (
              <Fragment>
                <Spinner size={SpinnerSize.large} />
                <Box mx={3} />
              </Fragment>
            ) : null}
            <PrimaryButton disabled={loading} text="צור ערוץ" onClick={this.onSubmit} />
            <Box mx={3} />
            <DefaultButton text="ביטול" onClick={this.props.onDismiss} />
          </Flex>
        </Buttons>
      </Form>
    );
  }
}

export default withRouter(NewChannelForm);
