import React, { Component, Fragment } from 'react';
import { Box } from 'grid-styled';
import styled from 'styled-components';

import { Selection } from 'office-ui-fabric-react/lib/Selection';
import { Sticky, StickyPositionType } from 'office-ui-fabric-react/lib/Sticky';
import { ScrollablePane, ScrollbarVisibility } from 'office-ui-fabric-react/lib/ScrollablePane';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';

import playlistsColumns from './columns';
import VideoThumbnail from 'components/VideoThumbnail';
import Modal from 'components/Modal';
import DeleteForm from './DeleteForm';
import PlaylistEditForm from 'components/PlaylistEditForm';
import axios from 'utils/axios';

const ActionsBox = styled(Box)`
  max-height: ${({ hasItems }) => (hasItems ? 40 : 0)}px;
  overflow: hidden;
  transition: max-height 200ms ease-in-out;
`;

class StudioPlaylists extends Component {
  constructor() {
    super();
    this.state = {
      playlistList: [],
      selection: new Selection({ onSelectionChanged: this.onSelectionChanged }),
      modalIsOpen: false,
      selectionDetails: [],
    };
  }

  componentDidMount() {
    this.fetchPlaylists();
  }

  componentDidUpdate(prevProps) {
    if (this.props.user.id !== prevProps.user.id) {
      this.fetchPlaylists();
    }
  }

  fetchPlaylists = () => {
    axios
      .get(`/playlists/managed`)
      .then(({ data }) => {
        this.setState({
          playlistList: data,
        });
      })
      .catch(err => {
        console.error(err);
      });
  };

  updatePlaylist = playlist => {
    return axios.put(`/playlists/${playlist.id}`, playlist).finally(this.fetchPlaylists);
  };

  deletePlaylist = id => {
    return axios.delete(`/playlists/${id}`).finally(this.fetchPlaylists);
  };

  changeModalState = () => {
    if (this.state.modalIsOpen) {
      this.state.selection.setAllSelected(false);
    }
    this.setState({
      modalIsOpen: !this.state.modalIsOpen,
    });
  };

  onSelectionChanged = () => {
    if (this.state.selection.getSelection().length > 1) {
      this.state.selection.setAllSelected(false);
    } else {
      this.setState({
        selectionDetails: this.state.selection.getSelection(),
      });
    }
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

  onMenuClick = key => {
    this.setState({
      editType: key,
      modalIsOpen: !this.state.modalIsOpen,
    });
  };

  getPlaylistState(state) {
    switch (state) {
      case 'PUBLISHED':
        return 'מפורסם';
      case 'UNLISTED':
        return 'קישור בלבד';
      case 'DRAFT':
      default:
        return 'טיוטה';
    }
  }

  getItemList = itemsList => {
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
      return {
        thumbnail: (
          <VideoThumbnail
            src={`${window.streamingEndpoint}/${item.videos &&
              item.videos[0] &&
              item.videos[0].id}/thumbnail.png`}
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
    });
  };

  getGroupsList = itemsList => {
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

  renderModal() {
    const { editType, selectionDetails } = this.state;

    switch (editType) {
      case 'delete':
        return (
          <DeleteForm
            playlist={selectionDetails[0]}
            onClose={this.changeModalState}
            onSubmit={this.deletePlaylist}
          />
        );
      case 'editPlaylist':
        return (
          <PlaylistEditForm
            playlist={selectionDetails[0]}
            onClose={this.changeModalState}
            onSubmit={this.updatePlaylist}
          />
        );
      default:
        return <p>500</p>;
    }
  }

  render() {
    const { playlistList, selection, selectionDetails, modalIsOpen } = this.state;

    return (
      <Fragment>
        <ActionsBox hasItems={selectionDetails.length}>
          <CommandBar
            items={[
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
            ]}
          />
        </ActionsBox>

        <div style={{ position: 'relative', flexGrow: 1, flexShrink: 0 }}>
          <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
            <Box>
              <DetailsList
                setKey="playlists"
                items={this.getItemList(playlistList)}
                groups={this.getGroupsList(playlistList)}
                columns={playlistsColumns}
                selection={selection}
                ariaLabelForSelectionColumn="לחץ לבחירה"
                selectionMode={SelectionMode.none}
                onRenderDetailsHeader={this.onRenderDetailsHeader}
                listProps={{ renderedWindowsAhead: 1, renderedWindowsBehind: 1 }}
              />
            </Box>
          </ScrollablePane>
        </div>
        <Modal isOpen={modalIsOpen} title={'עריכת פלייליסט'} onDismiss={this.changeModalState}>
          {this.renderModal()}
        </Modal>
      </Fragment>
    );
  }
}

export default StudioPlaylists;
