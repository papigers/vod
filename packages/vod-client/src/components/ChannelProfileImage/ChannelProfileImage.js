import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { transparentize } from 'polished';
import { Box, Flex } from 'grid-styled';

import { PersonaSize, sizeToPixels } from 'office-ui-fabric-react/lib/Persona';
import { DefaultButton, IconButton } from 'office-ui-fabric-react/lib/Button';
import { Image as FabricImage, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { TooltipHost, TooltipDelay } from 'office-ui-fabric-react/lib/Tooltip';
import Editor from 'react-avatar-editor';

const UploadButton = styled(IconButton)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  background-color: ${({ theme }) => transparentize(0.7, theme.palette.bodyBackground)};
  border-radius: 50%;
  opacity: 0;
  cursor: pointer;
  transition: opacity 300ms ease-in-out, background-color 300ms;

  i {
    font-size: 20px;
  }

  &:hover {
    background-color: ${({ theme }) => transparentize(0.55, theme.palette.bodyBackground)};
  }

  input[type='file'] {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
    width: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

const Container = styled.div`
  width: ${({ size }) => `${sizeToPixels[size]}px`};
  height: ${({ size }) => `${sizeToPixels[size]}px`};
  border-radius: 50%;
  overflow: hidden;
  position: relative;

  &:hover ${UploadButton} {
    opacity: 1;
  }

  ${({ editing, theme }) =>
    editing
      ? css`
          box-shadow: 0 0 0 100vmax ${transparentize(0.55, theme.palette.bodyBackground)};
          z-index: 100;
        `
      : css([])}
`;

class ChannelProfileImage extends Component {
  static defaultProps = {
    size: PersonaSize.size48,
  };

  constructor(props) {
    super();
    this.state = {
      imageWidth: 0,
      imageHeight: 0,
      scale: (props.position && props.position.scale) || 1,
      position: {
        x: (props.position && props.position.x) || 0,
        y: (props.position && props.position.y) || 0,
      },
      editing: false,
    };
    this.inputRef = React.createRef();
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.getImageSize();
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.src !== prevProps.src) {
      const imageChanged = this.state.croppedImage !== this.props.src;
      this.setState(
        {
          editing: false,
          uploaded: !imageChanged ? this.state.uploaded : null,
        },
        imageChanged ? this.getImageSize : null,
      );
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResizeListener);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  onZoomHandler = e => {
    if (this.state.editing) {
      e.preventDefault();
      this.setState({
        scale: Math.max(1, (e.deltaY <= 0 ? 1 : -1) * 0.1 + this.state.scale),
      });
    }
  };

  getImageSize() {
    if (this.props.src) {
      const img = new Image();
      img.onload = () => {
        this.setState({
          imageWidth: img.width,
          imageHeight: img.height,
          scale: Math.max(this.state.scale, 1),
        });
      };
      img.src = this.props.src;
    }
  }

  toggleEditing = () => this.setState({ editing: !this.state.editing });

  onFileChange = (...args) => {
    if (this.props.onFileChange) {
      this.props.onFileChange(...args);
    }
  };

  onUploadClick = e => {
    if (this.inputRef && this.inputRef.current) {
      this.inputRef.current.click();
    }
  };

  onPositionChange = position => this.setState({ position });

  onFileChange = ({ target: input }) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e =>
        this.setState({
          uploaded: e.target.result,
          editing: true,
        });
      reader.readAsDataURL(input.files[0]);
    }
  };

  onSaveFile = () => {
    const croppedImage = this.canvasRef.current.getImage().toDataURL();
    this.setState({ editing: false, croppedImage });
    if (this.props.onFileChange) {
      this.props.onFileChange(croppedImage);
    }
  };

  onCancelEdit = () => {
    this.setState({ editing: false, uploaded: null });
  };

  renderEditTooltip = () => {
    const { editable, src } = this.props;
    const { editing, uploaded } = this.state;

    return (
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        {uploaded ? (
          <Box my={1}>
            <DefaultButton
              text={editing ? 'שמור שינויים' : 'ערוך תמונה'}
              iconProps={{ iconName: editing ? 'Accept' : 'Move' }}
              primary={editing}
              onClick={editing ? this.onSaveFile : this.toggleEditing}
            />
          </Box>
        ) : null}
        {uploaded && editing ? (
          <Box my={1}>
            <DefaultButton
              text="ביטול"
              iconProps={{ iconName: 'Cancel' }}
              onClick={this.onCancelEdit}
            />
          </Box>
        ) : null}
      </Flex>
    );
  };

  render() {
    const { src, size, editable } = this.props;
    const { editing, uploaded, scale, position } = this.state;
    return (
      <Container editing={editing} onWheel={this.onZoomHandler} size={size}>
        {!editing && editable ? (
          <UploadButton primary iconProps={{ iconName: 'Upload' }}>
            <input ref={this.inputRef} type="file" accept="image/*" onChange={this.onFileChange} />
          </UploadButton>
        ) : null}
        {!editing ? (
          <FabricImage
            imageFit={ImageFit.centerCover}
            src={
              uploaded && this.canvasRef.current
                ? this.canvasRef.current.getImage().toDataURL()
                : src
            }
            maximizeFrame
          />
        ) : (
          <TooltipHost
            tooltipProps={{
              onRenderContent: this.renderEditTooltip,
            }}
            calloutProps={{
              isBeakVisible: true,
              gapSpace: 34,
            }}
            delay={TooltipDelay.zero}
            closeDelay={500}
          >
            <Editor
              ref={this.canvasRef}
              image={uploaded}
              border={0}
              width={sizeToPixels[size]}
              height={sizeToPixels[size]}
              scale={scale}
              position={position}
              onPositionChange={this.onPositionChange}
            />
          </TooltipHost>
        )}
        {/* {editable ? (
          <TooltipHost
            tooltipProps={{
              onRenderContent: this.renderEditTooltip,
            }}
            calloutProps={{
              isBeakVisible: false,
              gapSpace: -16,
            }}
            delay={TooltipDelay.zero}
            closeDelay={300}
          >
            {img}
          </TooltipHost>
        ) : (
          img
        )} */}
      </Container>
    );
  }
}

export default ChannelProfileImage;
