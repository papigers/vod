import React, { Component } from 'react';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { Box, Flex } from 'grid-styled';
import qs from 'query-string';
import io from 'socket.io-client';

import createReduxContainer from 'utils/createReduxContainer';
import axios from 'utils/axios';
import { makeSelectUser } from 'containers/ChannelPage/selectors';

import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
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

const Container = styled(Box).attrs({
  mx: 'auto',
  mt: 35,
  py: 30,
  px: 20,
  width: [1, 1, 2/3, 0.55],
})`
  background-color: ${({theme}) => theme.palette.neutralLighterAlt};
  border: 2px solid;
  border-color: ${({theme}) => theme.palette.neutralLight};
`;

const ErrorBox = styled(MessageBar)`
  width: calc(100% + 40px);
  margin-top: -30px;
  margin-right: -20px;
  margin-bottom: 30px;
`;

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
    width: 350px;

    &.ms-TextField--multiline {
      min-width: 350px;
    }
  }
`;

const DropdownContainer = styled.div`
  max-width: 250px;
`;

const CenterDropdownContainer = styled(DropdownContainer)`
  text-align: center;
  margin: 0 auto;
  max-width: 350px;
  margin-bottom: 1em;
`;

const DropdownOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: center;
  height: 100%;

  .ms-Dropdown-item:hover &,
  .ms-Dropdown-item:hover & .ms-Persona-primaryText {
    color: ${({theme}) => theme.palette.themePrimary};
  }

  i {
    margin-left: 8px;
  }
`;

const DropdownSubtext = styled.div`
  font-size: 80%;
  color: ${({theme}) => theme.palette.bodyText} !important;
`;

const Metadata = styled.div`
  margin-top: 16px;

  b {
    color: ${({theme}) => theme.palette.themePrimaryAlt};
  }
`;

class UploadEdit extends Component {
  constructor() {
    super();
    
    this.state = {
      ...UploadEdit.initialState,
    };
  }

  static initialState = {
    videoId: null,
    video: {},
    progress: 0,
    metadata: {},
    upload: {},
    thumbnails: [],
    selectedThumbnail: 0,
    errors: {},
  };

  static getDerivedStateFromProps(props, state) {
    const propsId = qs.parse(props.location.search).v;
    if (!state.videoId || (state.videoId !== propsId)) {
      return {
        ...UploadEdit.initialState,
        videoId: propsId,
      };
    }
    return null;
  }

  componentDidMount() {
    this.subscribeAndLoadVideoData();
  }

  componentWillUnmount() {
    if (this.uploadSocket) {
      this.uploadSocket.disconnect();
    }
    this.uploadSocket = null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.videoId !== this.state.videoId) {
      this.subscribeAndLoadVideoData();
    }
  }

  subscribeAndLoadVideoData() {
    debugger;
    if (this.uploadSocket) {
      this.uploadSocket.disconnect();
    }
    axios.get(`/videos/${this.state.videoId}/thumbnails?count=4`)
      .then(({ data: thumbnails }) => {
        this.setState({ thumbnails });
      });

    this.uploadSocket = io.connect(`${process.env.REACT_APP_API_HOSTNAME}/upload?id=${this.state.videoId}`);
    this.uploadSocket.on('init', this.initUploadData);
    this.uploadSocket.on('progress', this.setUploadProgress);
    this.uploadSocket.on('metadata', this.setUploadMetadata);
    this.uploadSocket.on('step', this.setUploadStep);
    this.uploadSocket.on('upload-error', this.setUploadError);
  }

  setUploadError = error => this.setState({
    errors: {
      ...this.state.errors,
      form: error,
    },
   });
  initUploadData = videoData => {
    const { tags, metadata, upload, ...video } = videoData; 
    if (video.id === this.state.videoId) {
      this.setState({
        video: {
          ...video,
          tags: tags.map(tag => tag.tag),
        },
        metadata,
        upload,
      });
    }
  }
  setUploadProgress = (data) => {
    if (data.id === this.state.videoId) {
      this.setState({ progress: data.progress });
    }
  }
  setUploadMetadata = ({ id, metadata }) => {
    if (id === this.state.videoId) {
      this.setState({ metadata });
    }
  }
  setUploadStep = ({ id, step }) => {
    if (id === this.state.videoId) {
      this.setState({
        video: {
          ...this.state.video,
          upload: {
            ...this.state.video.upload,
            step,
          },
        },
      });
    }
  }
  
  onRenderPrivacyOption = (item, render, type) => {
    const option = item[0] || item;
    return (
      <DropdownOption>
        <div>
          {option.data &&
            option.data.icon && (
              <Icon
                iconName={option.data.icon}
                aria-hidden="true"
                title={option.text}
              />
            )}
          <span>{option.text}</span>
        </div>
        {type !== 'title' ? (
          <DropdownSubtext>{option.data.subText}</DropdownSubtext>
        ) : null}
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

  getUploadStatus() {
    const { upload } = this.state;
    
    switch(upload && upload.step) {
      case 'SHARED_UPLOAD':
        return 'מעלה...';
      case 'ENCODE':
        return 'מקודד סרטון...';
      case 'S3_UPLOAD':
        return 'מסיים...';
      case 'FINISH':
      case null:
      default:
        return 'ההעלאה הסתיימה';
    }
  }

  getChannelOptions() {
    const { user } = this.props;

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
    return dropdownOptions;
  }

  onSubmit = e => {
    e.preventDefault();
    const {
      selectedThumbnail,
      video: {
        id,
        name,
        description,
        privacy,
        channel,
        tags,
        acls,
        state,
      },
      upload,
    } = this.state;
    var finished = !upload || upload.step === 'FINISH';
    axios.put(`/videos/${id}`, {
      name,
      privacy,
      description,
      channel,
      acls,
      tags,
      state,
      thumbnail: selectedThumbnail,
    }).then(({ data }) => {
      if (!data.error) {
        return this.props.history.push(finished ? `/watch?v=${id}` : '/');
      }
      this.setUploadError('לא ניתן היה לשמור את הסרטון');
    }).catch((err) => {
      console.error(err);
      this.setUploadError('לא ניתן היה לשמור את הסרטון');
    });
  }

  onChangeThumbnail = selectedThumbnail => this.setState({ selectedThumbnail });
  onChangeVideoAttribute = ({ target }) => this.setState({
    video: {
      ...this.state.video,
      [target.name]: target.value,
    },
  });
  onChangeChannel = (e, item) => this.setState({
    video: {
      ...this.state.video,
      channel: {
        id: item.key,
        name: item.text,
      },
    },
  });
  onChangePrivacy = (e, { key }) => this.setState({
    video: {
      ...this.state.video,
      privacy: key,
    },
  });
  onChangeState = (e, { key }) => this.setState({
    video: {
      ...this.state.video,
      state: key,
    },
  });
  onChangeACL = (acls) => this.setState({
    video: {
      ...this.state.video,
      acls
    },
  });
  onChangeTags = tags => this.setState({
    video: {
      ...this.state.video,
      tags,
    },
  });

  getStateKey(key) {
    switch (key) {
      case 'DRAFT':
        return {
          key,
          text: 'טיוטה',
          data: {
            icon: 'FullWidthEdit',
            subText: 'הסרטון לא מפורסם ונגיש לעריכה למנהלי הערוץ',
          },
        };
      case 'PUBLISHED':
        return {
          key,
          text: 'מפורסם',
          data: {
            icon: 'RedEye',
            subText: 'הסרטון יהיה מוצג כרגיל ויהיה נגיש לכל משתמש מורשה'
          },
        };
      case 'UNLISTED':
        return {
          key,
          text: 'מוסתר',
          data: {
            icon: 'Hide',
            subText: 'הסרטון יהיה מוסתר מהאתר אך יהיה נגיש לכל משתמש מורשה דרך קישור'
          },
        };
      default:
        return null;
    }
  }

  render() {
    const {
      errors,
      metadata,
      progress,
      thumbnails,
      selectedThumbnail,
      video: {
        name,
        description,
        privacy,
        channel,
        tags,
        acls,
        state,
      },
    } = this.state;

    return (
      <Container>
        {errors.form ? (
          <ErrorBox
            messageBarType={MessageBarType.error}
            onDismiss={() => this.setUploadError(null)}
            dismissButtonAriaLabel="סגור"
          >
            ההעלאה נכשלה: {errors.form}
          </ErrorBox>
        ) : null}
        <CenterDropdownContainer>
          <Dropdown
            required
            label="מצב פרסום"
            selectedKey={state}
            onChange={this.onChangeState}
            onRenderTitle={(...args) => this.onRenderPrivacyOption(...args, 'title')}
            onRenderOption={this.onRenderPrivacyOption}
            placeHolder="בחר/י כיצד לפרסם את הסרטון"
            errorMessage={errors.state}
            options={['DRAFT', 'PUBLISHED', 'UNLISTED'].map(this.getStateKey)}
          />
        </CenterDropdownContainer>
        <Progress
          label={this.getUploadStatus()}
          description={`${Math.round(progress)}%`}
          percentComplete={(progress / 100)}
          barHeight={25}
        />
        <Flex justifyContent="center">
          <Box width={1/3}>
            <Flex justifyContent="center" alignItems="center" flexDirection="column" >
              <VideoThumbnail
                width={210}
                height={118}
                src={thumbnails && thumbnails[selectedThumbnail]}
              />
              <Label>בחר תמונת תצוגה:</Label>
              {[0,1,2,3].map(k => (
                <VideoThumbnail
                  width={180}
                  height={101}
                  src={thumbnails && thumbnails[k]}
                  key={k}
                  onClick={this.onChangeThumbnail.bind(this, k)}
                />
              ))}
            </Flex>
          </Box>
          <Box mx={1}/>
          <Box width={2/3}>
            <Form onSubmit={this.onSubmit}>
              <TextField
                label="שם סרטון"
                required
                name="name"
                value={name}
                onChange={this.onChangeVideoAttribute}
                errorMessage={errors.name}
              />
              <TextField
                label="תיאור"
                multiline
                autoAdjustHeight
                value={description}
                name="description"
                onChange={this.onChangeVideoAttribute}
                errorMessage={errors.description}
              />
              <DropdownContainer>
                <Dropdown
                  required
                  label="ערוץ"
                  onRenderTitle={this.onRenderChannelOption}
                  onRenderOption={this.onRenderChannelOption}
                  onChange={this.onChangeChannel}
                  selectedKey={channel && channel.id}
                  options={this.getChannelOptions()}
                  errorMessage={errors.channel}
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
                  errorMessage={errors.privacy}
                  options={[
                    { key: 'PRIVATE', text: 'פרטי', data: { icon: 'Contact' } },
                    { key: 'PUBLIC', text: 'ציבורי', data: { icon: 'Group' } },
                    { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
                    { key: 'CHANNEL', text: 'יורש מהערוץ', data: { icon: 'MSNVideos' } },
                  ]}
                />
              </DropdownContainer>
              {privacy !== 'PUBLIC' ? (
                <PeoplePicker value={acls} label="הסרטון משותף עם:" onChange={this.onChangeACL} />
              ) :  null}
              <TagPicker value={tags} label="תגיות:" onChange={this.onChangeTags} />
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
                ההעלאה תימשך ברקע ותקבל התראה בסיום ההעלאה
                <Flex justifyContent="flex-start" alignItems="center">
                  <PrimaryButton
                    text="שמור"
                    disabled={!name || !privacy}
                    onClick={this.onSubmit}
                  />
                  <Box mx={3} />
                  <DefaultButton text="בטל" />
                </Flex>
              </Box>
            </Form>
          </Box>
        </Flex>
      </Container>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(UploadEdit, mapStateToProps);
