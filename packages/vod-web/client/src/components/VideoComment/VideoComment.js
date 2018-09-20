import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import { Link } from 'react-router-dom';

import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Label } from 'office-ui-fabric-react/lib/Label';


const CommentText = styled.p`
  margin: 5px;
`;

const CommentSection = styled.div`
  margin-bottom: 15px;
`;

class VideoComment extends Component {
  // onRenderPersona = ()  =>  {
  //   // Calculate how much time have past
  // }
    render(){
      // const {
      //   channel: {
      //     name,
      //     imageurl,
      //     link,
      //   },
      //   timepost,
      //   comment,
      // } = this.props;

        return(
          <CommentSection>
            <Flex>
                <Box width={200}>
                  <Link to={`/channel/s7591665`}>
                    <Persona
                        size={PersonaSize.size40}
                        imageUrl={null}
                        text={"גרשון ח פפיאשוילי"}
                        secondaryText={"לפני 5 ימים"}
                    />
                  </Link>
                </Box>
                <Box>
                <CommentText>סרטון מטורףףף</CommentText>
                </Box>
            </Flex>
          </CommentSection>
        );
    }
}

export default VideoComment;