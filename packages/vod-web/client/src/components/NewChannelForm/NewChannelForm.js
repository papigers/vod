import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

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

class NewChannelForm extends Component{

  constructor() {
    super();
    this.state = {
      name: '',
      id: '',
      description: '',
      privacy: '',
      acl: [],
      profile: null,
      cover: null,
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
      reader.onload = (e) => this.setState({ [field]: e.target.result });
      reader.readAsDataURL(input.files[0]);
    }
  }

  onChangeName = ({ target }) => this.setState({ name: target.value });
  onChangeId = ({ target }) => this.setState({ id: target.value });
  onChangeDescription = ({ target }) => this.setState({ description: target.value });
  onChangePrivacy = (e, { key: privacy }) => this.setState({ privacy });
  onChangeProfile = ({ target }) => this.readFileIntoState(target, 'profile');
  onChangeCover = ({ target }) => this.readFileIntoState(target, 'cover');

  onSubmit = () => {
    this.props.onDismiss();
  }
  
  render(){
    const {
      name,
      id,
      profile,
      cover,
      privacy,
      description,
      acl,
    } = this.state;

    return(
      <Form onSubmit={this.onSubmit}>
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
          <PeoplePicker label="הרשאות צפייה" />
        ) :  null}
        <PeoplePicker label="הרשאות ניהול" />
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
          <Persona size={PersonaSize.size48} imageUrl={profile} />
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
          <Image src={cover} coverStyle={ImageCoverStyle.landscape} width={420} />
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

export default NewChannelForm;
