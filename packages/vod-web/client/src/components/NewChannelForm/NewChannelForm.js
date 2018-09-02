import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';
import axios from 'axios';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Image, ImageCoverStyle } from 'office-ui-fabric-react/lib/Image';

import PeoplePicker from 'components/PeoplePicker';

const DropdownContainer = styled.div`
  max-width: 250px;
`;

const InputButton = styled(DefaultButton)`
  position: relative;

  input[type="file"] {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    width: 100%;
    opacity: 0;
    cursor: pointer;
  }
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
    color: ${({theme}) => theme.palette.themePrimary};
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

class NewChannelForm extends Component{

  constructor() {
    super();
    this.state = {
      name: '',
      id: '',
      description: '',
      privacy: 'public',
      viewACL: [],
      manageACL: [],
      profile: null,
      cover: null,
      error: null,
    };
  }
  
  onRenderPrivacyOption = (item) => {
    const option = item[0] || item;
    
    return (
      <DropdownOption>
        {option.data &&
          option.data.icon && (
            <Icon
              iconName={option.data.icon}
              aria-hidden="true"
              title={option.text}
            />
          )}
        <span>{option.text}</span>
      </DropdownOption>
    );
  }

  readFileIntoState = (input, field) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => this.setState({ [field]: {
        preview: e.target.result,
        file: input.files[0],
       }});
      reader.readAsDataURL(input.files[0]);
    }
  }

  onChangeName = ({ target }) => this.setState({ name: target.value });
  onChangeId = ({ target }) => this.setState({ id: target.value });
  onChangeDescription = ({ target }) => this.setState({ description: target.value });
  onChangePrivacy = (e, { key: privacy }) => this.setState({ privacy });
  onChangeProfile = ({ target }) => this.readFileIntoState(target, 'profile');
  onChangeCover = ({ target }) => this.readFileIntoState(target, 'cover');
  onChangeViewACL = (acls) => {
    this.setState({ viewACL: acls.map(acl => ({
      id: acl.secondaryText,
      type: acl.type,
    }))});
  }
  onChangeManageACL = (acls) => {
    this.setState({ manageACL: acls.map(acl => ({
      id: acl.secondaryText,
      type: acl.type,
    }))});
  }
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
    const {
      name,
      id,
      privacy,
    } = this.state;

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
      const {
        name,
        id,
        profile,
        cover,
        privacy,
        description,
        viewACL,
        manageACL
      } = this.state;

      const data = new FormData();
      // data.append('name', name);
      // data.append('id', id);
      // data.append('privacy', privacy);
      // data.append('description', description);
      // data.append('viewAcl', viewAcl);
      // data.append('manageACL', manageACL);
      if (profile && profile.file) {
        data.append('profile', profile.file);
      }
      if (cover && cover.file) {
        data.append('cover', cover.file);
      }
      axios.post(`${process.env.REACT_APP_API_HOSTNAME}/api/channels`, {
        id,
        name,
        description,
        viewACL,
        manageACL,
        privacy,
      }).then(response => {
        return axios.post(`${process.env.REACT_APP_API_HOSTNAME}/api/channels/images/${response.data.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      })
      .then(() => {
        this.props.onDismiss();
        this.props.history.push(`/channel/${id}`);
      }).catch(error => {
        console.error(error);
        this.setError('עלתה שגיאה ביצירת הערוץ');
      });
    }
  }
  
  render(){
    const {
      name,
      id,
      profile,
      cover,
      privacy,
      description,
      error
    } = this.state;

    return(
      <Form onSubmit={this.onSubmit}>
        {error && (
          <ErrorMsg width={1}>
            {error}
          </ErrorMsg>
        )}
        <TextField
          label="מזהה הערוץ"
          required
          placeholder='לדוגמה: tikshuv'
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
        <DropdownContainer>
          <Dropdown
            required
            label="גישה"
            selectedKey={privacy}
            onChange={this.onChangePrivacy}
            onRenderTitle={this.onRenderPrivacyOption}
            onRenderOption={this.onRenderPrivacyOption}
            placeHolder="בחר/י גישה לערוץ"
            options={[
              { key: 'public', text: 'ציבורי', data: { icon: 'Group' } },
              { key: 'private', text: 'פרטי', data: { icon: 'Contact' } },
            ]}
          />
        </DropdownContainer>
        {privacy !== 'public' ? (
          <PeoplePicker label="הרשאות צפייה" onChange={this.onChangeViewACL} />
        ) :  null}
        <PeoplePicker label="הרשאות ניהול" onChange={this.onChangeManageACL} />
        <TextField
          label="תיאור"
          required
          multiline
          autoAdjustHeight
          value={description}
          onChange={this.onChangeDescription}
        />

        <Label>בחר תמונת תצוגה:</Label>
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <InputButton iconProps={{ iconName: 'Upload' }} text="תמונת פרופיל">
              <input type="file" accept="image/*" onChange={this.onChangeProfile} />
            </InputButton>
          </Box>
          <Persona size={PersonaSize.size48} imageUrl={(profile && profile.preview) || '/images/user.svg'} />
        </Flex>

        <Label>בחר תמונת נושא:</Label>
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <InputButton iconProps={{ iconName: 'Upload' }} text="תמונת נושא">
              <input type="file" accept="image/*" onChange={this.onChangeCover} />
            </InputButton>
          </Box>
        </Flex>
        <Box mt={2}>
          <Image src={cover && cover.preview} coverStyle={ImageCoverStyle.landscape} width={420} />
        </Box>
        <Buttons py={2} px={32}>
          <Flex>
            <PrimaryButton text="צור ערוץ" onClick={this.onSubmit} />
            <Box mx={3} />
            <DefaultButton text="ביטול" onClick={this.props.onDismiss} />
          </Flex>
        </Buttons>
      </Form>
    );
  }
}

export default withRouter(NewChannelForm);
