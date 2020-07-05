import React, { Component } from 'react';
import styled from 'styled-components';
import Dropzone from 'react-dropzone';
import tus from 'tus-js-client';
import Helmet from 'react-helmet';

import { CompoundButton } from 'office-ui-fabric-react/lib/Button';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

const Container = styled.div`
  padding-top: 4em;
`;

const ErrorBox = styled(MessageBar)`
  width: 350px;
  margin: 1em auto;
`;

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
  pointer-events: ${({ unclickable }) => (unclickable ? 'none' : 'inherit')};

  &,
  &:hover,
  .ms-Button-description,
  &:hover .ms-Button-description {
    color: #fff;
  }

  &:hover {
    border: 2px solid #dadada;
  }

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
  justify-content: center;

  .ms-ProgressIndicator-progressBar {
    background-color: ${({ theme }) => theme.palette.bodyBackground};
  }

  .ms-ProgressIndicator-progressTrack {
    background-color: ${({ theme }) => theme.palette.themeDark};
  }

  .ms-ProgressIndicator-itemName {
    font-size: 1.1em;
    line-height: 1.1em;
    color: ${({ theme }) => theme.palette.bodyBackground};
  }

  .ms-ProgressIndicator-itemDescription {
    font-size: 0.7em;
    line-height: 0.7em;
    margin-top: 0.1em;
    color: ${({ theme }) => theme.palette.bodyBackground};
  }
`;

export default class UploadButton extends Component {
  constructor() {
    super();
    this.state = {
      dragging: false,
      progress: 0,
      error: null,
    };
  }

  setUploadError = error => this.setState({ error, progress: 0 });

  uploadFile = acceptedFiles => {
    this.setDragging(false);
    this.setUploadError(null);
    const file = acceptedFiles[0];
    const upload = new tus.Upload(file, {
      endpoint: `${window._env_.REACT_APP_API_HOSTNAME}/api/upload/video/`,
      metadata: {
        name: file.name,
        type: file.type,
      },
      withCredentials: true,
      onError: e => {
        console.error(e);
        this.setUploadError('שגיאה בהעלאת הסרטון');
      },
      onProgress: (uploaded, total) => {
        this.setState({ progress: (uploaded / total) * 100 });
      },
      onSuccess: () => this.onUploadComplete(upload),
    });

    upload.start();
  };

  onUploadComplete = upload => {
    const url = localStorage.getItem(upload._fingerprint);
    localStorage.removeItem(upload._fingerprint);
    const idRegex = new RegExp(`${window._env_.REACT_APP_API_HOSTNAME}/api/upload/video/(.*)`);
    const id = idRegex.exec(url);
    if (id && id[1]) {
      this.props.history.push(`/upload/edit?v=${id[1]}`);
    }
  };

  setDragging = dragging => this.setState({ dragging });

  render() {
    const { error, progress } = this.state;
    const isUploading = progress > 0;

    const buttonProps = isUploading
      ? {
          unclickable: true,
        }
      : {
          iconProps: { iconName: 'MediaAdd' },
          text: 'בחר קובץ להעלאה',
          secondaryText: 'או גרור לכאן',
        };
    return (
      <Container>
        <Helmet>
          <title>VOD - העלאת סרטון</title>
        </Helmet>
        {error ? (
          <ErrorBox
            messageBarType={MessageBarType.error}
            onDismiss={() => this.setUploadError(null)}
            dismissButtonAriaLabel="סגור"
          >
            ההעלאה נכשלה: {error}
          </ErrorBox>
        ) : null}
        <StyledUploadButton checked={this.state.dragging} primary {...buttonProps}>
          {isUploading ? (
            <StyledProgressIndicator
              label="מעלה..."
              description={`${Math.round(progress)}%`}
              barHeight={5}
              percentComplete={progress / 100}
            />
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
      </Container>
    );
  }
}
