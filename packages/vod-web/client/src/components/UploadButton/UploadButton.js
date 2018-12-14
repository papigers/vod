import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import Dropzone from 'react-dropzone';

import { CompoundButton } from 'office-ui-fabric-react/lib/Button';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';

import tus from 'tus-js-client';

const StyledDropzone = styled(Dropzone)`
  position: absolute !important;
  width: 100%;
  height: 100%;
  opacity: 0;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: pointer !important;
`;

const StyledUploadButton = styled(CompoundButton)`
  min-height: 200px;
  width: 100%;
  max-width: 350px;
  margin: 0 auto;
  position: relative;
  font-size: 1.8em;
  text-align: center;
  display: block;
  pointer-events: ${({ unclickable }) => unclickable ? 'none' : 'inherit'};

  .ms-Button-icon {
    margin: 0 auto;
    margin-bottom: 8px;
  }
  .ms-Button-flexContainer {
    flex-direction: column;
  }
  .ms-Button-textContainer {
    text-align: inherit;
    margin: 0 auto;
  }
`;

const StyledProgressIndicator = styled(ProgressIndicator)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  display: flex;
  justify-content: center;

  .ms-ProgressIndicator-progressBar {
    background-color: ${({theme}) => theme.palette.bodyBackground};
  }

  .ms-ProgressIndicator-progressTrack {
    background-color: ${({theme}) => theme.palette.themeDark};
  }

  .ms-ProgressIndicator-itemName {
    font-size: 1.1em;
    line-height: 1.1em;
    color: ${({theme}) => theme.palette.bodyBackground};
  }

  .ms-ProgressIndicator-itemDescription {
    font-size: 0.7em;
    line-height: 0.7em;
    margin-top: 0.1em;
    color: ${({theme}) => theme.palette.bodyBackground};
  }
`;

export default class UploadButton extends Component {

  constructor() {
    super();
    this.state = {
      dragging: false,
    };
  }

  uploadFile = acceptedFiles => {
    // this.props.uploadFile(acceptedFiles);
    const file = acceptedFiles[0];
    const upload = new tus.Upload(file, {
      endpoint: `${process.env.REACT_APP_API_HOSTNAME}/api/upload/video/`,
      metadata: {
        name: file.name,
        type: file.type,
      },
      withCredentials: true,
      onError: console.error,
      onProgress: function(bytesUploaded, bytesTotal) {
        var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
        console.log(bytesUploaded, bytesTotal, percentage + "%")
      },
      onSuccess: function() {
        console.log("Download %s from %s", upload.file.name, upload.url)
      }
    });

    upload.start();

    this.setDragging(false);
  }

  setDragging = dragging => this.setState({ dragging })
  
  render() {
    const { file, progress } = this.props;

    const buttonProps = file ? {
      unclickable: true,
    } : {
      iconProps: { iconName: 'Upload' },
      text: 'בחר קובץ להעלאה',
      secondaryText: 'או גרור לכאן',
    };
    return (
      <Fragment>
        <StyledUploadButton checked={this.state.dragging} primary {...buttonProps}>
          {file ? (
            <StyledProgressIndicator label="מעלה..." description={`${Math.round(progress)}%`} barHeight={5} percentComplete={progress / 100} />
          ) : (
            <StyledDropzone
              onDrop={this.uploadFile}
              onDragEnter={() => this.setDragging(true)}
              onDragLeave={() => this.setDragging(false)}
              accept="video/*"
              multiple={false}
            />
          )}
        </StyledUploadButton>
        
      </Fragment>
    );
  }
}
