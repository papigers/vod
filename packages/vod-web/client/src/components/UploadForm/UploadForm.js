import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { ActivityItem } from 'office-ui-fabric-react/lib/ActivityItem';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';

import PeoplePicker from 'components/PeoplePicker';
import TagPicker from 'components/TagPicker';
import VideoThumbnail from 'components/VideoThumbnail';

const Progress = styled(ProgressIndicator)`
  text-align: center;

  .ms-ProgressIndicator-progressTrack {
    background-color: ${({theme}) => theme.palette.neutralTertiaryAlt};
  }
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

const Metadata = styled.div`
  margin-top: 16px;

  b {
    color: ${({theme}) => theme.palette.themePrimaryAlt};
  }
`;

class UploadForm extends Component {
  constructor() {
    super();
    this.state = {
      nameError: null,
      privacyError: null,
    };
  }

  componentDidMount() {
    this.props.onChangeChannel(this.props.user.id);
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

  onRenderChannelOption = (item) => {
    const option = item[0] || item;
    
    return (
      <DropdownOption>
        <Persona
          imageUrl={option.data.img}
          text={option.text}
          size={PersonaSize.size24}
        />
      </DropdownOption>
    );
  }

  sizeString(size) {
    const sizes = ['בתים', 'KB', 'MB', 'GB', 'TB'];
    const i = parseInt(Math.floor(Math.log(size) / Math.log(1024)), 10);
    return Math.round(size / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }

  durationString(duration) {
    const hours   = Math.floor(duration / 3600);
    const minutes = Math.floor((duration - (hours * 3600)) / 60);
    const seconds = Math.floor(duration - (hours * 3600) - (minutes * 60));

    if (hours >= 1) {
      return `${hours}:${minutes < 10 ? `0${minutes}` : minutes} שעות`;
    }
    if (minutes >= 1) {
      return `${minutes}:${seconds < 10 ? `0${seconds}` : minutes} דקות`;
    }
    return `${seconds} שניות`;
  }

  gcd(numer, denom) {
    return denom ? this.gcd(denom, numer % denom) : numer;
  }

  ratioString(width, height) {
    const gcd = this.gcd(width, height);
    return `${width / gcd}:${height / gcd}`;
  }

  getUploadStatus(step) {
    switch(step) {
      case 'form_upload':
        return 'מעלה...';
      case 'form_encode':
        return 'מקודד סרטון...';
      case 'form_s3':
        return 'מסיים...';
      case 'form_waiting':
        return 'ניתן לפרסום';
      default:
        return '';
    }
  }
  onChangeName = ({ target }) => this.props.onChangeName(target.value);
  onChangeDescription = ({ target }) => this.props.onChangeDescription(target.value);
  onChangePrivacy = (e, { key }) => this.props.onChangePrivacy(key);
  onChangeACL = (acls) => {
    this.props.onChangeACL(acls.map(acl => ({
      id: acl.secondaryText,
      type: acl.type,
    })));
  }
  onChangeTags = tags => this.props.onChangeTags(tags);

  onChangeChannel = (e, item) => {
    this.props.onChangeChannel(item.key);
  }

  onSubmit = () => {
    const {
      step,
      video: {
        name,
        privacy,
      },
    } = this.props;
    if (step === 'form_waiting') {
      if (!name) {
        return this.setState({ nameError: 'חייב לציין שם לסרטון'});
      }
      if (!privacy) {
        return this.setState({ privacyError: 'חייב לציין גישה לסרטון'});
      }
      this.setState({ nameError: null, privacyError: null });
      return this.props.onSubmit();
    }
  }

  render() {
    const {
      step,
      progress,
      video: {
        name,
        description,
        privacy,
        thumbnails,
        selectedThumbnail,
        channel,
      },
      metadata,
      user,
    } = this.props;

    const intermidiateProgress = step === 'upload_submit' && progress >= 100;

    const channelOptions = [{
      key: user.id,
      text: user.name,
      data: {
        img: `/profile/${user.id}/profile.png`,
      },
    }].concat((user.managedChannels || []).map(channel => ({
      key: channel.id,
      text: channel.name,
      data: {
        img: `/profile/${channel.id}/profile.png`,
      },
    })));
    
    const dropdownOptions = [];
    channelOptions.forEach((item, index) => {
      dropdownOptions.push(item);
      dropdownOptions.push({ key: `divider${index}`, text: '-', itemType: DropdownMenuItemType.Divider });
    });
    dropdownOptions.splice(dropdownOptions.length - 1, 1);

    return (
      <Fragment>
        <Progress
          label={this.getUploadStatus(step)}
          description={intermidiateProgress ? 'מפרסם... בקרוב תועבר/י לסרטון' : `${Math.round(progress)}%`}
          percentComplete={intermidiateProgress ? null : (progress / 100)}
          barHeight={7}
        />
        <Flex justifyContent="center">
          <Box width={1/4}>
            <Label>בחר תמונת תצוגה:</Label>
            {[0,1,2,3].map(k => (
              <VideoThumbnail
                width={180}
                height={101}
                src={thumbnails && thumbnails[k]}
                key={k}
                onClick={this.props.onChangeThumbnail.bind(this, k)}
              />
            ))}
          </Box>
          <Box mx={1}/>
          <Box width={3/4}>
            <Form onSubmit={this.onSubmit}>
              <Flex alignItems="flex-end">
                <VideoThumbnail
                  width={210}
                  height={118}
                  src={thumbnails && thumbnails[selectedThumbnail]}
                />
                <Box mx={2} />
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
                  label="ערוץ"
                  onRenderTitle={this.onRenderChannelOption}
                  onRenderOption={this.onRenderChannelOption}
                  onChange={this.onChangeChannel}
                  selectedKey={channel}
                  options={dropdownOptions}
                />
              </DropdownContainer>
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
                    { key: 'private', text: 'פרטי', data: { icon: 'Contact' } },
                    { key: 'public', text: 'ציבורי', data: { icon: 'Group' } },
                    { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
                    { key: 'channel', text: 'יורש מהערוץ', data: { icon: 'MSNVideos' } },
                  ]}
                />
              </DropdownContainer>
              {privacy !== 'public' ? (
                <PeoplePicker label="הסרטון משותף עם:" onChange={this.onChangeACL} />
              ) :  null}
              <TagPicker label="תגיות:" onChange={this.onChangeTags} />
              {metadata ? (
                <Metadata>
                  <ActivityItem
                    isCompact
                    activityIcon={<Icon iconName="SizeLegacy" />}
                    activityDescription={[
                      <b>גודל:</b>,
                      ` ${this.sizeString(metadata.size)}`,
                    ]}
                  />
                  <ActivityItem
                    isCompact
                    activityIcon={<Icon iconName="Timer" />}
                    activityDescription={[
                      <b>אורך סרטון:</b>,
                      ` ${this.durationString(metadata.duration)}`,
                    ]}
                  />
                  <ActivityItem
                    isCompact
                    activityIcon={<Icon iconName="PictureStretch" />}
                    activityDescription={[
                      <b>רזולוציה:</b>,
                      ` ${metadata.resolution}p`,
                    ]}
                  />
                  <ActivityItem
                    isCompact
                    activityIcon={<Icon iconName="AspectRatio" />}
                    activityDescription={[
                      <b>יחס גודל:</b>,
                      ` ${this.ratioString(metadata.width, metadata.height)}`,
                    ]}
                  />
                </Metadata>
              ) : null}
              <Box pt={40}>
                <Flex justifyContent="flex-start" alignItems="center">
                  <PrimaryButton
                    text="שמור"
                    disabled={step !== 'form_waiting'}
                    onClick={this.onSubmit}
                  />
                  <Box mx={3} />
                  <DefaultButton text="בטל" />
                </Flex>
              </Box>
            </Form>
          </Box>
        </Flex>
      </Fragment>
    );
  }
}

export default UploadForm;
