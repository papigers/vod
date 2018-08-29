import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Persona, PersonaSize, personaSize } from 'office-ui-fabric-react/lib/Persona';

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
  }
`;

const CoverPhoto = styled.image`
  width: 350px;
  height: 350px;
`;

const Form = styled.form`
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

const Metadata = styled.div`
  margin-top: 16px;

  b {
    color: ${({theme}) => theme.palette.themePrimaryAlt};
  }
`;

class NewChannelForm extends Component{
  
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
  
  render(){

      // const {
      //   channel: {
      //     name,
      //     profile,
      //     cover,
      //     description,
      //     privacy,
      //   },
      //   onChangeName,
      //   onChangePictureUpload,
      //   onChangeCoverUpload,
      //   onChangeDescription,
      //   onChangePrivacy
      // } = this.props;

      const props = {
        channel: {
          name : 'CJ',
          profileimage : null,
          coverimage : "https://www.cesarsway.com/sites/newcesarsway/files/styles/large_article_preview/public/All-about-puppies--Cesar%E2%80%99s-tips%2C-tricks-and-advice.jpg?itok=bi9xUvwe",
          description : 'hello',
          privacy : 'public',
        },
        onChangeName : () => {console.log("CJ")},
        onChangePictureUpload : () => {console.log("CJ")},
        onChangeCoverUpload : () => {console.log("CJ")},
        onChangeDescription : () => {console.log("CJ")},
        onChangePrivacy : () => {console.log("CJ")},
        onChangeProfileImg : () => {console.log("Profile Uploaded")},
        onChangeCoverImg : () => {console.log("coveruploaded")}
      };

      // name = "cj";
      // const picture = null;

        return(
          <Fragment>
            <Flex justifyContent="center">
            <Form>
            <TextField
                label="מזהה הערוץ"
                required
                placeholder='לדוגמה: tikshuv'
                value={props.name}
                onChanged={props.onChangeName}
              />
              <TextField
                label="שם הערוץ"
                required
                placeholder='לדוגמה: אג"ף התקשוב'
                value={props.name}
                onChanged={props.onChangeName}
              />
              <DropdownContainer>
                <Dropdown
                  required
                  label="גישה"
                  defaultSelectedKey="public"
                  selectedKey={props.privacy}
                  onChanged={props.onChangePrivacy}
                  onRenderTitle={this.onRenderPrivacyOption}
                  onRenderOption={this.onRenderPrivacyOption}
                  placeHolder="בחר/י גישה לסרטון"
                  options={[
                    { key: 'public', text: 'ציבורי', data: { icon: 'Group' } },
                    { key: 'private', text: 'פרטי', data: { icon: 'Contact' } },
                  ]}
                />
              </DropdownContainer>
              {props.privacy !== 'public' ? (
                <PeoplePicker label="הסרטון משותף עם:" />
              ) :  null}
              <TextField
                label="תיאור"
                required
                multiline
                autoAdjustHeight
                value={props.description}
                onChanged={props.onChangeDescription}
              />
              <Label>בחר תמונת תצוגה:</Label>
              <Flex justifyContent="space-between" alignItems="center">
                <Box>
                  <InputButton
                    allowDisabledFocus={true}
                    iconProps={{ iconName: 'Upload' }}
                    menuAs={this._getMenu}
                    text="תמונת פרופיל"
                    >
                      <input type="file" accept="image/*" onChange={props.onChangeProfileImg} />
                  </InputButton>
                </Box>
                <Persona
                  size={personaSize.size72}
                  imageUrl={props.profileimage}
                />
              </Flex>
              <Label>בחר תמונת נושא:</Label>
              <Flex justifyContent="space-between" alignItems="center">
                <Box>
                  <InputButton
                    allowDisabledFocus={true}
                    iconProps={{ iconName: 'Upload' }}
                    menuAs={this._getMenu}
                    text="תמונת נושא"
                    >
                      <input type="file" accept="image/*" onChange={props.onChangeCoverImg} />
                  </InputButton>
                </Box>
                <img 
                src={props.coverimage}
                alt="תמונת נושא"
                />
              </Flex>
              </Form>
            </Flex>
          </Fragment>
        );
    }
}

export default NewChannelForm;