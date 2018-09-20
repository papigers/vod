import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import { Link } from 'react-router-dom';

import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';

const CommentText = styled.p`
  margin: 5px;
`;

const CommentSection = styled.div`
  margin-bottom: 15px;
`;

class VideoComment extends Component {

    postTimeCalculate = (createdAt)  =>  {
      var commentCreationDate = new Date(this.props.createdAt);
      var now = new Date().getTime();
      var milisecDiff = now - commentCreationDate;

      var daysDiff = Math.floor(milisecDiff / 1000 / 60 / (60 * 24));
      
      switch(daysDiff){
        case (daysDiff > 365):
          return `פורסם לפני ${Math.floor(daysDiff / 365)} שנים`;
        case (daysDiff > 30):
          return `פורסם לפני ${Math.floor(daysDiff / 30)} חודשים`;
        case (daysDiff):
          return `פורסם היום`;
        default:
         return `פורסם לפני ${daysDiff} ימים`;
      }
    }

    render(){
      const {
        channel,
        createdAt,
        comment,
       } = this.props;

       console.log(this.props);

        return(
          <CommentSection>
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
          </CommentSection>
        );
    }
}

export default VideoComment;