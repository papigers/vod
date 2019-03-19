import React, { Component, Fragment } from 'react';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components';

import { List } from 'office-ui-fabric-react/lib/List';
import { Callout } from 'office-ui-fabric-react/lib/Callout';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';

import createReduxContainer from 'utils/createReduxContainer';
import { makeSelectUser } from 'containers/ChannelPage/selectors';
import VideoStateDropdown from 'components/VideoStateDropdown';

import axios from 'utils/axios';


const StyledCallout = styled(Callout)`
  .ms-List{
    padding: 16px 24px 8px;
    
    .ms-List-cell{
      margin-bottom: 8px;
    }
  }
  .ms-Spinner{
    margin: 4px 0;
  }
  form{
    width: 100%;
    .ms-Button{
      margin: 10px 0;
    }
  }
`;

class SaveToPlaylistsCallout extends Component {
  constructor(props) {
    super(props);
    this.state={
      managedPlaylists: [],
      loadingManagedPlaylists: true,
      managedPlaylistsError: null,
      selectedPlaylists: [],
      newPlaylistClicked: false,
      newPlaylistName: null,
      newPlaylistDescription: null, 
      newPlaylistState: null,
      newPlaylistChannel: null,
      managedChannels: [],
    };
  }

  componentDidMount() {
    this.fetchManagedPlaylists();
  }

  fetchManagedPlaylists = () => {
    const { video } = this.props;

    axios
    .get(`/playlists/managed`)
    .then((managedPlaylists) => {
      axios
      .get(`/videos/video/${video && video.id}/playlists`)
      .then(({ data }) => {
        this.setState({
          selectedPlaylists: data || [],
          managedPlaylists: managedPlaylists.data,
          loadingManagedPlaylists: false,
          managedPlaylistsError: null,
        });
      }).catch(err => {
        // TODO: do something
        this.setState({
          selectedPlaylists: [],
          loadingManagedPlaylists: false,
          managedPlaylistsError: err.response && err.response.message,
        });
      });
    }).catch(err => {
      // TODO: do something
      this.setState({
        managedPlaylists: [],
        loadingManagedPlaylists: false,
        managedPlaylistsError: err.response && err.response.message,
      });
    });
  }

  fetchManagedChannels = () => {
    axios
    .get(`/channels/managed`)
    .then(( channels ) => {
      const managedChannels = channels.data.map(channel => {
        return { key: channel.id , text: channel.name , title: `${channel.name}(${channel.id})` }
      });
      this.setState({
        managedChannels: managedChannels,
      });
    }).catch(err => {
      // TODO: do something
      this.setState({
        managedPlaylists: [],
        loadingManagedPlaylists: false,
        managedPlaylistsError: err.response && err.response.message,
      });
    });
  }

  onAddToPlaylistsChecked = (playlistId, checked) => {
    const { video } = this.props;
    
    checked === true ? axios.put(`playlists/${playlistId}/add/${video && video.id}`)
      : axios.put(`playlists/${playlistId}/remove/${video && video.id}`);
  };

  onChangeName = ({ target }) => this.setState({ newPlaylistName: target.value });
  onChangeDescription = ({ target }) => this.setState({ newPlaylistDescription: target.value });
  onChangeState = (e, { key: state }) => {
    this.setState({ newPlaylistState: state });
  };
  onChangeChannel = (e, { key: channel }) => {
    this.setState({ newPlaylistChannel: channel });
  };

  onSubmit = () => {
    axios.post(`/playlists/`, {
      name: this.state.newPlaylistName,
      description: this.state.newPlaylistDescription,
      state: this.state.newPlaylistState,
      channelId: this.state.newPlaylistChannel,
      videos: [this.props.video]
    })
    .then(() => this.props.onDismiss())
    .catch((err)=>console.log(err));
  }

  render() {
    const {
      managedPlaylists,
      loadingManagedPlaylists,
      selectedPlaylists,
      newPlaylistClicked,
      managedChannels
    } = this.state;
    const { StyledButton, addToPlaylistsRef, onDismiss } = this.props;
    
    return (
      <StyledCallout
        role="alertdialog"
        gapSpace={0}
        target={addToPlaylistsRef.current}
        setInitialFocus={true}
        onDismiss={onDismiss}
        calloutWidth={300}
        >
        <Fragment>
          { loadingManagedPlaylists ? 
            <Spinner size={SpinnerSize.medium} label="טוען..." labelPosition="right" />
            : <List items={managedPlaylists} data-is-scrollable="true" onRenderCell={ (item) =>{
                return (
                  <Checkbox
                    disabled={false}
                    label={`${item.name} (${item.channel.name})`}
                    defaultChecked={!!selectedPlaylists.find(option => option.id === item.id)}
                    onChange={({ target }) => this.onAddToPlaylistsChecked(item.id, target.checked)}
                    /> );
              }}/>
            }
            <div style={{ padding: '4px 24px', display: 'flex', justifyContent: 'center', position: 'relative', borderTop: '1px solid rgba(0, 0, 0, 0.2)'}}>
              { !newPlaylistClicked ?
                <StyledButton
                  iconProps={{ iconName: 'Add' }}
                  text={'הוסף לפלייליסט חדש'}
                  onClick={() => {
                    this.setState({
                      newPlaylistClicked: true,
                    });
                    this.fetchManagedChannels();
                  }}
                  />
                : <form onSubmit={this.onSubmit}>
                    <TextField
                      label="שם"
                      placeholder="לדוגמא: הדרכות לניהול ידע"
                      required={true}
                      onChange={this.onChangeName}
                    />
                    <TextField
                      label="תיאור"
                      placeholder="לדוגמא: הדרכות לדרכי ניהול ידע יעילות"
                      onChange={this.onChangeDescription}
                    />
                    <VideoStateDropdown
                      required
                      label="מצב פרסום"
                      onChange={this.onChangeState}
                      placeHolder="בחר/י באיזו צורה הפלייליסט יוצג"
                    />
                    <Dropdown
                      required
                      label="בחר ערוץ"
                      options={managedChannels}
                      onChange={this.onChangeChannel}
                      placeHolder="בחר/י לאיזה ערוץ הפלייליסט ישתייך"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-around'}}>
                      <DefaultButton
                        text='שמור'
                        iconProps={{ iconName: 'Save' }}
                        primary
                        onClick={this.onSubmit}
                      />
                      <DefaultButton
                        text='בטל'
                        iconProps={{ iconName: 'Cancel' }}
                        onClick={() => {
                          this.setState({
                            newPlaylistClicked: false,
                            newPlaylistName: null,
                            newPlaylistDescription: null, 
                            newPlaylistState: null,
                            newPlaylistChannel: null,
                          });
                        }}
                      />
                    </div>
                  </form>
                }
            </div>
        </Fragment>
      </StyledCallout>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(SaveToPlaylistsCallout, mapStateToProps);