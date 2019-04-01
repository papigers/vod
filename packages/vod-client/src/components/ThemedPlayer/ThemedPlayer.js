import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { darken, rgba, lighten } from 'polished';
import videojs from 'video.js';

import { withPreload } from 'containers/VideoPreloader';

const StyledVideoContainer = styled.div`
  --fg-color: #fff;
  --bg-color: ${({ theme }) => theme.palette.themePrimary};

  .vjs-custom-waiting .vjs-loading-spinner {
    display: block;
    visibility: visible;
  }

  .video-js.vjs-custom-waiting .vjs-loading-spinner::before,
  .video-js.vjs-custom-waiting .vjs-loading-spinner::after {
    animation: vjs-spinner-spin 1.1s cubic-bezier(0.6, 0.2, 0, 0.8) infinite,
      vjs-spinner-fade 1.1s linear infinite;
  }

  .video-js {
    /* The base font size controls the size of everything, not just text.
      All dimensions use em-based sizes so that the scale along with the font size.
      Try increasing it to 15px and see what happens. */
    font-size: 12px;

    /* The main font color changes the ICON COLORS as well as the text */
    color: var(--fg-color);

    /* The slider bar color is used for the progress bar and the volume bar
      (the first two can be removed after a fix that's coming) */
    .vjs-volume-level,
    .vjs-play-progress,
    .vjs-slider-bar {
      background: var(--bg-color);
    }
  }

  /* The "Big Play Button" is the play button that shows before the video plays.
    To center it set the align values to center and middle. The typical location
    of the button is the center, but there is trend towards moving it to a corner
    where it gets out of the way of valuable content in the poster image. */
  .video-js .vjs-big-play-button {
    /* The font size is what makes the big play button...big.
      All width/height values use ems, which are a multiple of the font size.
      If the .video-js font-size is 10px, then 3em equals 30px. */
    font-size: 3em;

    /* We're using SCSS vars here because the values are used in multiple places.
      Now that font size is set, the following em values will be a multiple of the
      new font size. If the font-size is 3em (30px), then setting any of
      the following values to 3em would equal 30px. 3 * font-size. */

    /* 1.5em = 45px default */
    --big-play-width: 3em;
    --big-play-height: 2em;

    line-height: var(--big-play-height);
    height: var(--big-play-height);
    width: var(--big-play-width);
    background-color: var(--bg-color) !important;

    /* 0.06666em = 2px default */

    /* border: 0.06666em solid $primary-foreground-color; */
    border: none;

    /* 0.3em = 9px default */
    border-radius: 0.4em;

    /* Align center */
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  /* The default color of control backgrounds is mostly black but with a little
    bit of blue so it can still be seen on all-black video frames, which are common. */
  .video-js .vjs-control-bar {
    z-index: 2;
    background-color: transparent;
  }

  .video-js .vjs-menu-button .vjs-menu-content {
    background-color: rgba(0, 0, 0, 0.75);
    border-radius: 0.15em;
  }

  .video-js .vjs-menu sup {
    color: var(--bg-color);
    font-weight: 600;
    position: absolute;
    top: 1em;
    right: 1.8em;
  }

  .video-js .vjs-menu li.vjs-selected,
  .vjs-menu li.vjs-selected:focus,
  .vjs-menu li.vjs-selected:hover {
    &,
    & sup {
      color: var(--fg-color) !important;
    }

    background-color: var(--bg-color);
  }

  /* Make a slightly lighter version of the main background
  for the slider background. */
  --slider-bg: ${darken(0.15, '#fff')};

  /* Slider - used for Volume bar and Progress bar */
  .video-js .vjs-slider {
    background-color: ${darken(0.15, '#fff')};
    background-color: ${rgba(darken(0.15, '#fff'), 0.4)};
  }

  /* The main progress bar also has a bar that shows how much has been loaded. */
  .video-js .vjs-load-progress {
    /* For IE8 we'll lighten the color */
    background: ${lighten(0.25, darken(0.15, '#fff'))};

    /* Otherwise we'll rely on stacked opacities */
    background: ${rgba(darken(0.15, '#fff'), 0.5)};
  }

  /* The load progress bar also has internal divs that represent
    smaller disconnected loaded time ranges */
  .video-js .vjs-load-progress div {
    /* For IE8 we'll lighten the color */
    background: ${lighten(0.6, darken(0.15, '#fff'))};

    /* Otherwise we'll rely on stacked opacities */
    background: ${rgba(darken(0.15, '#fff'), 0.75)};
  }

  .vjs-menu li.vjs-menu-item:hover,
  .video-js .vjs-menu li.vjs-menu-item:focus {
    &:not(.vjs-selected) {
      background-color: rgba(255, 255, 255, 0.25);
    }
  }

  .video-js .vjs-progress-control {
    bottom: 58%;
    position: absolute;
    width: 100%;
  }

  .video-js::after {
    position: absolute;
    left: 0;
    right: 0;
    top: 70%;
    bottom: 0;
    pointer-events: none;
    content: '';
    display: block;
    opacity: 1;
    transition: opacity 250ms ease-in-out;
    background: linear-gradient(transparent, transparent 60%, rgba(0, 0, 0, 0.8));
  }

  .video-js.vjs-has-started.vjs-user-inactive.vjs-playing::after {
    opacity: 0;
  }

  .video-js .vjs-time-control {
    display: block;
    font-size: 1.2em;
    line-height: 2.6em;
    padding: 0;
    min-width: auto;
  }

  .video-js .vjs-current-time {
    padding-left: 0.4em;
  }

  .video-js .vjs-time-divider {
    padding: 0 0.4em;
  }

  .video-js .vjs-remaining-time {
    display: block;
    flex-grow: 1;
    visibility: hidden;
  }

  .video-js .vjs-play-progress .vjs-time-tooltip {
    display: none !important;
  }

  .video-js .vjs-brand-container {
    width: 4em;
    height: 3em;

    a {
      pointer-events: none;
    }

    img {
      width: 3em;
      height: 3em;
      position: relative;
      left: 0.5em;
    }
  }

  .video-js .vjs-menu li {
    text-transform: capitalize;
  }

  .video-js .vjs-menu-item {
    position: relative;
  }

  .video-js .vjs-progress-control:hover .vjs-progress-holder {
    font-size: 1.8em;
  }

  .vjs-icon-hd,
  .vjs-icon-cog,
  .vjs-icon-subtitles {
    font-family: VideoJS; /* stylelint-disable-line font-family-no-missing-generic-family-keyword */
  }

  /* CUSTOM BUTTONS */
  [class^='icon-']::before,
  [class*=' icon-']::before {
    font-family: VideoJS; /* stylelint-disable-line font-family-no-missing-generic-family-keyword */
    font-size: 1.8em;
    position: relative;
    top: 1px;
  }

  .video-js .icon-angle-right,
  .video-js .icon-angle-left {
    cursor: pointer;
    flex: none;
  }

  .vjs-hide-button {
    display: none;
  }

  .vjs-error-display {
    &::before {
      display: none;
    }

    .vjs-modal-dialog-content {
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: ${({ theme }) => theme.fonts.large.fontFamily};
      font-size: ${({ theme }) => theme.fonts.large.fontSize} !important;
    }
  }

  ${({ playlistId, nextVideoId, prevVideoId }) => css`
    ${playlistId
      ? css`
          ${!nextVideoId
            ? css`
                .vjs-icon-next-item {
                  opacity: 0.4;
                  pointer-events: none;
                }
              `
            : css([])}
          ${!prevVideoId
            ? css`
                .vjs-icon-previous-item {
                  opacity: 0.4;
                  pointer-events: none;
                }
              `
            : css([])}
        `
      : css`
          .vjs-icon-previous-item,
          .vjs-icon-next-item {
            display: none;
          }
        `}
  `}
`;

class ThemedPlayer extends Component {
  constructor() {
    super();
    this.state = { playerReady: false, videoId: null };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.videoId !== state.videoId) {
      return {
        playerReady: false,
        videoId: props.videoId,
      };
    }
    return null;
  }

  componentDidUpdate(prevProps) {
    if (this.props.videoId && this.props.videoId !== prevProps.videoId) {
      this.loadVideoSources();
    }
    if (this.props.error && this.props.error !== prevProps.error) {
      this.showPlayerError(this.props.error);
    }
  }

  componentDidMount() {
    const options = {
      autoplay: true,
      controls: true,
      preload: 'auto',
      playbackRates: [0.5, 1, 1.5, 2],
      html5: {
        dash: {
          setXHRWithCredentialsForType: [null, true],
        },
      },
    };
    this.player = videojs(this.videoNode, options, this.onPlayerReady);
    if (this.props.videoId) {
      this.loadVideoSources();
    }
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  loadVideoSources() {
    this.props.preload(null);
    if (this.player) {
      this.player.reset();
      this.player.poster(
        `${process.env.REACT_APP_STREAMER_HOSTNAME}/${this.props.videoId}/poster.png`,
      );
      this.player.src({
        src: `${process.env.REACT_APP_STREAMER_HOSTNAME}/${this.props.videoId}/mpd.mpd`,
        type: 'application/dash+xml',
      });
      videojs.log.level('all');
      this.player.load();
      this.player.play();
      this.player.on('waiting', () => {
        console.log('waiting');
        this.player.addClass('vjs-custom-waiting');
        this.player.pause();
        setTimeout(() => {
          if (this.player) {
            this.player.play();
          }
        }, 2000);
      });
      this.player.on('playing', () => this.player.removeClass('vjs-custom-waiting'));
      this.player.on('timeupdate', () => {
        this.props.onTimeUpdate(this.player.currentTime(), this.player.duration());
      });
      this.player.on('ended', () => this.player.hasStarted(false));
      this.player.qualityPickerPlugin();
    }
  }

  showPlayerError(err) {
    if (this.player) {
      this.player.reset();
      this.player.error(err);
    }
  }

  addOrRemovePlayerButtons = () => {
    var Button = videojs.getComponent('Button');

    if (!this.player.getChild('controlBar').getChild('Next')) {
      var NextButton = videojs.extend(Button, {
        constructor: function() {
          Button.apply(this, arguments);
          this.addClass('icon-angle-right');
          this.addClass('vjs-icon-next-item');
          this.controlText('Next');
        },
        handleClick: () => {
          this.props.renderRedirect('Next');
        },
      });
      videojs.registerComponent('Next', NextButton);
      this.player.getChild('controlBar').addChild('Next', {}, 1);
    }

    if (!this.player.getChild('controlBar').getChild('Previous')) {
      var PrevButton = videojs.extend(Button, {
        constructor: function() {
          Button.apply(this, arguments);
          this.addClass('icon-angle-left');
          this.addClass('vjs-icon-previous-item');
          this.controlText('Previous');
        },
        handleClick: () => {
          this.props.renderRedirect('Previous');
        },
      });
      videojs.registerComponent('Previous', PrevButton);
      this.player.getChild('controlBar').addChild('Previous', {}, 0);
    }
  };

  onPlayerReady = () => {
    this.addOrRemovePlayerButtons();
    this.setState({ playerReady: true });
  };

  render() {
    const { playlistId, nextVideoId, prevVideoId } = this.props;

    return (
      <StyledVideoContainer
        playlistId={playlistId}
        nextVideoId={nextVideoId}
        prevVideoId={prevVideoId}
      >
        <video
          className="video-js vjs-16-9"
          preload="auto"
          ref={node => {
            this.videoNode = node;
          }}
        />
      </StyledVideoContainer>
    );
  }
}

export default withPreload(ThemedPlayer);
