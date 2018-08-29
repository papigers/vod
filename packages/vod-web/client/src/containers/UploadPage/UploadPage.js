import React, { Component } from 'react';
import styled from 'styled-components';
import { createStructuredSelector } from 'reselect';
import { Box } from 'grid-styled';
import io from 'socket.io-client';
import { bindActionCreators } from 'redux';

import createReduxContainer from 'utils/createReduxContainer';

import UploadButton from 'components/UploadButton';
import UploadForm from 'components/UploadForm';

import { makeSelectStepState } from './selectors';

import * as actions from './actions';

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

const CHUNK_SIZE = 1048576;

class UploadPage extends Component {

  componentWillMount() {
    this.uploadSocket = io.connect(`${process.env.REACT_APP_ENCODER_HOSTNAME}/upload`);
    this.uploadSocket.on('setUploadId', this.setUploadId);
    this.uploadSocket.on('uploadProgress', this.updateProgress);
    this.uploadSocket.on('uploadFinish', this.finishUploadStep);
    this.uploadSocket.on('encodingProgress', this.updateEncodingProgress);
    this.uploadSocket.on('encodingFinish', this.finishEncodingStep);
    this.uploadSocket.on('s3Progress', this.updateS3Progress);
    this.uploadSocket.on('s3Finish', this.finishS3Step);
    this.uploadSocket.on('uploadMetadata', this.setUploadMetadata);
    this.uploadSocket.on('screenshots', this.setUploadVideoThumbnails);
    this.reader = new FileReader();
    this.reader.onload = (event) => {
      const name = this.props.upload.file.name;
      this.uploadSocket.emit('uploadStep', {
        id: this.id,
        name,
        data: event.target.result,
      });
    };
    // this.reader.onabort = () => console.log('file reading was aborted');
    // this.reader.onerror = () => console.log('file reading has failed');
  }

  componentWillUnmount() {
    this.uploadSocket.disconnect();
    this.uploadSocket = null;
  }

  setUploadId = ({ id }) => {
    this.id = id;
  }

  updateProgress = (data) => {
    if (data.id !== this.id) {
      return;
    }
    this.props.setUploadProgress(data.progress);
    const chunkIndex = data.chunk * CHUNK_SIZE;
    let chunk;
    const { file } = this.props.upload;
    
    if (file.slice) {
      chunk = file.slice(chunkIndex, chunkIndex + Math.min(CHUNK_SIZE, (file.size - chunkIndex)));
    }
    else if (file.webkitSlice) {
      chunk = file.webkitSlice(chunkIndex, chunkIndex + Math.min(CHUNK_SIZE, (file.size - chunkIndex)));
    }
    else {
      chunk = file.mozSlice(chunkIndex, chunkIndex + Math.min(CHUNK_SIZE, (file.size - chunkIndex)));
    }
    this.reader.readAsBinaryString(chunk);
  }

  updateEncodingProgress = ({ id, progress}) => {
    if (id !== this.id) {
      return;
    }
    this.props.setUploadProgress(progress.percent);
  }

  updateS3Progress = ({id, progress}) => {
    if (id !== this.id) {
      return;
    }
    this.props.setUploadProgress(progress);
  }

  uploadFile = acceptedFiles => {
    acceptedFiles.forEach(file => {
      this.props.setUploadFile(file);
      this.uploadSocket.emit('uploadStart', {
        name: file.name,
        size: file.size,
      });
    });
    this.props.setUploadStep('form_upload');
  }

  finishUploadStep = ({ id }) => {
    if (id !== this.id) {
      return;
    }
    this.props.setUploadStep('form_encode');
  }

  finishEncodingStep = ({ id }) => {
    if (id !== this.id) {
      return;
    }
    this.props.setUploadStep('form_s3');
  }

  finishS3Step = ({ id }) => {
    if (id !== this.id) {
      return;
    }
    this.props.setUploadStep('form_waiting');
  }

  setUploadMetadata = ({ id, metadata }) => {
    if (id !== this.id) {
      return;
    }
    this.props.setUploadMetadata(metadata);
  }

  setUploadVideoThumbnails = ({ id, thumbnails }) => {
    if (id !== this.id) {
      return;
    }
    this.props.setUploadVideoThumbnails(thumbnails);
  }

  render() {
    const { step } = this.props.upload;
    return (
      <Container>
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
            onChangeACL={this.props.setUploadVideoACL}
            onChangePrivacy={this.props.setUploadVideoPrivacy}
            onChangeThumbnail={this.props.selectUploadVideoThumbnail}
          />
        )}
      </Container>
    )
  }
}

const mapStateToProps = createStructuredSelector({
  upload: makeSelectStepState(),
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(actions, dispatch);
};

export default createReduxContainer(UploadPage, mapStateToProps, mapDispatchToProps);
