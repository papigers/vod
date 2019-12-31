import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import { Link } from 'react-router-dom';

import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';

const CommentText = styled.p`
  margin: 5px;
`;

class VideoComment extends Component {
  postTimeCalculate = createdAt => {
    var commentCreationDate = new Date(this.props.createdAt);
    var now = new Date().getTime();
    var milisecDiff = now - commentCreationDate;

    var daysDiff = Math.floor(milisecDiff / 1000 / 60 / (60 * 24));

    if (daysDiff > 730) return `פורסם לפני ${Math.floor(daysDiff / 365)} שנים`;
    else if (daysDiff >= 365) return `פורסם לפני שנה`;
    else if (daysDiff > 60) return `פורסם לפני ${Math.floor(daysDiff / 30)} חודשים`;
    else if (daysDiff === 1) return `פורסם לפני יום`;
    else if (daysDiff === 0) {
      var hoursDiff = Math.floor(milisecDiff / 1000 / 60 / (60));
      if(hoursDiff === 0)
      {
        var minutesDiff = Math.floor(milisecDiff / 1000 / 60);
        if(minutesDiff === 0)
          return `פורסם עכשיו`
          if(minutesDiff === 1) return `פורסם לפני דקה`; else return `פורסם לפני ${minutesDiff} דקות`;
      }
      if(hoursDiff === 1) return `פורסם לפני שעה`; else return `פורסם לפני ${hoursDiff} שעות`;
    } 
    else return `פורסם לפני ${daysDiff} ימים`;
  };

  render() {
    const { channel, createdAt, comment } = this.props;

    return (
      <Box mb={18}>
        <Flex>
          <Box width={200}>
            <Link to={`/channel/${channel.id}`}>
              <Persona
                size={PersonaSize.size40}
                imageUrl={`/profile/${channel.id}/profile.png`}
                text={channel.name}
                secondaryText={this.postTimeCalculate(createdAt)}
              />
            </Link>
          </Box>
          <Box>
            <CommentText>{comment}</CommentText>
          </Box>
        </Flex>
      </Box>
    );
  }
}

export default VideoComment;
