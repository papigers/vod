import React, { Component } from 'react';
import { Flex, Box } from 'grid-styled';
import { Link } from 'react-router-dom';

import { Persona, PersonaSize } from 'office-ui-fabric-react/lib/Persona';
import { Label } from 'office-ui-fabric-react/lib/Label';

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
                <p>סרטון מטורףףף</p>
            </Flex>
        );
    }
}

export default VideoComment;