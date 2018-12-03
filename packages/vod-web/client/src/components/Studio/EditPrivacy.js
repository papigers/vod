import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex } from 'grid-styled';

import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';


import PeoplePicker from 'components/PeoplePicker';

const Form = styled.form`
  align-content: center;
  width:30vw;
`;

const FormContainer = styled(Flex)`
  justify-content: center;
`;

const ContentContainer = FormContainer.extend`
    margin: 1em 0;
`;

const FormButton = styled(DefaultButton)`
  margin: 0 1em;
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

class EditPrivacy extends Component {
    constructor() {
        super();
        this.state = {
            id: '',
            privacy: 'PRIVATE',
            acls: [],
        };
      }
      
      static getDerivedStateFromProps(props, state) {
        const {video} = props;
        if (video && (!state.id || state.id !== video.id)) {
          var acls = video.acls;
          if (video.acls) {
            acls = video.acls[0] ? video.acls : [video.acls];
          }
          return {
            id: video.id,
            privacy: video.privacy,
            acls: acls,
          }
        }
        return null;
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
      
      onChangeACL = (acls) => this.setState({acls: this.formatACL(acls)});

      formatACL = (acls) => {
        return acls.map(acl => {
          return {
            id: acl.secondaryText,
            name: acl.text,
            profile: acl.imageUrl,
            type: acl.type,
          };
        }).filter(acl => !!acl);
      }

      onPrivacyChannge = (e, index) => {
        this.setState({
            privacy: index.key
        });
    }

    onSubmit(){

    }
      
    render() {
      const {privacy, acls} = this.state;
      const {onClose} = this.props;
        return (
            <FormContainer>
              <Form>
                <Dropdown
                    required
                    label="גישה"
                    selectedKey={privacy}
                    onChange={this.onPrivacyChannge}
                    onRenderTitle={this.onRenderPrivacyOption}
                    onRenderOption={this.onRenderPrivacyOption}
                    placeHolder="בחר/י גישה לערוץ"
                    options={[
                      { key: 'PUBLIC', text: 'ציבורי', data: { icon: 'Group' } },
                      { key: 'PRIVATE', text: 'פרטי', data: { icon: 'Contact' } },
                    ]}
                />{privacy !=='PUBLIC'?
                <PeoplePicker
                    label="הרשאות צפייה"
                    onChange={this.onChangeACL}
                    selectedItems={acls}
                />:null}
                <ContentContainer>
                  <FormButton
                    primary
                    text='שמור'
                    iconProps={{ iconName: 'Save' }}
                    onClick={this.onSubmit}
                  />
                  
                  <FormButton
                    text='בטל'
                    iconProps={{ iconName: 'Delete' }}
                    onClick={onClose}
                  />
                </ContentContainer>
                </Form>
            </FormContainer>
        );
    }
}

export default EditPrivacy;