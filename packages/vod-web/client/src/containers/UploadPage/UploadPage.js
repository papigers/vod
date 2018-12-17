import React, { Component } from 'react';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { Box } from 'grid-styled';
import io from 'socket.io-client';
import { bindActionCreators } from 'redux';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import tus from 'tus-js-client';

import createReduxContainer from 'utils/createReduxContainer';

import UploadButton from 'components/UploadButton';
import UploadForm from 'components/UploadForm';
import axios from 'utils/axios';

import { makeSelectStepState } from './selectors';
import { makeSelectUser } from '../ChannelPage/selectors';

import * as actions from './actions';
import { push } from 'react-router-redux';

const Container = styled(Box).attrs({
  mx: 'auto',
  mt: 35,
  py: 30,
  px: 20,
  width: [1, 1, 2/3, 0.55],
})`
  background-color: ${({theme}) => theme.palette.neutralLighterAlt};
  border: 2px solid;
  border-color: ${({theme}) => theme.palette.neutralLight};
`;

const ErrorBox = styled(MessageBar)`
  width: calc(100% + 40px);
  margin-top: -30px;
  margin-right: -20px;
  margin-bottom: 30px;
`;

class UploadPage extends Component {

  componentWillMount() {
    // this.reader.onabort = () => console.log('file reading was aborted');
    // this.reader.onerror = () => console.log('file reading has failed');
  }

  componentWillUnmount() {
    // if (this.uploadSocket) {
    //   this.uploadSocket.disconnect();
    // }
    // this.uploadSocket = null;
  }

  initSocket = () => {
    // this.uploadSocket = io.connect(`${process.env.REACT_APP_ENCODER_HOSTNAME}/upload`);
    // this.uploadSocket.on('setUploadId', this.setUploadId);
    // this.uploadSocket.on('uploadProgress', this.updateProgress);
    // this.uploadSocket.on('uploadFinish', this.finishUploadStep);
    // this.uploadSocket.on('encodingProgress', this.updateEncodingProgress);
    // this.uploadSocket.on('encodingFinish', this.finishEncodingStep);
    // this.uploadSocket.on('s3Progress', this.updateS3Progress);
    // this.uploadSocket.on('s3Finish', this.finishS3Step);
    // this.uploadSocket.on('uploadMetadata', this.setUploadMetadata);
    // this.uploadSocket.on('screenshots', this.setUploadVideoThumbnails);
    // this.uploadSocket.on('error', this.props.setUploadError);
    // this.uploadSocket.on('disconnect', this.onDisconnect);

    
    // this.reader = new FileReader();
    // this.reader.onload = (event) => {
    //   const name = this.props.upload.file.name;
    //   this.uploadSocket.emit('uploadStep', {
    //     id: this.id,
    //     name,
    //     data: event.target.result,
    //   });
    // };
  }

  onDisconnect = () => {
    // const { step } = this.props.upload;
    // if (step !== 'form_waiting') {
    //   this.props.setUploadError('אין תקשורת');
    // }
  }

  setUploadId = ({ id }) => {
    // this.id = id;
  }

  updateProgress = (data) => {
    // if (data.id !== this.id) {
    //   return;
    // }
    // this.props.setUploadProgress(data.progress);
    // const chunkIndex = data.chunk * CHUNK_SIZE;
    // let chunk;
    // const { file } = this.props.upload;
    
    // if (file.slice) {
    //   chunk = file.slice(chunkIndex, chunkIndex + Math.min(CHUNK_SIZE, (file.size - chunkIndex)));
    // }
    // else if (file.webkitSlice) {
    //   chunk = file.webkitSlice(chunkIndex, chunkIndex + Math.min(CHUNK_SIZE, (file.size - chunkIndex)));
    // }
    // else {
    //   chunk = file.mozSlice(chunkIndex, chunkIndex + Math.min(CHUNK_SIZE, (file.size - chunkIndex)));
    // }
    // this.reader.readAsBinaryString(chunk);
  }

  updateEncodingProgress = ({ id, progress}) => {
    // if (id !== this.id) {
    //   return;
    // }
    // this.props.setUploadProgress(progress.percent);
  }

  updateS3Progress = ({id, progress}) => {
    // if (id !== this.id) {
    //   return;
    // }
    // this.props.setUploadProgress(progress);
  }

  uploadFile = acceptedFiles => {
    const file = acceptedFiles[0];
    const upload = new tus.Upload(file, {
      endpoint: `${process.env.REACT_APP_API_HOSTNAME}/api/upload/video/`,
      metadata: {
        name: file.name,
        type: file.type,
      },
      withCredentials: true,
      onError: e => {
        console.error(e);
        this.props.setUploadError('שגיאה בהעלאת הסרטון');
      },
      onProgress: (uploaded, total) => {
        console.log(uploaded / total * 100);
        this.props.setUploadProgress(uploaded / total * 100);
      },
      onSuccess: () => this.startEncodingStep(upload),
    });

    upload.start();
  }

  startEncodingStep = (upload) => {
    const url = localStorage.getItem(upload._fingerprint);
    const idRegex = new RegExp(`${process.env.REACT_APP_API_HOSTNAME}/api/upload/video/(.*)`);
    const id = idRegex.exec(url);
    if (id && id[1]) {
      this.id = id[1];
      this.props.setUploadStep('form_encode');
      axios.get(`/videos/${this.id}/thumbnails?count=4`)
      .then(({ data }) => {
        this.props.setUploadVideoThumbnails(data);
      });

      this.progressSocket = io.connect(`${process.env.REACT_APP_API_HOSTNAME}/upload?id=${this.id}`);
      this.progressSocket.on('progress', this.updateProgress);
    }
    localStorage.removeItem(upload._fingerprint);
  }

  updateProgress = (data) => {
    if (data.id === this.id) {
      this.props.setUploadProgress(data.progress);
    }
  }

  setUploadMetadata = ({ id, metadata }) => {
    // if (id !== this.id) {
    //   return;
    // }
    // this.props.setUploadMetadata(metadata);
  }

  setUploadVideoThumbnails = ({ id, thumbnails }) => {
    // if (id !== this.id) {
    //   return;
    // }
    // this.props.setUploadVideoThumbnails(thumbnails);
  }

  onSubmit = () => {
    // const {
    //   name,
    //   privacy,
    //   description,
    //   acl,
    //   channel,
    //   tags,
    //   selectedThumbnail,
    // } = this.props.upload.video;
    // this.props.setUploadStep('form_submit');
    // this.uploadSocket.emit('uploadScreenshot', selectedThumbnail);
    // axios.put(`/videos/publish/${this.id}`, {
    //   name,
    //   privacy,
    //   description,
    //   channel,
    //   acl,
    //   tags,
    // }).then(({ data }) => {
    //   if (!data.error) {
    //     return this.props.push(`/watch?v=${this.id}`);
    //   }
    //   this.props.setUploadError('לא ניתן היה לשמור את הסרטון');
    // }).catch((err) => {
    //   console.error(err);
    //   this.props.setUploadError('לא ניתן היה לשמור את הסרטון');
    // });
  }

  render() {
    const { step, error } = this.props.upload;
    return (
      <Container>
        {error ? (
          <ErrorBox
            messageBarType={MessageBarType.error}
            onDismiss={() => this.props.setUploadError(null)}
            dismissButtonAriaLabel="סגור"
          >
            ההעלאה נכשלה: {error}
          </ErrorBox>
        ) : null}
        {step === 'upload' ? (
          <UploadButton
            progress={this.props.upload.progress}
            file={this.props.upload.file}
            uploadFile={this.uploadFile}
          />
        ) : (
          <UploadForm
            step={step}
            progress={this.props.upload.progress}
            metadata={this.props.upload.metadata}
            video={this.props.upload.video}
            onChangeName={this.props.setUploadVideoName}
            onChangeDescription={this.props.setUploadVideoDescription}
            onChangeChannel={this.props.setUploadVideoChannel}
            onChangeACL={this.props.setUploadVideoACL}
            onChangePrivacy={this.props.setUploadVideoPrivacy}
            onChangeThumbnail={this.props.selectUploadVideoThumbnail}
            onChangeTags={this.props.setUploadVideoTags}
            setUploadError={this.props.setUploadError}
            onSubmit={this.onSubmit}
            user={this.props.user}
          />
        )}
      </Container>
    )
  }
}

const mapStateToProps = createStructuredSelector({
  upload: makeSelectStepState(),
  user: makeSelectUser(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    ...actions,
    push,
  }, dispatch);
};

export default createReduxContainer(UploadPage, mapStateToProps, mapDispatchToProps);
