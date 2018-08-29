import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { transitions } from 'polished';
import { Box } from 'grid-styled';
import axios from 'axios';

import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Pivot, PivotItem, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';

import VideoList from 'components/VideoList';


const ContentBox = styled(Box).attrs({
  pr: 100,
  pl: 30,
})``;

const TitleBox = ContentBox.extend`
  background-color: ${({theme}) => theme.palette.neutralLighterAlt};
`;

const ChannelPivot = styled(Pivot)`
  .ms-Pivot-linkContent {
    min-width: 110px;
  }

  .ms-Pivot-link:before {
    border-bottom-width: 4px;
    ${transitions('background-color 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)', 'left 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)', 'right 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)', 'border 0.267s cubic-bezier(0.1, 0.25, 0.75, 0.9)')}
  }
  .ms-Pivot-link:not(.is-selected):before {
    left: 50%;
    right: 50%;
  }
`

export default class Channel extends Component {

  constructor() {
    super();
    this.state = {
      uploads: [],
    };
  }

  componentDidMount() {
    this.fetchUploads();
  }

  fetchUploads = () => {
    const { channel } = this.props;

    axios.get(`${process.env.REACT_APP_API_HOSTNAME}/api/channels/${channel.id}/videos`)
    .then(({ data }) => {
      this.setState({
        uploads: data,
      });
    })
    .catch(console.error); 
  };

  render() {
    const { channel } = this.props;

    return (
      <Fragment>
        <Image height={280} src={channel.cover} imageFit={ImageFit.cover} maximizeFrame />
        <TitleBox>
          <Box py={20}>
            <Persona imageUrl={channel.picture} primaryText={channel.name} size={PersonaSize.size72} />
          </Box>
          <ChannelPivot linkSize={PivotLinkSize.large} headersOnly>
            <PivotItem linkText="בית" />
            <PivotItem linkText="סרטונים" />
            <PivotItem linkText="פלייליסטים" />
            <PivotItem itemIcon="Search" />
          </ChannelPivot>
        </TitleBox>
        <ContentBox>
          <VideoList category="העלאות" videos={this.state.uploads} />
        </ContentBox>
      </Fragment>
    );
  }
}
