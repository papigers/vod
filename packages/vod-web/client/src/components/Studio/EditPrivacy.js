import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

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

const ErrorMsg = styled(Box)`
  color: #e90000;
  text-align: center;
  font-weight: 600;
  font-size: 1.1em;
`;

class EditPrivacy extends Component {
    constructor() {
        super();
        this.state = {
            privacy: null,
            acls: [],
            error: null,
            loading: false,
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

      onChangePrivacy = (e, index) => {
        this.setState({
            privacy: index.key
        });
    }

    onSubmit(){
      const { privacy, acls } = this.state;
      const { videos, onSubmit, onClose } = this.props;

      const items = videos.map(video => {
        return {id: video.id, privacy, acls};
      });

      this.setState({
        loading: true,
        error: null,
      });

      onSubmit(items)
      .then(results => {
          console.log(results);
          onClose();
      }).catch( e => {
           this.setState({
              error: e.message,
              loading: false,
          })
      });
    }
      
    render() {
      const {privacy, acls, error, loading} = this.state;
      const {onClose} = this.props;
        return (
            <FormContainer>
              <Form>
                <Dropdown
                    required
                    label="גישה"
                    disabled={loading}
                    selectedKey={privacy}
                    onChange={this.onChangePrivacy}
                    onRenderTitle={this.onRenderPrivacyOption}
                    onRenderOption={this.onRenderPrivacyOption}
                    placeHolder="בחר/י גישה לערוץ"
                    options={[
                      { key: 'PRIVATE', text: 'פרטי', data: { icon: 'Contact' } },
                      { key: 'PUBLIC', text: 'ציבורי', data: { icon: 'Group' } },
                      { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
                      { key: 'CHANNEL', text: 'יורש מהערוץ', data: { icon: 'MSNVideos' } },
                    ]}
                />
                { privacy && privacy !=='PUBLIC'?
                  <PeoplePicker
                      label="הרשאות צפייה"
                      disabled={loading}
                      onChange={this.onChangeACL}
                      selectedItems={acls}
                  /> : null
                }
                <ContentContainer>
                  {loading ? 
                      <Spinner size={SpinnerSize.large} ariaLive="loading" />
                      :
                      <FormButton
                        primary
                        disabled={loading}
                        text='שמור'
                        iconProps={{ iconName: 'Save' }}
                        onClick={() => this.onSubmit()}
                      />
                  }
                  <FormButton
                    disabled={loading}
                    text='בטל'
                    iconProps={{ iconName: 'Cancel' }}
                    onClick={onClose}
                  />
                </ContentContainer>
                <ContentContainer>
                  {error && (
                    <ErrorMsg width={1}>
                        {error}
                    </ErrorMsg>
                  )}
                  
                </ContentContainer>
              </Form>
            </FormContainer>
        );
    }
}

export default EditPrivacy;