import React, { Component, Fragment } from 'react';
import { Box } from 'grid-styled';
import { transitions } from 'polished';
import styled from 'styled-components';

import { Pivot, PivotItem, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';
import { Selection } from 'office-ui-fabric-react/lib/Selection';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import { OverflowSet } from 'office-ui-fabric-react/lib/OverflowSet';
import { CommandBarButton } from 'office-ui-fabric-react/lib/Button';
import { ShimmeredDetailsList } from 'office-ui-fabric-react/lib/ShimmeredDetailsList';

import { videosColumns } from './Columns';
import VideoThumbnail from 'components/VideoThumbnail';
import Modal from 'components/Modal';
import EditMetadata from './EditMetadata';
import DeleteForm from './DeleteForm';
import EditPrivacy from './EditPrivacy';

const ContentBox = styled(Box).attrs({
    pr: 30,
    pl: 30,
  })``;

const ActionsBox = styled(Box).attrs({
    pt: 15,
    pb: 15,
  })``;

const TitleBox = ContentBox.extend`
  .ms-Shimmer-shimmerWrapper {
    background: ${({theme}) => `linear-gradient(to left, ${theme.palette.neutralLight} 0%, ${theme.palette.neutralQuaternaryAlt} 50%, ${theme.palette.neutralLight} 100%) 0px 0px / 90% 100% no-repeat ${theme.palette.neutralQuaternaryAlt}`};
  }

  &, .ms-ShimmerGap-root {
    background-color: ${({theme}) => theme.palette.neutralLighterAlt};
    border-color: ${({theme}) => theme.palette.neutralLighterAlt};
  }
  .ms-ShimmerLine-root, .ms-ShimmerCircle-root {
    border-color: ${({theme}) => theme.palette.neutralLighterAlt};
    svg {
      fill: ${({theme}) => theme.palette.neutralLighterAlt};
    }
  }
`;

const CategoryHeader = styled.h2`
  display: inline-block;
`;

class Studio extends Component {
    constructor() {
        super();
        this.state = {
            items: [],
            groups: [],
            activeTab: 'videos',
            isDataLoaded : false,
            selection: new Selection({ onSelectionChanged: this.onSelectionChanged }),
            selectionDetails : [],
            modalIsOpen: false,
            editType: ''
        };
      }

    static getDerivedStateFromProps(props, state) {
        const {videoList} = props;
        if (!state.isDataLoaded || !state.groups.length || (state.groups.length !== Object.keys(videoList).length)) {
            const items = [];
            const groups = [];
            let startIndex = 0;
            const options = {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit',minute: '2-digit',second: '2-digit',};

            Object.keys(videoList).forEach(function(key) {
                const { videos, channelName} = videoList[key];
                
                videos.forEach(video => {
                    items.push({
                        thumbnail: <VideoThumbnail src={`${process.env.REACT_APP_STREAMER_HOSTNAME}/${video.id}/thumbnail.png`} width={180} height={101}/>,
                        id: video.id,
                        name: video.name,
                        description: video.description,
                        privacy: video.privacy,
                        privacyDisplay: video.privacy === 'PUBLIC'? 'ציבורי' : 'פרטי',
                        acls: video.acls,
                        channelName: `${video.channel.name} (${video.channel.id})`,
                        channelId: video.channel.id,
                        viewsCount: video.viewsCount,
                        likesCount: video.likesCount,
                        commentsCount: video.commentsCount,
                        createdAt: new Date(video.createdAt).toLocaleDateString('hebrew',options),
                });
                });
                groups.push({
                    key: key,
                    name: channelName,
                    startIndex: startIndex,
                    count: videos.length
                });
                startIndex += videos.length;
            });
            
            if (groups.length && items.length) {
                return {
                    groups: groups,
                    items: items,
                    isDataLoaded: true,
                }
            }
            return {
                groups: groups,
                items: items,
            }
        }
        return null;
    }

    onLinkClick = (item)  => {
        this.setState({
            activeTab: item.props.itemKey
        });
      }
      
    onSelectionChanged = () => {
        console.log(this.state.selection.getSelection());
        this.setState({
            selectionDetails: this.state.selection.getSelection()
          });
      }

    onMenuClick = (key)  => {
        this.setState({
            editType: key,
            modalIsOpen: !this.state.modalIsOpen
        });
      }

    changeModalState = ()  => {
        this.setState({
            modalIsOpen: !this.state.modalIsOpen
        });
      }

    renderModal(){
          const {editType, selectionDetails} = this.state;
          const {onMetadataEdit, onVideoShare, onDelete, onTagsEdit} = this.props;
          switch (editType) {
            case 'delete':
                return <DeleteForm
                            videos={selectionDetails}
                            onClose={this.changeModalState}
                            onSubmit={onDelete}
                            />
            case 'share':
                return <EditPrivacy
                            video={selectionDetails[0]}
                            onClose={this.changeModalState}
                            onSubmit={onVideoShare}
                            />
            case 'thumbnail':
                return <p>thumbnail</p>
            default:
                  return <EditMetadata
                            videos={selectionDetails}
                            editType={editType}
                            onClose={this.changeModalState}
                            onMetadataEdit={onMetadataEdit}
                            onTagsEdit={onTagsEdit}
                            />
          }
      }

    renderTab() {
        const {groups, items, activeTab , selection, selectionDetails,isDataLoaded} = this.state;

        switch (activeTab) {
          case 'videos':
            selection.setItems(this.state.items, false)
            return (
                <Box>
                    {selectionDetails.length ? 
                        <ActionsBox>
                        <OverflowSet
                            className="ms-fadeIn500"
                            items={[
                                {
                                    key: 'edit',
                                    name: 'ערוך',
                                    icon: 'Edit',
                                    subMenuProps: {
                                        items: [
                                        {
                                            key: 'name',
                                            name: 'שם',
                                            onClick: () => {
                                                this.onMenuClick('name');
                                              }
                                        },{
                                            key: 'description',
                                            name: 'תיאור',
                                            onClick: () => {
                                                this.onMenuClick('description');
                                              }
                                        },{
                                            key: 'tags',
                                            name: 'תגיות',
                                            onClick: () => {
                                                this.onMenuClick('tags');
                                              }
                                        },{
                                            key: 'thumbnail',
                                            name: 'תמונה',
                                            onClick: () => {
                                                this.onMenuClick('thumbnail');
                                              }
                                        }
                                        ]
                                      }
                                },{
                                    key: 'share',
                                    name: 'שתף',
                                    icon: 'Share',
                                    onClick: () => {
                                        this.onMenuClick('share');
                                      }
                                },{
                                    key: 'delete',
                                    name: 'מחק',
                                    icon: 'Delete',
                                    onClick: () => {
                                        this.onMenuClick('delete');
                                      }
                                }
                            ]}
                            onRenderItem={(item) => {
                                if (item.onRender) {
                                    return item.onRender(item);
                                }
                                if (selectionDetails.length < 2 || item.key !== 'share') {
                                    return <CommandBarButton split={true} style={{ height: '35px' }} iconProps={{ iconName: item.icon }} menuProps={item.subMenuProps} text={item.name} onClick={item.onClick}/>;
                                }
                            }}
                        /></ActionsBox> : null}
                    <MarqueeSelection selection={selection}>
                        <ShimmeredDetailsList
                            setKey="items"
                            items={items}
                            groups={groups}
                            columns={videosColumns}
                            selection={selection}
                            selectionPreservedOnEmptyClick={true}
                            ariaLabelForSelectAllCheckbox="Toggle selection for all items"
                            ariaLabelForSelectionColumn="Toggle selection"
                            groupProps={{
                                showEmptyGroups: true
                            }}
                            enableShimmer={!isDataLoaded}
                            listProps={{ renderedWindowsAhead: 0, renderedWindowsBehind: 0 }}
                        />
                    </MarqueeSelection>
                </Box>
            );
          case 'playlists':
            return (
              <span>playlists</span>
            );
          case 'analytics':
            return (
              <span>analytics</span>
            );
          default:
              return (
                <span>404</span>
              );
        }
      }

    render() {
        const {modalIsOpen} = this.state;
        return (
            <Fragment>
                <TitleBox>
                    <CategoryHeader>{'סטודיו'}</CategoryHeader>
                    <Pivot linkSize={PivotLinkSize.large} headersOnly onLinkClick={this.onLinkClick}>
                        <PivotItem itemIcon="MSNVideos" linkText="סרטונים" itemKey='videos' />
                        <PivotItem itemIcon='Stack' linkText="פלייליסטים" itemKey='playlists' />
                        <PivotItem itemIcon = 'BIDashboard' linkText="אנליטיקות" itemKey="analytics" />
                    </Pivot>
                </TitleBox>
                <ContentBox>
                    {this.renderTab()}
                </ContentBox>
                <Modal
                isOpen= {modalIsOpen}
                title= "עריכת סרטון"
                onDismiss= {this.changeModalState}
                >
                    {this.renderModal()}
                </Modal>
            </Fragment>

        );
    }
}

export default Studio;