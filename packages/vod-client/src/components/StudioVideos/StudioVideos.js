import React, { Component, Fragment } from 'react';
import { Box } from 'grid-styled';
import styled from 'styled-components';

import { Selection } from 'office-ui-fabric-react/lib/Selection';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import { Sticky, StickyPositionType } from 'office-ui-fabric-react/lib/Sticky';
import { ScrollablePane, ScrollbarVisibility } from 'office-ui-fabric-react/lib/ScrollablePane';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';

import axios from 'utils/axios';
import Modal from 'components/Modal';
import VideoThumbnail from 'components/VideoThumbnail';
import VideoEditForm from 'components/VideoEditForm';

import videosColumns from './columns';
import EditProperty from './EditProperty';
import DeleteForm from './DeleteForm';
import EditPrivacy from './EditPrivacy';

const ActionsBox = styled(Box)`
  max-height: ${({ hasItems }) => (hasItems ? 40 : 0)}px;
  overflow: hidden;
  transition: max-height 200ms ease-in-out;
`;

class StudioVideos extends Component {
  constructor() {
    super();
    this.state = {
      videoList: [],
      selection: new Selection({ onSelectionChanged: this.onSelectionChanged }),
      selectionDetails: [],
      modalIsOpen: false,
      editType: '',
    };
  }

  componentDidMount() {
    this.fetchVideos();
  }

  componentDidUpdate(prevProps) {
    if (this.props.user.id !== prevProps.user.id) {
      this.fetchVideos();
    }
  }

  fetchVideos = () => {
    axios
      .get(`/videos/managed`)
      .then(({ data }) => {
        this.setState({
          videoList: data,
        });
      })
      .catch(err => {
        console.error(err);
      });
  };

  onVideoDelete = videos => {
    return Promise.all(
      videos.map(video => {
        return axios
          .delete(`/videos/${video.id}`)
          .then(result => Promise.resolve({ id: video.id, status: 'success', result }))
          .catch(error => Promise.resolve({ id: video.id, status: 'error', error }));
      }),
    ).finally(this.fetchVideos);
  };

  onVideoShare = videos => {
    return axios.put(`/videos/permissions`, videos).finally(this.fetchVideos);
  };

  onVideoEdit = video => {
    return axios.put(`/videos/video/${video.id}`, video).finally(this.fetchVideos);
  };

  onPropertyEdit = (videos, property) => {
    return axios.put(`/videos/property/${property}`, videos).finally(this.fetchVideos);
  };

  onTagsEdit = (videosId, action, tags) => {
    return axios
      .put(`/videos/tags/${action}`, {
        videosId,
        tags,
      })
      .finally(this.fetchVideos);
  };

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

  getVideoList = () => {
    const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    if (!this.state.videoList.length) {
      return [];
    }
    return this.state.videoList.map(video => {
      return {
        thumbnail: (
          <VideoThumbnail
            src={`${window._env_.REACT_APP_STREAMER_HOSTNAME}/${video.id}/thumbnail.png`}
            width={180}
            height={101}
          />
        ),
        id: video.id,
        name: video.name,
        description: video.description,
        privacy: video.privacy,
        privacyDisplay: video.privacy === 'PUBLIC' ? 'ציבורי' : 'פרטי',
        state: video.state,
        stateDisplay: this.getVideoState(video.state, video.upload),
        acls: video.acls,
        tags: video.tags,
        channelName: `${video.channel.name} (${video.channel.id})`,
        channelId: video.channel.id,
        viewsCount: video.viewsCount,
        likesCount: video.likesCount,
        commentsCount: video.commentsCount,
        createdAt: new Date(video.createdAt).toLocaleDateString('hebrew', options),
      };
    });
  };

  getGroupsList = () => {
    let startIndex = 0;
    const channels = [];

    if (!this.state.videoList.length) {
      return [];
    }

    this.state.videoList.forEach(video => {
      if (!channels[video.channel.id]) {
        channels[video.channel.id] = { name: video.channel.name, videos: [] };
      }
      channels[video.channel.id].videos.push(video);
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

  onSelectionChanged = () => {
    this.setState({
      selectionDetails: this.state.selection.getSelection(),
    });
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

    const { onPropertyEdit, onVideoShare, onVideoDelete, onTagsEdit, onVideoEdit } = this;

    switch (editType) {
      case 'delete':
        return (
          <DeleteForm
            videos={selectionDetails}
            onClose={this.changeModalState}
            onSubmit={onVideoDelete}
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

  render() {
    const { modalIsOpen, selection, selectionDetails } = this.state;

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
                  setKey="items"
                  items={this.getVideoList()}
                  groups={this.getGroupsList()}
                  columns={videosColumns}
                  selection={selection}
                  selectionPreservedOnEmptyClick={true}
                  ariaLabelForSelectAllCheckbox="Toggle selection for all items"
                  ariaLabelForSelectionColumn="Toggle selection"
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
        <Modal isOpen={modalIsOpen} title="עריכת סרטון" onDismiss={this.changeModalState}>
          {this.renderModal()}
        </Modal>
      </Fragment>
    );
  }
}

export default StudioVideos;
