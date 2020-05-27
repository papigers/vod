import React, { Component, Fragment } from 'react';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import qs from 'query-string';
import { Helmet } from 'react-helmet';

import { OverflowSet } from 'office-ui-fabric-react/lib/OverflowSet';
import {
  Shimmer,
  ShimmerElementType as ElemType,
  ShimmerElementsGroup,
} from 'office-ui-fabric-react/lib/Shimmer';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DefaultButton, IconButton } from 'office-ui-fabric-react/lib/Button';

import createReduxContainer from 'utils/createReduxContainer';
import { makeSelectUser } from 'containers/Root/selectors';

import Player from 'components/ThemedPlayer';
import CommentSection from 'components/CommentSection';
import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';
import ChannelRow from 'containers/ChannelRow';
import PlaylistPanel from 'components/PlaylistPanel';
import TimerAction from 'components/TimerAction';
import SaveToPlaylistsCallout from 'components/SaveToPlaylistsCallout';

import axios from 'utils/axios';

const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
`;

const VideoSection = styled(Box).attrs(() => ({
  my: 10,
  pb: 12,
}))`
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
`;

const SpreadItems = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const VideoDescription = styled.div`
  margin: 0 72px;
  padding: 0 16px;
`;

const VideoButton = styled(DefaultButton)`
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: space-around;

  &::before {
    content: ${({ beforeText }) => `'${beforeText || ''}'`};
    display: ${({ beforeText }) => (beforeText !== undefined ? 'inline' : 'none')};
    font-size: 1.1em;
    font-weight: bold;
    color: ${({ theme }) => theme.palette.themePrimary};
    background: ${({ theme }) => theme.palette.neutralLight};
    padding: 4px 12px;
    margin-left: 6px;
    position: relative;
    top: -1px;
  }

  &:hover,
  &:active {
    &::before {
      background: transparent;
    }
  }
`;

const VideoTag = styled.span`
  background: ${({ theme }) => theme.palette.neutralLight};
  border-radius: 4px;
  padding: 4px 9px;

  & + & {
    margin-right: 5px;
  }
`;

const NextVideoPreview = styled(Flex)`
  position: absolute;
  background-image: ${({ nextVideoId }) =>
    `url('${window.streamingEndpoint}/${nextVideoId}/poster.png')`};
  background-size: cover;
  background-position: center;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: #cacaca;
  font-size: 1.3em;
  opacity: ${({ show }) => (show ? 1 : 0)};
  z-index: ${({ show }) => (show ? 200 : -1)};

  & * {
    position: relative;
  }
`;

const NextVideoBackground = styled.div`
  background-color: rgba(0, 0, 0, 0.45);
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`;

const NextVideoName = styled.div`
  color: #fff;
  margin-top: 10px;
  font-size: 1.45em;
  font-weight: bold;
`;

const NextVideoChannel = styled.div`
  color: #fff;
  margin: 5px auto;
`;

const NextVideoButton = styled(IconButton)`
  z-index: 200;

  i {
    font-weight: bold;
    font-size: 2.2em;
  }
`;

const TagsContainer = styled(Box)`
  .ms-Label i {
    color: ${({ theme }) => theme.palette.themePrimary};
  }
`;

class VideoPage extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      error: null,
      related: [],
      loadingRelated: true,
      loadingPlaylist: true,
      errorRelated: null,
      video: null,
      likeDelta: 0,
      viewed: false,
      playlist: null,
      prevVideoId: null,
      nextVideoId: null,
      isCalloutVisible: false,
      nextVideoPreview: false,
    };
    this.addToPlaylistsRef = React.createRef();
  }

  static getDerivedStateFromProps(props, state) {
    const videoId = qs.parse(props.location.search).v;
    const playlistId = qs.parse(props.location.search).list;

    let newState = {};

    if (!state.videoId || state.videoId !== videoId) {
      newState = {
        ...newState,
        videoId: videoId,
        playlistId,
        isCalloutVisible: false,
        currVideoIndex: -1,
        video: null,
        related: [],
        loading: true,
        error: null,
        loadingRelated: true,
        loadingPlaylist: true,
        errorRelated: null,
        nextVideoPreview: false,
      };
    }
    if (!state.playlistId || state.playlistId !== playlistId) {
      newState = {
        ...newState,
        playlist: null,
        nextVideoId: null,
        prevVideoId: null,
        loading: true,
        error: null,
      };
    }
    if (Object.keys(newState).length) {
      return newState;
    }
    return null;
  }

  componentDidMount() {
    this.fetchVideo();
    this.fetchVideoPlaylist();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.videoId !== this.state.videoId) {
      this.fetchVideo();
    }
    if (prevState.playlistId !== this.state.playlistId) {
      this.fetchVideoPlaylist();
    }
    if (prevState.nextVideoId !== this.state.nextVideoId && this.state.nextVideoId) {
      this.fetchNextVideo();
    }
  }

  updateNextPrevVideos = () => {
    const { playlist, video } = this.state;

    if (playlist && playlist.videos.length && video && video.id) {
      const currVideoIndex = playlist.videos.findIndex(currvideo => currvideo.id === video.id);
      if (currVideoIndex !== this.state.currVideoIndex) {
        this.setState({
          currVideoIndex: currVideoIndex,
          nextVideoId:
            currVideoIndex < playlist.videos.length - 1
              ? playlist.videos[currVideoIndex + 1].id
              : null,
          prevVideoId: currVideoIndex > 0 ? playlist.videos[currVideoIndex - 1].id : null,
        });
      }
    }
  };

  fetchVideo() {
    axios
      .get(`/videos/video/${this.state.videoId}`)
      .then(({ data }) => {
        this.setState({
          video: data,
          loading: false,
          error: null,
        });
      })
      .then(() => {
        this.updateNextPrevVideos();
      })
      .catch(err => {
        // TODO: do something
        this.setState({
          video: null,
          loading: false,
          error: 'הסרטון אינו זמין',
        });
      });
    axios
      .get(`/videos/related/${this.state.videoId}`)
      .then(({ data }) => {
        this.setState({
          related: data,
          loadingRelated: false,
          errorRelated: null,
        });
      })
      .catch(err => {
        // TODO: do something
        this.setState({
          related: [],
          loadingRelated: false,
          error: 'שגיאה בשליפת סרטונים דומים',
        });
      });
  }

  fetchVideoPlaylist() {
    if (this.state.playlistId) {
      axios
        .get(`/playlists/${this.state.playlistId}`)
        .then(({ data }) => {
          this.setState({
            playlist: data,
            loadingPlaylist: false,
            error: null,
          });
        })
        .then(() => {
          this.updateNextPrevVideos();
        })
        .catch(err => {
          // TODO: do something
          this.setState({
            playlist: null,
            loadingPlaylist: false,
            error: 'הפלייליסט אינו זמין',
          });
        });
    }
  }

  fetchNextVideo = () => {
    axios.get(`/videos/video/${this.state.nextVideoId}`).then(({ data }) => {
      this.setState({
        nextVideo: data,
      });
    });
  };

  onAddToPlaylistsClicked = () => {
    this.setState({
      isCalloutVisible: !this.state.isCalloutVisible,
    });
  };

  onRenderItem = item => {
    if (item.onRender) {
      return item.onRender(item);
    }
    const { icon, subMenuProps, name, beforeText, ...props } = item;

    if (item.key === 'Save') {
      return (
        <Fragment>
          <div ref={this.addToPlaylistsRef}>
            <VideoButton
              iconProps={{ iconName: icon }}
              menuProps={subMenuProps}
              text={name}
              beforeText={beforeText !== undefined ? `${beforeText}` : undefined}
              {...props}
            />
          </div>
          {this.state.isCalloutVisible ? (
            <SaveToPlaylistsCallout
              StyledButton={VideoButton}
              addToPlaylistsRef={this.addToPlaylistsRef}
              video={this.state.video}
              onDismiss={this.onAddToPlaylistsClicked}
            />
          ) : null}
        </Fragment>
      );
    }
    return (
      <VideoButton
        iconProps={{ iconName: icon }}
        menuProps={subMenuProps}
        text={name}
        beforeText={beforeText !== undefined ? `${beforeText}` : undefined}
        {...props}
      />
    );
  };

  fetchComments = before => axios.get(`/videos/${this.state.videoId}/comments?before=${before}`);

  postComment = comment => axios.post(`/videos/${this.state.video.id}/comments`, { comment });

  onRenderOverflowButton(overflowItems) {
    return (
      <VideoButton menuIconProps={{ iconName: 'More' }} menuProps={{ items: overflowItems }} />
    );
  }

  onLike = () => {
    this.setState({ likeDelta: this.state.likeDelta + 1 });
    axios.put(`/videos/video/${this.state.video.id}/like`);
  };
  onDislike = () => {
    this.setState({ likeDelta: this.state.likeDelta - 1 });
    axios.put(`/videos/video/${this.state.video.id}/dislike`);
  };

  onTimeUpdate = (time, duration) => {
    if (!this.state.viewed && (time > 120 || time / duration >= 0.4)) {
      this.setState({ viewed: true });
      axios.put(`/videos/video/${this.state.video.id}/view`);
    }
  };

  onEnd = () => {
    this.setState({ nextVideoPreview: !!this.state.nextVideoId });
  };

  onTimerEnd = () => {
    this.cancelNextPreview();
    this.renderRedirect('Next');
  };

  cancelNextPreview = () => this.setState({ nextVideoPreview: false });

  renderRedirect = buttonClicked => {
    const { nextVideoId, prevVideoId, playlist } = this.state;

    switch (buttonClicked) {
      case 'Previous':
        if (prevVideoId) {
          this.props.history.push(`/watch?v=${prevVideoId}&list=${playlist.id}`);
        }
        break;
      case 'Next':
      default:
        if (nextVideoId) {
          this.props.history.push(`/watch?v=${nextVideoId}&list=${playlist.id}`);
        }
        break;
    }
  };

  render() {
    const {
      nextVideoPreview,
      nextVideoId,
      prevVideoId,
      nextVideo,
      playlist,
      video,
      error,
      likeDelta,
      currVideoIndex,
    } = this.state;
    const { user } = this.props;

    let likeCount = 0;
    let userLikes = false;
    if (video) {
      likeCount = +video.likeCount + likeDelta;
      userLikes = (video.userLikes && likeDelta >= 0) || (!video.userLikes && likeDelta > 0);
    }

    return (
      <Box px={20} pt={24}>
        <Helmet>
          <title>{`VOD${video && video.id ? ` - ${video.name}` : ''}`}</title>
        </Helmet>
        <Flex justifyContent="center">
          <Box width={[1, 1, 1, 11 / 12]}>
            <Flex justifyContent="center">
              <Box width={[1, 1, 1, 0.65]}>
                <VideoContainer>
                  <Player
                    videoId={video && video.id}
                    error={error}
                    onTimeUpdate={this.onTimeUpdate}
                    onEnd={this.onEnd}
                    nextVideoId={nextVideoId}
                    prevVideoId={prevVideoId}
                    playlistId={playlist && playlist.id}
                    renderRedirect={this.renderRedirect}
                  >
                    {!!nextVideo ? (
                      <NextVideoPreview
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        nextVideoId={nextVideo.id}
                        show={!!nextVideoPreview}
                      >
                        <NextVideoBackground />
                        <div>הסרטון הבא</div>
                        <NextVideoName>{nextVideo.name}</NextVideoName>
                        <NextVideoChannel>{nextVideo.channel.name}</NextVideoChannel>
                        <TimerAction time={nextVideoPreview ? 5 : 0} onTimeEnd={this.onTimerEnd}>
                          <NextVideoButton
                            iconProps={{ iconName: 'Next' }}
                            onClick={this.onTimerEnd}
                          />
                        </TimerAction>
                        <DefaultButton text="בטל" onClick={this.cancelNextPreview} />
                      </NextVideoPreview>
                    ) : null}
                  </Player>
                  <Box mt={20}>
                    <Shimmer
                      shimmerElements={[{ type: ElemType.line, height: 32 }]}
                      width="40%"
                      isDataLoaded={!!video}
                    >
                      <span className="ms-font-xxl">{video && video.name}</span>
                    </Shimmer>
                  </Box>
                  <VideoSection>
                    <Shimmer
                      shimmerElements={[
                        { type: ElemType.line, width: '20%', height: 18 },
                        { type: ElemType.gap, width: '62%', height: 20 },
                        { type: ElemType.line, width: '8%', height: 25 },
                        { type: ElemType.gap, width: '2%', height: 20 },
                        { type: ElemType.line, width: '8%', height: 25 },
                      ]}
                      width="100%"
                      isDataLoaded={!!video}
                    >
                      {video && (
                        <SpreadItems>
                          <span className="ms-fontSize-mPlus">{video.viewCount} צפיות</span>
                          <OverflowSet
                            items={[
                              {
                                key: 'like',
                                name: userLikes ? 'אוהב' : 'אהבתי',
                                beforeText: likeCount,
                                icon: userLikes ? 'LikeSolid' : 'Like',
                                ariaLabel: 'אהבתי',
                                onClick: userLikes ? this.onDislike : this.onLike,
                              },
                              {
                                key: 'share',
                                name: 'שתף',
                                icon: 'Share',
                                onClick: console.log,
                              },
                              {
                                key: 'Save',
                                name: 'שמור',
                                icon: 'AddNotes',
                                onClick: this.onAddToPlaylistsClicked,
                              },
                            ]}
                            onRenderOverflowButton={this.onRenderOverflowButton}
                            onRenderItem={this.onRenderItem}
                          />
                        </SpreadItems>
                      )}
                    </Shimmer>
                  </VideoSection>
                  <VideoSection>
                    <ChannelRow size={72} channel={video && video.channel} user={user} />
                    <VideoDescription className="ms-font-s-plus">
                      <Shimmer
                        customElementsGroup={
                          <ShimmerElementsGroup
                            flexWrap
                            width={'100%'}
                            shimmerElements={[
                              { type: ElemType.line, width: '100%' },
                              { type: ElemType.line, width: '75%' },
                              { type: ElemType.gap, width: '25%', height: 20 },
                              { type: ElemType.line, width: '50%' },
                              { type: ElemType.gap, width: '50%', height: 20 },
                            ]}
                          />
                        }
                        width="100%"
                        isDataLoaded={!!video}
                      >
                        {video && video.description}
                        <TagsContainer>
                          <Label>
                            <Icon iconName="Tag" /> תגיות:
                          </Label>
                          <Flex>
                            {video && video.tags.map(tag => <VideoTag>{tag.tag}</VideoTag>)}
                          </Flex>
                        </TagsContainer>
                      </Shimmer>
                    </VideoDescription>
                  </VideoSection>
                  <VideoSection>
                    <CommentSection
                      postComment={this.postComment}
                      fetchComments={this.fetchComments}
                      commentableId={this.state.videoId}
                      user={this.props.user}
                    />
                  </VideoSection>
                </VideoContainer>
              </Box>
              <Box mx={2} />
              <Box width={[1, 1, 1, 0.35]}>
                {playlist && playlist.videos.length && currVideoIndex >= 0 ? (
                  <PlaylistPanel
                    playlist={playlist}
                    currVideoIndex={currVideoIndex}
                    loading={this.state.loadingPlaylist}
                    currentVideo={video && video.id}
                  />
                ) : null}
                <VideoList
                  videos={this.state.related}
                  loading={this.state.loadingRelated}
                  type={VIDEO_LIST_TYPE.LIST}
                />
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Box>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(VideoPage, mapStateToProps);
