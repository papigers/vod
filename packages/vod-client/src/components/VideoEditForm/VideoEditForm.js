import React, { Component } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import axios from 'utils/axios';
import PeoplePicker from 'components/PeoplePicker';
import TagPicker from 'components/TagPicker';
import VideoStateDropdown from 'components/VideoStateDropdown';

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

const FormContainer = styled(Flex)`
  justify-content: center;
`;

const ContentContainer = FormContainer.extend`
  margin: 1em 0;
`;

const FormButton = styled(DefaultButton)`
  margin: 0 1em;
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
    color: ${({ theme }) => theme.palette.themePrimary};
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
      state: 'DRAFT',
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
    const { video } = props;
    if (video && (!state.id || state.id !== video.id)) {
      return {
        id: video.id,
        name: video.name,
        description: video.description,
        tags: video.tags,
        state: video.state,
        privacy: video.privacy,
      };
    }
    return null;
  }

  fetchACL = () => {
    if (this.state.privacy !== 'PUBLIC') {
      axios
        .get(`videos/video/${this.state.id}/permissions`)
        .then(({ data }) => {
          this.setState({
            acls: data,
          });
        })
        .catch(err => {
          console.error(err);
        });
    }
  };

  onChangeName = ({ target }) => this.setState({ name: target.value });
  onChangeDescription = ({ target }) => this.setState({ description: target.value });
  onChangePrivacy = (e, { key: privacy }) => {
    this.setState({ privacy });
  };
  onChangeState = (e, { key: state }) => {
    this.setState({ state });
  };
  onChangeACL = acls => this.setState({ acls: this.formatACL(acls) });
  onChangeTags = tags => this.setState({ tags: tags });

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

  onRenderPublishedOption = item => {
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

  formatACL = acls => {
    return acls
      .map(acl => {
        return {
          id: acl.secondaryText,
          name: acl.text,
          profile: acl.imageUrl,
          type: acl.type,
        };
      })
      .filter(acl => !!acl);
  };

  onSubmit() {
    const { id, name, description, privacy, acls, state, tags } = this.state;

    const video = {
      id,
      name,
      description,
      privacy,
      state,
      acls: privacy === 'PUBLIC' ? [] : acls,
      tags: tags.map(tag => tag.tag),
    };

    this.setState({
      loading: true,
      error: null,
    });

    return this.props
      .onSubmit(video)
      .then(this.props.onClose)
      .catch(e => {
        this.setState({
          error: e.message,
          loading: false,
        });
      });
  }

  render() {
    const { name, description, privacy, acls, tags, state, error, loading } = this.state;

    return (
      <FormContainer>
        <Form onSubmit={this.onSubmit}>
          <VideoStateDropdown
            required
            label="מצב פרסום"
            disabled={loading}
            selectedKey={state}
            onChange={this.onChangeState}
            placeHolder="בחר/י באיזו צורה הסרטון יוצג"
          />
          <TextField
            label="שם סרטון"
            disabled={loading}
            required
            value={name}
            onChange={this.onChangeName}
            errorMessage={this.state.nameError}
          />
          <TextField
            label="תיאור"
            disabled={loading}
            multiline
            autoAdjustHeight
            value={description}
            onChange={this.onChangeDescription}
          />
          <DropdownContainer>
            <Dropdown
              required
              label="גישה"
              disabled={loading}
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
            <PeoplePicker
              disabled={loading}
              selectedItems={acls}
              label={privacy === 'CHANNEL' ? 'הסרטון משותף בנוסף עם:' : 'הסרטון משותף עם:'}
              onChange={this.onChangeACL}
            />
          ) : null}
          <TagPicker disabled={loading} tags={tags} label="תגיות:" onChange={this.onChangeTags} />
          <ContentContainer>
            {loading ? <Spinner size={SpinnerSize.large} ariaLive="loading" /> : null}
          </ContentContainer>
          <ContentContainer>
            {loading ? null : (
              <FormButton
                text="שמור"
                primary
                disabled={loading}
                iconProps={{ iconName: 'Save' }}
                onClick={() => this.onSubmit()}
              />
            )}
            <FormButton
              text="בטל"
              disabled={loading}
              iconProps={{ iconName: 'Cancel' }}
              onClick={this.props.onClose}
            />
          </ContentContainer>
          <ContentContainer>{error && <ErrorMsg width={1}>{error}</ErrorMsg>}</ContentContainer>
        </Form>
      </FormContainer>
    );
  }
}

export default VideoEditForm;
