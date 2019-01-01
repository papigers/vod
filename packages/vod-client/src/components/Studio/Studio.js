import React, { Component, Fragment } from 'react';
import { Box, Flex } from 'grid-styled';
import styled from 'styled-components';

import { Pivot, PivotItem, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';
import { Selection } from 'office-ui-fabric-react/lib/Selection';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import { Sticky, StickyPositionType } from 'office-ui-fabric-react/lib/Sticky';
import { ScrollablePane, ScrollbarVisibility } from 'office-ui-fabric-react/lib/ScrollablePane';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';

import {videosColumns, playlistsColumns} from './columns';
import VideoThumbnail from 'components/VideoThumbnail';
import Modal from 'components/Modal';
import EditProperty from './EditProperty';
import DeleteForm from './DeleteForm';
import EditPrivacy from './EditPrivacy';
import VideoEditForm from 'components/VideoEditForm';
import PlaylistEditForm from 'components/PlaylistEditForm';

const ActionsBox = styled(Box)`
  max-height: ${({ hasItems }) => (hasItems ? 40 : 0)}px;
  overflow: hidden;
  transition: max-height 200ms ease-in-out;
`;

const TitleBox = styled(Box).attrs(() => ({
  pr: 30,
  pl: 30,
}))`
  .ms-Shimmer-shimmerWrapper {
    background: ${({ theme }) =>
      `linear-gradient(to left, ${theme.palette.neutralLight} 0%, ${
        theme.palette.neutralQuaternaryAlt
      } 50%, ${theme.palette.neutralLight} 100%) 0px 0px / 90% 100% no-repeat ${
        theme.palette.neutralQuaternaryAlt
      }`};
  }

  &,
  .ms-ShimmerGap-root {
    background-color: ${({ theme }) => theme.palette.neutralLighterAlt};
    border-color: ${({ theme }) => theme.palette.neutralLighterAlt};
  }

  .ms-ShimmerLine-root,
  .ms-ShimmerCircle-root {
    border-color: ${({ theme }) => theme.palette.neutralLighterAlt};

    svg {
      fill: ${({ theme }) => theme.palette.neutralLighterAlt};
    }
  }
`;

const CategoryHeader = styled.h2`
  display: inline-block;
`;

const StudioContainer = styled(Flex)`
  height: calc(100vh - 64px);
  transition: width 300ms ease-in-out;
  box-sizing: border-box;
  overflow: auto;
`;

class Studio extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: 'videos',
      selection: new Selection({ onSelectionChanged: this.onSelectionChanged }),
      selectionDetails: [],
      modalIsOpen: false,
      editType: '',
    };
  }

  getVideoState(state, upload) {
    let display = '';
    switch (state) {
      case 'PUBLISHED':
        display = 'מפורסם';
        break;
      case 'UNLISTED':
        display = 'קישור בלבד';
        break;
      case 'DRAFT':
      default:
        display = 'טיוטה';
        break;
    }
    if (!!upload) {
      display += ' - בתהליך העלאה';
    }
    return display;
  }

  getPlaylistState(state) {
    switch (state) {
      case 'PUBLISHED':
        return 'מפורסם';
      case 'UNLISTED':
        return 'קישור בלבד';
      case 'PRIVATE':
        return 'פרטי';
      default:
        return 404;
    }
  }

  getItemList = (itemsList) => {
    const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    if (!itemsList.length) {
      return [];
    }
    return itemsList.map(item => {
      if (Object.keys(item).includes('videos')) {
        return {
          thumbnail: (
            <VideoThumbnail
              src={`${process.env.REACT_APP_STREAMER_HOSTNAME}/${item.videos[0].id}/thumbnail.png`}
              width={200}
              height={120}
            />
          ),
          id: item.id,
          name: item.name,
          description: item.description,
          state: item.state,
          stateDisplay: this.getPlaylistState(item.state),
          channelName: item.channel.name,
          channelId: item.channel.id,
          videosCount: item.videos.length,
          videos: item.videos,
          createdAt: new Date(item.createdAt).toLocaleDateString('hebrew', options),
          updatedAt: new Date(item.updatedAt).toLocaleDateString('hebrew', options),
        };
      }
      return {
        thumbnail: (
          <VideoThumbnail
            src={`${process.env.REACT_APP_STREAMER_HOSTNAME}/${item.id}/thumbnail.png`}
            width={200}
            height={120}
          />
        ),
        id: item.id,
        name: item.name,
        description: item.description,
        privacy: item.privacy,
        privacyDisplay: item.privacy === 'PUBLIC' ? 'ציבורי' : 'פרטי',
        state: item.state,
        stateDisplay: this.getVideoState(item.state, item.upload),
        acls: item.acls,
        tags: item.tags,
        channelName: item.channel.name,
        channelId: item.channel.id,
        viewsCount: item.viewsCount,
        likesCount: item.likesCount,
        commentsCount: item.commentsCount,
        createdAt: new Date(item.createdAt).toLocaleDateString('hebrew', options),
      };
    });
  };

  getGroupsList = (itemsList) => {
    let startIndex = 0;
    const channels = [];

    if (!itemsList.length) {
      return [];
    }

    itemsList.forEach(item => {
      if (!channels[item.channel.id]) {
        channels[item.channel.id] = { name: item.channel.name, videos: [] };
      }
      channels[item.channel.id].videos.push(item);
    });

    return Object.keys(channels).map(id => {
      let start = startIndex;
      startIndex += channels[id].videos.length;
      return {
        key: id,
        name: channels[id].name,
        startIndex: start,
        count: channels[id].videos.length,
      };
    });
  };

  onLinkClick = item => {
    this.state.selection.setAllSelected(false);
    this.setState({
      activeTab: item.props.itemKey,
    });
  };

  onSelectionChanged = () => {
    if (this.state.activeTab === 'playlists' && this.state.selection.getSelection().length > 1) {
      this.state.selection.setAllSelected(false);      
    } else {
      this.setState({
        selectionDetails: this.state.selection.getSelection(),
      });
    }
  };

  onMenuClick = key => {
    this.setState({
      editType: key,
      modalIsOpen: !this.state.modalIsOpen,
    });
  };

  changeModalState = () => {
    if (this.state.modalIsOpen) {
      this.state.selection.setAllSelected(false);
    }
    this.setState({
      modalIsOpen: !this.state.modalIsOpen,
    });
  };

  onRenderDetailsHeader(props, defaultRender) {
    return (
      <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced={true}>
        {defaultRender({
          ...props,
          onRenderColumnHeaderTooltip: tooltipHostProps => <TooltipHost {...tooltipHostProps} />,
        })}
      </Sticky>
    );
  }

  renderModal() {
    const { editType, selectionDetails } = this.state;

    const { onPropertyEdit, onVideoShare, onDelete, onTagsEdit, onVideoEdit } = this.props;

    switch (editType) {
      case 'delete':
        return (
          <DeleteForm
            videos={selectionDetails}
            onClose={this.changeModalState}
            onSubmit={onDelete}
          />
        );
      case 'share':
        return (
          <EditPrivacy
            videos={selectionDetails}
            onClose={this.changeModalState}
            onSubmit={onVideoShare}
          />
        );
      case 'editVideo':
        return (
          <VideoEditForm
            video={selectionDetails[0]}
            onClose={this.changeModalState}
            onSubmit={onVideoEdit}
          />
        );
      case 'editPlaylist':
          return (
          <PlaylistEditForm
            playlist={selectionDetails[0]}
            onClose={this.changeModalState}
          />
          );
      case 'name':
      case 'description':
      case 'tags':
      case 'state':
        return (
          <EditProperty
            videos={selectionDetails}
            editType={editType}
            onClose={this.changeModalState}
            onPropertyEdit={onPropertyEdit}
            onTagsEdit={onTagsEdit}
          />
        );
      default:
        return <p>500</p>;
    }
  }

  renderTab() {
    const { activeTab, selection, selectionDetails } = this.state;

    const { videoList, playlistList } = this.props;

    switch (activeTab) {
      case 'videos':
        selection.setItems(videoList, false);
        return (
          <Fragment>
            <ActionsBox hasItems={selectionDetails.length}>
              <CommandBar
                items={
                  selectionDetails.length <= 1
                    ? [
                        {
                          key: 'editVideo',
                          name: 'ערוך סרטון',
                          iconProps: {
                            iconName: 'Edit',
                          },
                          onClick: () => {
                            this.onMenuClick('editVideo');
                          },
                        },
                        {
                          key: 'delete',
                          name: 'מחק',
                          iconProps: {
                            iconName: 'Delete',
                          },
                          onClick: () => {
                            this.onMenuClick('delete');
                          },
                        },
                      ]
                    : [
                        {
                          key: 'edit',
                          name: 'ערוך',
                          iconProps: {
                            iconName: 'Edit',
                          },
                          subMenuProps: {
                            items: [
                              {
                                key: 'name',
                                name: 'שם',
                                iconProps: {
                                  iconName: 'Rename',
                                },
                                onClick: () => {
                                  this.onMenuClick('name');
                                },
                              },
                              {
                                key: 'description',
                                name: 'תיאור',
                                iconProps: {
                                  iconName: 'AlignRight',
                                },
                                onClick: () => {
                                  this.onMenuClick('description');
                                },
                              },
                              {
                                key: 'tags',
                                name: 'תגיות',
                                iconProps: {
                                  iconName: 'tag',
                                },
                                onClick: () => {
                                  this.onMenuClick('tags');
                                },
                              },
                              {
                                key: 'state',
                                name: 'מצב פרסום',
                                iconProps: {
                                  iconName: 'RedEye',
                                },
                                onClick: () => {
                                  this.onMenuClick('state');
                                },
                              },
                            ],
                          },
                        },
                        {
                          key: 'share',
                          name: 'שנה הרשאות',
                          iconProps: {
                            iconName: 'EditContact',
                          },
                          onClick: () => {
                            this.onMenuClick('share');
                          },
                        },
                        {
                          key: 'delete',
                          name: 'מחק',
                          iconProps: {
                            iconName: 'Delete',
                          },
                          onClick: () => {
                            this.onMenuClick('delete');
                          },
                        },
                      ]
                }
                farItems={[
                  {
                    key: 'info',
                    name:
                      selectionDetails.length === 1
                        ? `נבחר פריט אחד`
                        : `נבחרו ${selectionDetails.length} פריטים`,
                    iconProps: {
                      iconName: 'Info',
                    },
                  },
                ]}
              />
            </ActionsBox>
            <div style={{ position: 'relative', flexGrow: 1, flexShrink: 0 }}>
              <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
                <Box>
                  <MarqueeSelection selection={selection}>
                    <DetailsList
                      setKey="videos"
                      items={this.getItemList(videoList)}
                      groups={this.getGroupsList(videoList)}
                      columns={videosColumns}
                      selection={selection}
                      selectionPreservedOnEmptyClick={true}
                      ariaLabelForSelectAllCheckbox="לחץ לבחירת כל הסרטונים"
                      ariaLabelForSelectionColumn="לחץ לבחירה"
                      groupProps={{
                        showEmptyGroups: true,
                      }}
                      selectionMode={SelectionMode.multiple}
                      onRenderDetailsHeader={this.onRenderDetailsHeader}
                      listProps={{ renderedWindowsAhead: 1, renderedWindowsBehind: 1 }}
                    />
                  </MarqueeSelection>
                </Box>
              </ScrollablePane>
            </div>
          </Fragment>
        );
      case 'playlists':
        return (
        <Fragment>
          <ActionsBox hasItems={selectionDetails.length}>
            <CommandBar
              items={
                [
                  {
                    key: 'editPlaylist',
                    name: 'ערוך פלייליסט',
                    iconProps: {
                      iconName: 'Edit',
                    },
                    onClick: () => {
                      this.onMenuClick('editPlaylist');
                    },
                  },
                  {
                    key: 'delete',
                    name: 'מחק',
                    iconProps: {
                      iconName: 'Delete',
                    },
                    onClick: () => {
                      this.onMenuClick('delete');
                    },
                  },
                ]
              }
            />
          </ActionsBox>
          <div style={{ position: 'relative', flexGrow: 1, flexShrink: 0 }}>
            <ScrollablePane scrollbarVisibility={ScrollbarVisibility.always}>
              <Box>
                  <DetailsList
                    setKey="playlists"
                    items={this.getItemList(playlistList)}
                    groups={this.getGroupsList(playlistList)}
                    columns={playlistsColumns}
                    selection={selection}
                    ariaLabelForSelectionColumn="לחץ לבחירה"
                    selectionMode={SelectionMode.single}
                    onRenderDetailsHeader={this.onRenderDetailsHeader}
                    listProps={{ renderedWindowsAhead: 1, renderedWindowsBehind: 1 }}
                  />
              </Box>
            </ScrollablePane>
          </div>
        </Fragment>
        );
      case 'analytics':
        return <span>analytics</span>;
      default:
        return <span>אין פה כלום</span>;
    }
  }

  render() {
    const { modalIsOpen, selectionDetails, editType} = this.state;
    return (
      <Fragment>
        <StudioContainer flexDirection="column">
          <Flex flexDirection="column" style={{ position: 'relative', height: '100%' }}>
            <TitleBox>
              <CategoryHeader>{'סטודיו'}</CategoryHeader>
              <Pivot linkSize={PivotLinkSize.large} headersOnly onLinkClick={this.onLinkClick}>
                <PivotItem itemIcon="MSNVideos" linkText="סרטונים" itemKey="videos" />
                <PivotItem itemIcon="Stack" linkText="פלייליסטים" itemKey="playlists" />
                <PivotItem itemIcon="AnalyticsView" linkText="אנליטיקות" itemKey="analytics" />
              </Pivot>
            </TitleBox>
            {this.renderTab()}
          </Flex>
        </StudioContainer>
        <Modal
          isOpen={modalIsOpen}
          title={
            editType === 'editPlaylist' ?
            'עריכת פלייליסט'
            : selectionDetails.length > 1 ?
            "עריכת סרטונים"
            :"עריכת סרטון"
            }
          onDismiss={this.changeModalState}
        >
          {this.renderModal()}
        </Modal>
      </Fragment>
    );
  }
}

export default Studio;
