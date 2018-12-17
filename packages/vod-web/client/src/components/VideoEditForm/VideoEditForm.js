import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import axios from 'utils/axios';
import PeoplePicker from 'components/PeoplePicker';
import TagPicker from 'components/TagPicker';

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

const DropdownContainer = styled.div`
  max-width: 250px;
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

class VideoEditForm extends Component {
    constructor() {
        super();
        this.state = {
            id: '',
            name: '',
            description: '',
            tags: [],
            privacy: 'PUBLIC',
            acls: [],
            error: null,
            loading: false,
        };
      }

      componentDidMount() {
        this.fetchACL();
      }
    
      componentDidUpdate(prevProps, prevState) {
        if (this.state.id !== prevState.id) {
          this.fetchACL();
        }
      }

      static getDerivedStateFromProps(props, state) {
        const {video} = props;
        if (video && (!state.id || state.id !== video.id)) {
          return {
            id: video.id,
            name: video.name,
            description: video.description,
            tags: video.tags,
            privacy: video.privacy,
          }
        }
        return null;
      }

      fetchACL = () => {
          if (this.state.privacy !== 'PUBLIC') {
            axios.get(`videos/video/${this.state.id}/permissions`)
            .then(({ data }) => {
                this.setState({
                    acls: data
                });
            })
            .catch((err) => {
                console.error(err);
            });
          }
      }

    onChangeName = ({ target }) => this.setState({name: target.value});
    onChangeDescription = ({ target }) => this.setState({description: target.value});
    onChangePrivacy = (e, { key: privacy }) => {this.setState({ privacy })};
    onChangeACL = (acls) => this.setState({ acls: this.formatACL(acls) });
    onChangeTags = (tags) => this.setState({ tags: tags });
    
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

    onRenderPublishedOption = (item) => {
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

    onSubmit(){
        debugger;
        const {
            id,
            name,
            description,
            privacy,
            acls,
            tags,
        } = this.state;

        const video = {
            id: id,
            name: name,
            description: description,
            privacy: privacy,
            acls: privacy === 'PUBLIC'? [] : acls,
            tags: tags.map(tag => tag['tag']),
        }
        Promise.resolve(() => {
            
        }).then(() => {
            this.setState({
                loading: true,
                error: null,
            });
            return this.props.onSubmit(video);
        }).then(() => {
            return this.props.onClose();
        }).catch((err) => {
             this.setState({
                error: err,
                loading: false,
            })
            return console.error(err);
        });
    }

    render() {
        const {
            name,
            description,
            privacy,
            acls,
            tags,
            error,
            loading
          } = this.state;

        return (
            <Fragment>
                <Flex justifyContent="center">
                    <Box >
                        <Form onSubmit={this.onSubmit}>
                            <Flex alignItems="flex-end">
                                <TextField
                                    label="שם סרטון"
                                    required
                                    value={name}
                                    onChange={this.onChangeName}
                                    errorMessage={this.state.nameError}
                                />
                            </Flex>
                            <TextField
                                label="תיאור"
                                multiline
                                autoAdjustHeight
                                value={description}
                                onChange={this.onChangeDescription}
                            />
                            <DropdownContainer>
                                <Dropdown
                                    required
                                    label="גישה"
                                    selectedKey={privacy}
                                    onChange={this.onChangePrivacy}
                                    onRenderTitle={this.onRenderPrivacyOption}
                                    onRenderOption={this.onRenderPrivacyOption}
                                    placeHolder="בחר/י גישה לסרטון"
                                    errorMessage={this.state.privacyError}
                                    options={[
                                        { key: 'PRIVATE', text: 'פרטי', data: { icon: 'Contact' } },
                                        { key: 'PUBLIC', text: 'ציבורי', data: { icon: 'Group' } },
                                        { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
                                        { key: 'CHANNEL', text: 'יורש מהערוץ', data: { icon: 'MSNVideos' } },
                                    ]}
                                />
                            </DropdownContainer>
                            {privacy !== 'PUBLIC' ? (
                                <PeoplePicker selectedItems={acls} label={privacy === 'CHANNEL'?'הסרטון משותף בנוסף עם:':'הסרטון משותף עם:'} onChange={this.onChangeACL} />
                            ) :  null}
                            <TagPicker tags={tags} label="תגיות:" onChange={this.onChangeTags} />
                            <Box pt={40}>
                                <Flex justifyContent="flex-start" alignItems="center">
                                    <PrimaryButton
                                        disabled={loading}
                                        text="שמור"
                                        iconProps={{ iconName: 'Save' }}
                                        onClick={() => this.onSubmit()}
                                    />
                                    <Box mx={3} />
                                    <DefaultButton
                                        disabled={loading}
                                        text="בטל"
                                        iconProps={{ iconName: 'Cancel' }}
                                        onClick={this.props.onClose}
                                    />
                                </Flex>
                            </Box>
                        </Form>
                        {error && (
                            <ErrorMsg width={1}>
                                {error}
                            </ErrorMsg>
                        )}
                        {loading ? 
                            <Spinner size={SpinnerSize.large} label="טוען..." ariaLive="assertive" />
                            : null
                        }
                    </Box>
                </Flex>
            </Fragment>
        );
    }
}

export default VideoEditForm;