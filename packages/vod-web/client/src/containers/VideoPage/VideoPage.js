import React, { Component } from 'react';
import { createStructuredSelector } from 'reselect';

import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';

import { OverflowSet } from 'office-ui-fabric-react/lib/OverflowSet';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';

import createReduxContainer from 'utils/createReduxContainer';
import { makeSelectSidebar } from 'containers/App/selectors';

// import Plyr from 'components/ThemedPlyr';
import Player from 'components/ThemedPlayer';
import VideoList, { VIDEO_LIST_TYPE } from 'components/VideoList';

const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  & > * + * {
    margin-top: 6px;
  }
`;

const VideoSection = styled.div`
  margin-bottom: 10px;
  padding-bottom: 12px;
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
`;

class VideoPage extends Component {

  onRenderItem(item) {
    if (item.onRender) {
      return item.onRender(item);
    }
    return <VideoButton iconProps={{ iconName: item.icon }} menuProps={item.subMenuProps} text={item.name} />;
  }

  onRenderOverflowButton(overflowItems) {
    return (
      <VideoButton
        menuIconProps={{ iconName: 'More' }}
        menuProps={{ items: overflowItems }}
      />
    );
  }

  render() {
    return (
      <Box px={20} pt={24}>
        <Flex justifyContent="center">
          <Box width={[1, 1, 1, 11/12]}>
            <Flex justifyContent="center">
              <Box width={[1, 1, 1, 0.68]}>
                <VideoContainer>
                  {/* <Plyr
                    type="youtube" // or "vimeo"
                    videoId="dQw4w9WgXcQ"
                  /> */}
                  <Player />
                  <div>
                    <span className="ms-fontSize-xxl">אביתר בנאי - עד מתי</span>
                  </div>
                  <VideoSection>
                    <SpreadItems>
                      <span className="ms-fontSize-mPlus">1,231,289 צפיות</span>
                      <OverflowSet
                        items={[
                          {
                            key: 'like',
                            name: 'אהבתי',
                            icon: 'Like',
                            ariaLabel: 'אהבתי',
                            onClick: () => {
                              return;
                            },
                          },
                          {
                            key: 'dislike',
                            name: 'לא אהבתי',
                            icon: 'Dislike',
                            onClick: () => {
                              return;
                            }
                          },
                          {
                            key: 'share',
                            name: 'שתף',
                            icon: 'Share',
                            onClick: () => {
                              return;
                            }
                          }
                        ]}
                        onRenderOverflowButton={this.onRenderOverflowButton}
                        onRenderItem={this.onRenderItem}
                      />
                    </SpreadItems>
                  </VideoSection>
                  <VideoSection>
                    <SpreadItems>
                      <Persona
                        imageUrl="https://scontent.ftlv5-1.fna.fbcdn.net/v/t1.0-9/36404826_10212689636864924_812286978346188800_n.jpg?_nc_cat=0&oh=691bf8c0957e2ba052de6a1eb9ef5c08&oe=5BD4C941"
                        imageInitials="גפ"
                        text="גרשון פפיאשוילי"
                        secondaryText="העלה לפני כמה דקות"
                        size={PersonaSize.size100}
                      />
                      <DefaultButton
                        text="עקוב"
                        iconProps={{ iconName: 'FollowUser' }}
                        primary
                      />
                    </SpreadItems>
                    <VideoDescription className="ms-font-s-plus">
                      לורם איפסום דולור סיט אמט, קונסקטורר אדיפיסינג אלית צש בליא, מנסוטו צמלח לביקו ננבי, צמוקו בלוקריה שיצמה ברורק. מוסן מנת. להאמית קרהשק סכעיט דז מא, מנכם למטכין נשואי מנורך. להאמית קרהשק סכעיט דז מא, מנכם למטכין נשואי מנורך. ושבעגט ליבם סולגק. בראיט ולחת צורק מונחף, בגורמי מגמש. תרבנך וסתעד לכנו סתשם השמה - לתכי מורגם בורק? לתיג ישבעס.
                    </VideoDescription>
                  </VideoSection>
                </VideoContainer>
              </Box>
              <Box mx={2} />
              <Box width={[1, 1, 1, 0.32]}>
                <VideoList type={VIDEO_LIST_TYPE.VERTICAL} />
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Box>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  sidebar: makeSelectSidebar(),
});

export default createReduxContainer(VideoPage, mapStateToProps);
