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
    this.state = {};
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

  render() {
    const {
      step,
      progress,
      video: {
        name,
        description,
        privacy,
        thumbnails,
        selectedThumbnail
      },
      metadata,
      onChangeName,
      onChangeDescription,
      onChangePrivacy
    } = this.props;

    const intermidiateProgress = false && progress >= 100;

    return (
      <Fragment>
        <Progress
          label={this.getUploadStatus(step)}
          description={intermidiateProgress ? 'מסיים כמה דברים...' : `${Math.round(progress)}%`}
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
            <Form>
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
                  onChanged={onChangeName}
                />
              </Flex>
              <TextField
                label="תיאור"
                multiline
                autoAdjustHeight
                value={description}
                onChanged={onChangeDescription}
              />
              <DropdownContainer>
                <Dropdown
                  required
                  label="ערוץ"
                  onRenderTitle={this.onRenderChannelOption}
                  onRenderOption={this.onRenderChannelOption}
                  options={[{
                    key: 's7591665',
                    text: 'גרשון ח פפיאשוילי',
                    data: {
                      img: 'https://scontent.fhfa1-1.fna.fbcdn.net/v/t1.0-1/p480x480/36404826_10212689636864924_812286978346188800_n.jpg?_nc_cat=0&oh=f7b5d42c81a822f2a2e642abb2fafe4c&oe=5C0E4A2A',
                    },
                  },{ key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
                  {
                    key: 'channel11',
                    text: 'ערוץ 11',
                    data: {
                      img: 'https://yt3.ggpht.com/-BbwsM-6h7Qg/AAAAAAAAAAI/AAAAAAAAAAA/S-9eysJS6os/s288-mo-c-c0xffffffff-rj-k-no/photo.jpg',
                    }, 
                  }]}
                />
              </DropdownContainer>
              <DropdownContainer>
                <Dropdown
                  required
                  label="גישה"
                  selectedKey={privacy}
                  onChanged={onChangePrivacy}
                  onRenderTitle={this.onRenderPrivacyOption}
                  onRenderOption={this.onRenderPrivacyOption}
                  placeHolder="בחר/י גישה לסרטון"
                  options={[
                    { key: 'private', text: 'פרטי', data: { icon: 'Contact' } },
                    { key: 'public', text: 'ציבורי', data: { icon: 'Group' } },
                    { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
                    { key: 'channel', text: 'יורש מהערוץ', data: { icon: 'MSNVideos' } },
                  ]}
                />
              </DropdownContainer>
              {privacy !== 'public' ? (
                <PeoplePicker label="הסרטון משותף עם:" />
              ) :  null}
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
                      ` ${metadata.res}p`,
                    ]}
                  />
                  <ActivityItem
                    isCompact
                    activityIcon={<Icon iconName="AspectRatio" />}
                    activityDescription={[
                      <b>יחס גודל:</b>,
                      ` ${metadata.ratioW}:${metadata.ratioH}`,
                    ]}
                  />
                </Metadata>
              ) : null}
              <Box pt={40}>
                <Flex justifyContent="flex-start" alignItems="center">
                  <PrimaryButton text="שמור" disabled={step !== 'form_waiting'} />
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
