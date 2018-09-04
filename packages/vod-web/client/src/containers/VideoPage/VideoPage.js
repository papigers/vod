import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import qs from 'query-string';

import { OverflowSet } from 'office-ui-fabric-react/lib/OverflowSet';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Shimmer, ShimmerElementType as ElemType, ShimmerElementsGroup } from 'office-ui-fabric-react/lib/Shimmer';

// import Plyr from 'components/ThemedPlyr';
import Player from 'components/ThemedPlayer';
import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';
import axios from 'utils/axios';

const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const VideoSection = styled(Box).attrs({
  my: 10,
  pb: 12,
})`
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
`;

const SpreadItems = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const VideoDescription = styled.div`
  margin: 0 100px;
  margin-top: -16px;
  padding: 0 16px;
`;

const VideoButton = styled(DefaultButton)`
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: space-around;

  &:hover, &:active {
    &:before {
      background: transparent;
    }
  }

  &:before {
    content: ${({ beforeText }) => `'${beforeText || ''}'`}; 
    display: ${({ beforeText }) => beforeText !== undefined ? 'inline' : 'none'};
    font-size: 1.1em;
    font-weight: bold;
    color: ${({ theme }) => theme.palette.themePrimary};
    background: ${({ theme }) => theme.palette.neutralLight};
    padding: 4px 12px;
    margin-left: 6px;
    position: relative;
    top: -1px;
  }
`;

class VideoPage extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      error: null,
      video: null,
      likeDelta: 0,
      viewed: false,
    };
  }
  
  static getDerivedStateFromProps(props, state) {
    const propsId = qs.parse(props.location.search).v;
    if (!state.videoId || (state.videoId !== propsId)) {
      return {
        videoId: propsId,
        video: null,
        loading: true,
        error: null,
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
    axios.get(`/videos/video/${this.state.videoId}`)
      .then(({ data }) => {
        this.setState({
          video: data,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        // TODO: do something
        this.setState({
          video: null,
          loading: false,
          error: 'הסרטון אינו זמין',
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

  onRenderOverflowButton(overflowItems) {
    return (
      <VideoButton
        menuIconProps={{ iconName: 'More' }}
        menuProps={{ items: overflowItems }}
      />
    );
  }

  onLike = () => {
    this.setState({ likeDelta: this.state.likeDelta + 1 });
    axios.put(`/videos/video/${this.state.video.id}/like`);
  }
  onDislike = () => {
    this.setState({ likeDelta: this.state.likeDelta - 1 });
    axios.put(`/videos/video/${this.state.video.id}/dislike`);
  }
  onTimeUpdate = (time, duration) => {
    if (!this.state.viewed && (time > 120 || (time / duration >= 0.66))) {
      this.setState({ viewed: true });
      axios.put(`/videos/video/${this.state.video.id}/view`);
    }
  }

  render() {
    const { video, error, likeDelta } = this.state;
    let likeCount = 0;
    let userLikes = false;
    if (video) {
      likeCount = video.likeCount + likeDelta;
      userLikes = (video.userLikes && likeDelta >= 0) || (!video.userLikes && likeDelta > 0);
    }

    const LinkOnLoad = video ? Link : 'div';

    return (
      <Box px={20} pt={24}>
        <Flex justifyContent="center">
          <Box width={[1, 1, 1, 11/12]}>
            <Flex justifyContent="center">
              <Box width={[1, 1, 1, 0.65]}>
                <VideoContainer>
                  <Player videoId={video && video.id} error={error} onTimeUpdate={this.onTimeUpdate} />
                  <Box mt={20} className="ms-font-xxl">
                    <Shimmer shimmerElements={[{ type: ElemType.line, height: 32 }]} width='40%' isDataLoaded={!!video}>
                      {video && video.name}
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
                      width='100%'
                      isDataLoaded={!!video}
                    >
                      {video && (
                        <SpreadItems>
                          <span className="ms-fontSize-mPlus">{video.viewCount} צפיות</span>
                          <OverflowSet
                            items={[
                              {
                                key: 'like',
                                name: `אהבתי`,
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
                              }
                            ]}
                            onRenderOverflowButton={this.onRenderOverflowButton}
                            onRenderItem={this.onRenderItem}
                          />
                        </SpreadItems>
                      )}
                    </Shimmer>
                  </VideoSection>
                  <VideoSection>
                    <Shimmer
                      customElementsGroup={(
                        <Box width={1}>
                          <Flex>
                            <ShimmerElementsGroup
                              shimmerElements={[
                                { type: ElemType.circle, height: 100 },
                                { type: ElemType.gap, width: 16, height: 100 }
                              ]}
                            />
                            <ShimmerElementsGroup
                              flexWrap
                              width={'calc(100% - 200px)'}
                              shimmerElements={[
                                { type: ElemType.gap, width: '100%', height: 25 },
                                { type: ElemType.line, width: '50%', height: 20 },
                                { type: ElemType.gap, width: '50%', height: 20 },
                                { type: ElemType.line, width: '30%', height: 16 },
                                { type: ElemType.gap, width: '70%', height: 16 },
                                { type: ElemType.gap, width: '100%', height: 25 },
                              ]}
                            />
                            <ShimmerElementsGroup
                              flexWrap
                              width={100}
                              shimmerElements={[
                                { type: ElemType.gap, width: '100%', height: 33.333 },
                                { type: ElemType.line, width: '100%', height: 24 },
                                { type: ElemType.gap, width: '100%', height: 33.333 },
                              ]}
                            />
                          </Flex>
                        </Box>
                      )}
                      width='100%'
                      isDataLoaded={!!video}
                    >
                      <SpreadItems>
                        <LinkOnLoad to={video && `/channel/${video.channel.id}`}>
                          <Persona
                            imageUrl={video && video.channel && `/profile/${video.channel.id}/profile.png`}
                            text={video && video.channel && video.channel.name}
                            secondaryText={video ? `הועלה ב: ${(new Date(video.createdAt)).toLocaleString()}` : ''}
                            size={PersonaSize.size100}
                          />
                        </LinkOnLoad>
                        <DefaultButton
                          text="עקוב"
                          iconProps={{ iconName: 'FollowUser' }}
                          primary
                        />
                      </SpreadItems>
                    </Shimmer>
                    <VideoDescription className="ms-font-s-plus">
                      <Shimmer
                        customElementsGroup={(
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
                        )}
                        width='100%'
                        isDataLoaded={!!video}
                      >
                        {video && video.description}
                      </Shimmer>
                    </VideoDescription>
                  </VideoSection>
                </VideoContainer>
              </Box>
              <Box mx={2} />
              <Box width={[1, 1, 1, 0.35]}>
                <VideoList type={VIDEO_LIST_TYPE.LIST} />
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Box>
    );
  }
}

export default VideoPage
