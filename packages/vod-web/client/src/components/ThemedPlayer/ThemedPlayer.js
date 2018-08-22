import React, { Component } from 'react';
import styled from 'styled-components';
import { darken, rgba, lighten } from 'polished';
import videojs from 'video.js';

const StyledVideoContainer = styled.div`
  --fg-color: #fff;
  --bg-color: ${({theme}) => theme.palette.themePrimary};

  .video-js {
    /* The base font size controls the size of everything, not just text.
      All dimensions use em-based sizes so that the scale along with the font size.
      Try increasing it to 15px and see what happens. */
    font-size: 12px;
    /* The main font color changes the ICON COLORS as well as the text */
    color: var(--fg-color);
  }

  /* The "Big Play Button" is the play button that shows before the video plays.
    To center it set the align values to center and middle. The typical location
    of the button is the center, but there is trend towards moving it to a corner
    where it gets out of the way of valuable content in the poster image.*/
  .video-js .vjs-big-play-button {
    /* The font size is what makes the big play button...big. 
      All width/height values use ems, which are a multiple of the font size.
      If the .video-js font-size is 10px, then 3em equals 30px.*/
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
    background-color: transparent;
  }

  .video-js .vjs-menu-button .vjs-menu-content {
    background-color: rgba(0, 0, 0, 0.75);
    border-radius: 0.15em;
  }

  .video-js .vjs-menu li.vjs-selected, .vjs-menu li.vjs-selected:focus, .vjs-menu li.vjs-selected:hover {
    &, & sup {
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

  /* The slider bar color is used for the progress bar and the volume bar
    (the first two can be removed after a fix that's coming) */
  .video-js {
    .vjs-volume-level,
    .vjs-play-progress,
    .vjs-slider-bar {
      background: var(--bg-color);
    }
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

  .video-js .vjs-menu li.vjs-menu-item:focus, .vjs-menu li.vjs-menu-item:hover {
    &:not(.vjs-selected) {
      background-color: rgba(255,255,255,0.25);
    }
  }

  .video-js .vjs-progress-holder {
    // margin: 0;
  }

  .video-js .vjs-progress-control {
    bottom: 58%;
    position: absolute;
    width: 100%;
  }

  .video-js:after {
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
    background: linear-gradient(transparent, transparent 60%, rgba(0,0,0,0.8));
  }

  .video-js.vjs-has-started.vjs-user-inactive.vjs-playing:after {
    opacity: 0;
  }

  .video-js .vjs-control-bar {
    z-index: 2;
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

  .video-js .vjs-menu sup {
    color: var(--bg-color);
    font-weight: 600;
    position: absolute;
    top: 1em;
    right: 1.8em;
  }

  .video-js .vjs-progress-control:hover .vjs-progress-holder {
    font-size: 1.8em;
  }

  .vjs-icon-hd,
  .vjs-icon-cog,
  .vjs-icon-subtitles {
    font-family: VideoJS;
  }
`;

export default class ThemedPlyr extends Component {
  constructor() {
    super();
    this.state = { playerReady: false };
  }
  
  componentDidMount() {
    const options = {
      ...this.props,
      autoplay: true,
      controls: true,
      preload: 'auto',
      playbackRates: [0.5, 1, 1.5, 2],
      poster: `${process.env.REACT_APP_STREAMER_HOSTNAME}/b0PCWLt690M9/poster.png`,
      sources: [{
        src: `${process.env.REACT_APP_STREAMER_HOSTNAME}/b0PCWLt690M9/mpd.mpd`,
        // src: `${process.env.REACT_APP_STREAMER_HOSTNAME}/FR5Ymgyk7yIG/mpd.mpd`,
        // src: '/video/oE5z2aha~4cn.mpd',
        // src: '/video/dHx4FL9HLmsA.mpd',
        // src: '/video/iFWs2IQWcIgO.mpd',
        // src: '/video/FbC2bIPoRKPL.mpd',
        // src: '/video/FkVwFT7kuHou.mpd',
        // src: '/video/I-Am-Legend-Trailer.mpd',
        // src: 'http://www.bok.net/dash/tears_of_steel/cleartext/stream.mpd',
        // src: 'https://s3.amazonaws.com/_bc_dml/example-content/sintel_dash/sintel_vod.mpd',
        type: 'application/dash+xml',
      }, {
        src: 'https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8',
        type: 'application/x-mpegURL',
      }],
    };
    this.player = videojs(this.videoNode, options, this.onPlayerReady);
    this.player.qualityPickerPlugin();
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  onPlayerReady = () => {
    this.setState({ playerReady: true });
  }

  render() {
    return (
      // <h1>Shit</h1>
      <StyledVideoContainer>
        <video
          className="video-js vjs-16-9"
          ref={ node => {
            this.videoNode = node;
          }}
        />
      </StyledVideoContainer>
    );
  }
}
