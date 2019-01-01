import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { DetailsList, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Selection } from 'office-ui-fabric-react/lib/Selection';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import { Sticky, StickyPositionType } from 'office-ui-fabric-react/lib/Sticky';
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip';
import { IDragDropEvents, IDragDropContext } from 'office-ui-fabric-react/lib/utilities/dragdrop/interfaces';

import VideoStateDropdown from 'components/VideoStateDropdown';
import VideoThumbnail from 'components/VideoThumbnail';
import videosColumns from './columns'

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

const ThumbnailContainer = styled.div`
    display: block;
`;

const PlaylistPropsContainer = styled(Flex)`
  flex-direction: row-reverse;
`;

const FormContainer = styled(Flex)`
  justify-content: center;
`;

const ContentContainer = styled(FormContainer)`
  margin: 1em 0;
`;

const FiledsContainer = styled(FormContainer)`
  flex-direction: column;
`;

const FormButton = styled(DefaultButton)`
  margin: 0 1em;
`;

const DropdownOption = styled.div`
  display: flex;
  align-items: center;
  height: 100%;

  .ms-Dropdown-item:hover &,
  .ms-Dropdown-item:hover & .ms-Persona-primaryText {
    color: ${({ theme }) => theme.palette.themePrimary};
  }

  i {
    margin-left: 8px;
  }
`;

const ErrorMsg = styled(Box)`
  color: #e90000;
  text-align: center;
  font-weight: 600;
  font-size: 1.1em;
`;

class PlaylistEditForm extends Component {
    constructor() {
        super();
        this.state = {
          id: '',
          name: '',
          description: '',
          videos: [],
          state: 'UNLISTED',
          error: null,
          loading: false,
          selection: new Selection(),
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { playlist } = props;
        
        if (playlist && (!state.id || state.id !== playlist.id)) {
          return {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            videos: playlist.videos,
            state: playlist.state,
            privacy: playlist.privacy,
          };
        }
        return null;
    }

    onChangeName = ({ target }) => this.setState({ name: target.value });
    onChangeDescription = ({ target }) => this.setState({ description: target.value });
    onChangeState = (e, { key: state }) => {
        this.setState({ state });
    };

    onRenderPublishedOption = item => {
        const option = item[0] || item;
        return (
          <DropdownOption>
            {option.data && option.data.icon && (
              <Icon iconName={option.data.icon} aria-hidden="true" title={option.text} />
            )}
            <span>{option.text}</span>
          </DropdownOption>
        );
    };

    getPlaylistState = (state) => {
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

    onRenderDetailsHeader = (props, defaultRender) => {
    return (
        <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced={true}>
        {defaultRender({
            ...props,
            onRenderColumnHeaderTooltip: tooltipHostProps => <TooltipHost {...tooltipHostProps} />,
        })}
        </Sticky>
        );
    }

    getItems = () => {
        debugger;
        return this.state.videos.map(video => {
            return {
                id: video.id,
                thumbnail: <VideoThumbnail
                    src={`${process.env.REACT_APP_STREAMER_HOSTNAME}/${video && video.id}/thumbnail.png`}
                    width={100}
                    height={60}
                />,
                name: video.name,
                stateDisplay: this.getPlaylistState(video.state),
                privacyDisplay: video.privacy === 'PUBLIC' ? 'ציבורי' : 'פרטי',
                channelName: video.channel.name
            }
        });
    }

    getDragDropEvents = () => {
        var draggedItems = null;
        debugger;
        return {
            canDrop: (dropContext, dragContext) => {
                return true;
            },
            canDrag: (item) => {
                return true;
            },
            onDragEnter: (item, event) => {
                return 'dragEnter';
            }, // return string is the css classes that will be added to the entering element.
            onDragLeave: (item, event) => {
                return;
            },
            onDrop: (item, event) => {
                if (draggedItems) {
                    this.insertBeforeItem(item, draggedItems);
                }
            },
            onDragStart: (item, itemIndex, selectedItems, event) => {
                draggedItems = selectedItems;
            },
            onDragEnd: (item, event) => {
                draggedItems = null;
            }
        };
    }

    insertBeforeItem = (item, draggedItems) => {
        this.state.selection.setAllSelected(false);
        const selectedVideos = draggedItems.map(item => {
            return this.state.videos.find(video => item.id === video.id);
        });
       
        debugger;
        const videos = this.state.videos.filter((video) => selectedVideos.indexOf(video) === -1);
        let insertIndex = this.state.videos.indexOf(
            this.state.videos.find(video => item.id === video.id)
        );

        // if dragging/dropping on itself, index will be 0.
        if (insertIndex === -1) {
          insertIndex = 0;
        }

        videos.splice(insertIndex, 0, ...selectedVideos);
        this.setState({ videos: videos });
      }

    onSubmit = () => {
        console.log('submit');
        this.setState()
    }

    render() {
        const {
            name,
            description,
            videos,
            state,
            error,
            loading,
        } = this.state;

        return (
            <FormContainer>
                <Form onSubmit={this.onSubmit}>
                <ContentContainer>
                    <PlaylistPropsContainer>
                        <ThumbnailContainer>
                            <VideoThumbnail
                                src={`${process.env.REACT_APP_STREAMER_HOSTNAME}/${videos && videos[0] && videos[0].id}/thumbnail.png`}
                                width={200}
                                height={120}
                            />
                        </ThumbnailContainer>
                        <Box mx={3} />
                        <FiledsContainer>
                            <VideoStateDropdown
                                required
                                label="מצב פרסום"
                                disabled={loading}
                                selectedKey={state}
                                onChange={this.onChangeState}
                                placeHolder="בחר/י באיזו צורה הסרטון יוצג"
                            />
                            <TextField
                                label="שם"
                                disabled={loading}
                                required
                                value={name}
                                onChange={this.onChangeName}
                                errorMessage={this.state.nameError}
                            />
                            <TextField
                                label="תיאור"
                                disabled={loading}
                                multiline
                                autoAdjustHeight
                                value={description}
                                onChange={this.onChangeDescription}
                            />
                        </FiledsContainer>
                    </PlaylistPropsContainer>
                </ContentContainer>
                <ContentContainer>
                    <DetailsList
                        setKey="playlists"
                        items={this.getItems()}
                        columns={videosColumns}
                        selectionPreservedOnEmptyClick={true}
                        ariaLabelForSelectAllCheckbox="לחץ לבחירת כל הסרטונים"
                        ariaLabelForSelectionColumn="לחץ לבחירה"
                        dragDropEvents={this.getDragDropEvents()}
                        groupProps={{
                            showEmptyGroups: true,
                        }}
                        selectionMode={SelectionMode.multiple}
                        onRenderDetailsHeader={this.onRenderDetailsHeader}
                        listProps={{ renderedWindowsAhead: 1, renderedWindowsBehind: 1 }}
                    />
                </ContentContainer>
                <ContentContainer>
                    {loading ?
                    <Spinner size={SpinnerSize.large} ariaLive="loading" />
                    :
                    <Fragment>
                        <FormButton
                            text="שמור"
                            primary
                            disabled={loading}
                            iconProps={{ iconName: 'Save' }}
                            onClick={() => this.onSubmit()}
                        />
                        <FormButton
                            text="בטל"
                            disabled={loading}
                            iconProps={{ iconName: 'Cancel' }}
                            onClick={this.props.onClose}
                        />
                    </Fragment>}
                </ContentContainer>
                <ContentContainer>
                    {error && <ErrorMsg width={1}>{error}</ErrorMsg>}
                </ContentContainer>

                </Form>
            </FormContainer>
        );
    }
}

export default PlaylistEditForm;