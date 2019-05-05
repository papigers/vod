import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import qs from 'query-string';

import { OverflowSet } from 'office-ui-fabric-react/lib/OverflowSet';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import {
  Shimmer,
  ShimmerElementType as ElemType,
  ShimmerElementsGroup,
} from 'office-ui-fabric-react/lib/Shimmer';
import { Label } from 'office-ui-fabric-react/lib/Label';

import createReduxContainer from 'utils/createReduxContainer';
import { makeSelectUser } from 'containers/Root/selectors';

// import Plyr from 'components/ThemedPlyr';
import Player from 'components/ThemedPlayer';
import CommentSection from 'components/CommentSection';
import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';
import ChannelRow from 'containers/ChannelRow';

import axios from 'utils/axios';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
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

const TagsContainer = styled(Box)`
  .ms-Label i {
    color: ${({ theme }) => theme.palette.themePrimary};
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

class VideoPage extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      error: null,
      related: [],
      loadingRelated: true,
      errorRelated: null,
      video: null,
      likeDelta: 0,
      viewed: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const propsId = qs.parse(props.location.search).v;
    if (!state.videoId || state.videoId !== propsId) {
      return {
        videoId: propsId,
        video: null,
        related: [],
        loading: true,
        error: null,
        loadingRelated: true,
        errorRelated: null,
      };
    }
    return null;
  }

  componentDidMount() {
    this.fetchVideo();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.videoId !== this.state.videoId) {
      this.fetchVideo();
    }
  }

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

  onRenderItem(item) {
    if (item.onRender) {
      return item.onRender(item);
    }
    const { icon, subMenuProps, name, beforeText, ...props } = item;
    return (
      <VideoButton
        iconProps={{ iconName: icon }}
        menuProps={subMenuProps}
        text={name}
        beforeText={beforeText !== undefined ? `${beforeText}` : undefined}
        {...props}
      />
    );
  }

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

  render() {
    const { video, error, likeDelta } = this.state;
    const { user } = this.props;
    let likeCount = 0;
    let userLikes = false;
    if (video) {
      likeCount = +video.likeCount + likeDelta;
      userLikes = (video.userLikes && likeDelta >= 0) || (!video.userLikes && likeDelta > 0);
    }

    return (
      <Box px={20} pt={24}>
        <Flex justifyContent="center">
          <Box width={[1, 1, 1, 11 / 12]}>
            <Flex justifyContent="center">
              <Box width={[1, 1, 1, 0.65]}>
                <VideoContainer>
                  <Player
                    videoId={video && video.id}
                    error={error}
                    onTimeUpdate={this.onTimeUpdate}
                  />
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
